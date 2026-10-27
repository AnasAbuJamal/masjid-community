import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
export async function GET(req: NextRequest) {
  const identity = await getApiIdentity(req);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const donations = await prisma.donation.findMany({
    where: { userId: identity.id },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json(donations.map(d => ({
    id: String(d.id), amount: d.amount / 100,
    category: ["sadaqah", "zakat", "fitra", "ramadan", "construction", "building"].includes(d.campaign || "") ?
      d.campaign : "other",
    status: d.status, date: d.createdAt.toISOString(), isRecurring: d.isRecurring,
    // Only customer-facing Stripe URLs may appear in mobile receipt screens.
    receiptUrl: d.receiptUrl && /^https:\/\/(?:pay\.stripe\.com|invoice\.stripe\.com)\//.test(d.receiptUrl) ?
      d.receiptUrl : null,
  })), { headers: { "Cache-Control": "private, no-store" } });
}

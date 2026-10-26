import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const campaigns = [
  { id: "general", name: "General Fund", description: "Support daily masjid operations" },
  { id: "construction", name: "Expansion Project", description: "Support building improvements" },
  { id: "ramadan", name: "Ramadan Fund", description: "Community programs during Ramadan" },
];
export async function GET() {
  const totals = await prisma.donation.groupBy({
    by: ["campaign"], where: { status: "completed" }, _sum: { amount: true },
  });
  const raised = new Map(totals.map(t => [t.campaign || "general", (t._sum.amount || 0) / 100]));
  return NextResponse.json({ campaigns: campaigns.map(c => ({
    ...c, raised: raised.get(c.id) || 0, goal: null,
  })) }, { headers: { "Cache-Control": "no-store" } });
}

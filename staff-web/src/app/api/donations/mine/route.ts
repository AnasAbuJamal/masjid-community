import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const donations = await prisma.donation.findMany({
    where: { donorEmail: { equals: session.user.email, mode: "insensitive" } },
    select: { id: true, amount: true, campaign: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json(donations.map(d => ({ id: String(d.id), amount: d.amount / 100, category: d.campaign, status: d.status, date: d.createdAt })), { headers: { "Cache-Control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const search = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 120);
  const page = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("page")) || 1));
  const limit = 50;
  const where = {
    status: "completed" as const, isAnonymous: false,
    donorEmail: { not: null },
    ...(search ? { OR: [
      { donorEmail: { contains: search, mode: "insensitive" as const } },
      { donorName: { contains: search, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [grouped, aggregate, anonymousTotals] = await Promise.all([
    prisma.donation.groupBy({
      by: ["donorEmail"], where,
      _sum: { amount: true }, _count: { _all: true }, _max: { createdAt: true },
      orderBy: { _sum: { amount: "desc" } },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.donation.aggregate({
      where: { status: "completed" }, _sum: { amount: true }, _count: { _all: true },
    }),
    prisma.donation.aggregate({
      where: { status: "completed", isAnonymous: true },
      _sum: { amount: true }, _count: { _all: true },
    }),
  ]);
  const emails = grouped.map(r => r.donorEmail).filter((email): email is string => !!email);
  const latest = emails.length ? await prisma.donation.findMany({
    where: { status: "completed", isAnonymous: false, donorEmail: { in: emails } },
    select: { donorEmail: true, donorName: true, createdAt: true },
    orderBy: { createdAt: "desc" }, take: 1000,
  }) : [];
  const names = new Map<string, string>();
  for (const donation of latest) {
    if (donation.donorEmail && !names.has(donation.donorEmail)) {
      names.set(donation.donorEmail, donation.donorName || "");
    }
  }
  return NextResponse.json({
    donors: grouped.map(row => ({
      id: row.donorEmail, email: row.donorEmail,
      name: names.get(row.donorEmail || "") || "Name not provided",
      totalDonated: (row._sum.amount || 0) / 100,
      donationCount: row._count._all,
      lastDonationDate: row._max.createdAt?.toISOString() || null,
    })),
    page, hasMore: grouped.length === limit,
    totals: {
      amount: (aggregate._sum.amount || 0) / 100,
      count: aggregate._count._all,
      anonymousAmount: (anonymousTotals._sum.amount || 0) / 100,
      anonymousCount: anonymousTotals._count._all,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

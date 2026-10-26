import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(_req: Request, { params }: { params: Promise<{ year: string; month: string }> }) {
  const { year, month } = await params;
  const y = Number(year), m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || y < 2000 || y > 2100 || m < 1 || m > 12)
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const prayers = await prisma.prayerTime.findMany({
    where: { date: { gte: start, lt: end } }, orderBy: { date: "asc" },
  });
  return NextResponse.json(prayers.map(p => ({
    fajr: p.fajr, sunrise: p.sunrise, dhuhr: p.dhuhr, asr: p.asr,
    maghrib: p.maghrib, isha: p.isha, jummah1: p.jummah1 ?? "",
    jummah2: p.jummah2 ?? "", date: p.date.toISOString().slice(0, 10),
  })));
}

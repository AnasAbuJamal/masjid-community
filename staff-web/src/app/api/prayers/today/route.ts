import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const p = await prisma.prayerTime.findFirst({ where: { date: { gte: start, lt: end } } });
  if (!p) return NextResponse.json({ error: "Prayer times have not been configured for today" }, { status: 404 });
  return NextResponse.json({
    fajr: p.fajr, sunrise: p.sunrise, dhuhr: p.dhuhr, asr: p.asr,
    maghrib: p.maghrib, isha: p.isha, jummah1: p.jummah1 ?? "",
    jummah2: p.jummah2 ?? "", date: p.date.toISOString().slice(0, 10),
  });
}

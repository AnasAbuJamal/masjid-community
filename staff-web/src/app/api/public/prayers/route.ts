import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams;
  const date = query.get("date");
  const month = Number(query.get("month"));
  const year = Number(query.get("year"));
  const days = Number(query.get("days") || 1);
  let start: Date;
  let end: Date;
  if (query.has("month") || query.has("year")) {
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }
    start = new Date(Date.UTC(year, month - 1, 1));
    end = new Date(Date.UTC(year, month, 1));
  } else {
    // Prayer dates are calendar dates stored at UTC midnight.
    const calendarDate = date || new Date().toLocaleDateString("en-CA", { timeZone: process.env.MASJID_TIME_ZONE || "America/New_York" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate) || !Number.isInteger(days) || days < 1 || days > 31) {
      return NextResponse.json({ error: "Invalid date or days" }, { status: 400 });
    }
    start = new Date(`${calendarDate}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== calendarDate) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    end = new Date(start.getTime() + days * 86400000);
  }
  try {
    const prayerTimes = await prisma.prayerTime.findMany({
      where: { date: { gte: start, lt: end } }, orderBy: { date: "asc" }, take: 31,
    });
    return NextResponse.json({ prayerTimes, ...(date ? { prayerTime: prayerTimes[0] || null } : {}) });
  } catch {
    return NextResponse.json({ error: "Prayer times are temporarily unavailable" }, { status: 503 });
  }
}

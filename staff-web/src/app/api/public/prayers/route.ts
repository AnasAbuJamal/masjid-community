import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (date) {
    const prayerTime = await prisma.prayerTime.findUnique({
      where: { date: new Date(date) },
    });
    return NextResponse.json({ prayerTime });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const prayerTimes = await prisma.prayerTime.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { date: "asc" },
    take: 7,
  });

  return NextResponse.json({ prayerTimes });
}

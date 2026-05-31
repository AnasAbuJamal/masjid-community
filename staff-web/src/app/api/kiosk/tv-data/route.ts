import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [prayers, announcements, projects, settings] = await Promise.all([
      prisma.prayerTime.findFirst({
        where: { date: { gte: today } },
        orderBy: { date: "asc" },
      }),
      prisma.kioskAnnouncement.findMany({
        where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        orderBy: { priority: "desc" },
        take: 10,
      }),
      prisma.constructionProject.findMany({
        orderBy: { progressPercent: "desc" },
        select: { id: true, title: true, progressPercent: true },
      }),
      prisma.siteSetting.findMany(),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      prayers,
      announcements: announcements.map((a) => ({ id: String(a.id), title: a.title, message: a.message, type: a.type })),
      projects,
      settings: settingsMap,
    });
  } catch {
    return NextResponse.json({
      prayers: null,
      announcements: [],
      projects: [],
      settings: {},
    });
  }
}

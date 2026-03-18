import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  
  const announcements = await prisma.kioskAnnouncement.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
  });

  return NextResponse.json({ announcements });
}

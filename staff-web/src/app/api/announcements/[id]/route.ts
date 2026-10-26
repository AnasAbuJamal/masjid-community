import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
  const announcement = await prisma.kioskAnnouncement.findFirst({
    where: { id: Number(id), isActive: true, startsAt: { lte: new Date() }, OR: [
      { expiresAt: null }, { expiresAt: { gte: new Date() } },
    ] },
    select: { id: true, title: true, message: true, type: true, createdAt: true },
  });
  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...announcement, id: String(announcement.id),
    date: announcement.createdAt.toISOString(),
  });
}

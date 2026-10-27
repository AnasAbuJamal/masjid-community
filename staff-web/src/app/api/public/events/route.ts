import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { isPublic: true, status: { in: ["scheduled", "ongoing"] },
      OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }] },
    orderBy: { startDate: "asc" }, take: 100,
    select: { id: true, title: true, description: true, location: true,
      startDate: true, endDate: true, category: true, status: true,
      capacity: true, _count: { select: { rsvps: true } } },
  });
  return NextResponse.json({ events: events.map(e => ({
    id: String(e.id), title: e.title, description: e.description, location: e.location,
    date: e.startDate.toISOString(), endDate: e.endDate?.toISOString() ?? null,
    category: e.category || "community", attendees: e._count.rsvps,
    capacity: e.capacity, status: e.status,
  })) }, { headers: { "Cache-Control": "no-store" } });
}

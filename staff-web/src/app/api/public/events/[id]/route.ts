import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  const event = await prisma.event.findFirst({
    where: { id: Number(raw), isPublic: true, status: { not: "cancelled" } },
    select: { id: true, title: true, description: true, location: true,
      startDate: true, endDate: true, category: true, status: true,
      capacity: true, _count: { select: { rsvps: true } } },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const user = await getApiIdentity(req);
  const registered = user ? await prisma.eventRSVP.findUnique({
    where: { eventId_email: { eventId: event.id, email: user.email } },
    select: { status: true },
  }) : null;
  return NextResponse.json({
    id: String(event.id), title: event.title, description: event.description,
    location: event.location, date: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    category: event.category || "community", attendees: event._count.rsvps,
    capacity: event.capacity, status: event.status, isRegistered: registered?.status === "attending",
  }, { headers: { "Cache-Control": "no-store" } });
}

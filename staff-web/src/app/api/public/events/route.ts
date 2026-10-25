import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id && (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))) return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  const session = req.headers.has("authorization") ? await auth() : null;
  const events = await prisma.event.findMany({
    where: { isPublic: true, status: { in: ["scheduled", "ongoing"] }, ...(id ? { id: Number(id) } : { startDate: { gte: new Date() } }) },
    select: {
      id: true, title: true, description: true, location: true, category: true, startDate: true, endDate: true, coverImage: true,
      _count: { select: { rsvps: { where: { status: "attending" } } } },
      rsvps: { where: { email: session?.user.email || "", status: "attending" }, select: { id: true } },
    }, orderBy: { startDate: "asc" }, take: 100,
  });
  return NextResponse.json({ events: events.map(({ _count, rsvps, ...event }) => ({
    ...event, id: String(event.id), date: event.startDate.toISOString(),
    time: event.startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: process.env.MASJID_TIME_ZONE || "America/New_York" }),
    category: event.category || "community", organizer: "Masjid Al-Momineen", attendees: _count.rsvps, isRegistered: rsvps.length > 0,
  })) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Sign in to register for an event" }, { status: 401 });
  const parsed = z.object({ eventId: z.coerce.number().int().positive() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  try {
    const result = await prisma.$transaction(async tx => {
      const event = await tx.event.findFirst({ where: { id: parsed.data.eventId, isPublic: true, status: { in: ["scheduled", "ongoing"] } } });
      if (!event || (event.endDate || event.startDate) < new Date()) return "unavailable";
      const existing = await tx.eventRSVP.findUnique({ where: { eventId_email: { eventId: event.id, email: session.user.email } } });
      if (existing?.status === "attending") return "registered";
      const count = await tx.eventRSVP.count({ where: { eventId: event.id, status: "attending" } });
      if (event.capacity !== null && count >= event.capacity) return "full";
      await tx.eventRSVP.upsert({ where: { eventId_email: { eventId: event.id, email: session.user.email } },
        update: { status: "attending", name: session.user.name },
        create: { eventId: event.id, email: session.user.email, name: session.user.name, status: "attending" },
      });
      return "registered";
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result === "full") return NextResponse.json({ error: "This event is full" }, { status: 409 });
    if (result === "unavailable") return NextResponse.json({ error: "This event is no longer accepting registrations" }, { status: 404 });
    return NextResponse.json({ registered: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return NextResponse.json({ error: "Please try registering again" }, { status: 409 });
    return NextResponse.json({ error: "Unable to register. Please try again." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Sign in to register" }, { status: 401 });
  if (!rateLimit(`event-rsvp:${getClientIp(req)}:${user.id}`, 15, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  const event = await prisma.event.findFirst({
    where: { id: Number(raw), isPublic: true, status: "scheduled", startDate: { gt: new Date() } },
    select: { id: true, capacity: true },
  });
  if (!event) return NextResponse.json({ error: "Registration is closed" }, { status: 404 });
  const existing = await prisma.eventRSVP.findUnique({
    where: { eventId_email: { eventId: event.id, email: user.email } },
    select: { id: true, status: true },
  });
  if (existing?.status === "attending") return NextResponse.json({ success: true, registered: true });
  const confirmedCount = await prisma.eventRSVP.count({
    where: { eventId: event.id, status: "attending" },
  });
  if (event.capacity !== null && confirmedCount >= event.capacity)
    return NextResponse.json({ error: "This event has reached capacity" }, { status: 409 });
  await prisma.eventRSVP.upsert({
    where: { eventId_email: { eventId: event.id, email: user.email } },
    create: { eventId: event.id, name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email, status: "attending" },
    update: { status: "attending" },
  });
  return NextResponse.json({ success: true, registered: true });
}

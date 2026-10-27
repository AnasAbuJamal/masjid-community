import { NextRequest, NextResponse } from "next/server";
import { AnnouncementType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const announcements = await prisma.kioskAnnouncement.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json({ announcements: announcements.map(a => ({
    id: String(a.id), title: a.title, message: a.message, type: a.type,
    priority: a.priority, isActive: a.isActive,
    startsAt: a.startsAt.toISOString(), expiresAt: a.expiresAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`announcement-create:${actor.id}:${getClientIp(req)}`, 30, 60 * 60000).success)
    return NextResponse.json({ error: "Too many announcements" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { title, message, type, priority, startsAt, expiresAt } = body;
  if (typeof title !== "string" || !title.trim() || title.length > 120 ||
      typeof message !== "string" || !message.trim() || message.length > 4000 ||
      !Object.values(AnnouncementType).includes(type) ||
      !Number.isInteger(priority) || priority < 0 || priority > 2)
    return NextResponse.json({ error: "Invalid announcement content or priority" }, { status: 400 });
  const date = startsAt ? new Date(startsAt) : new Date();
  const expires = expiresAt ? new Date(expiresAt) : null;
  if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() - 120000 ||
      (expires && (!Number.isFinite(expires.getTime()) || expires <= date)))
    return NextResponse.json({ error: "Invalid scheduled date or expiration" }, { status: 400 });

  const announcement = await prisma.kioskAnnouncement.create({
    data: {
      title: title.trim(), message: message.trim(),
      type, priority, startsAt: date, expiresAt: expires, isActive: true,
    },
  });
  await logAudit({
    action: "mobile_publish_announcement", userId: String(actor.id),
    details: `Created announcement ${announcement.id}`,
    ipAddress: getClientIp(req),
  });
  return NextResponse.json({
    id: String(announcement.id),
    status: date > new Date() ? "scheduled" : "published",
    startsAt: announcement.startsAt.toISOString(),
  }, { status: 201 });
}

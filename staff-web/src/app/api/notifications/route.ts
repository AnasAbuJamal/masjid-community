import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get("page")) || 1));
  const limit = 30;
  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const where: Prisma.NotificationWhereInput = {
    userId: user.id, ...(unreadOnly ? { isRead: false } : {}),
  };
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where, select: {
        id: true, title: true, message: true, type: true, link: true,
        isRead: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);
  return NextResponse.json({
    notifications: notifications.map(n => ({
      ...n, id: String(n.id),
    })),
    total, unreadCount, page, hasMore: page * limit < total,
    totalPages: Math.ceil(total / limit),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || body.markAllRead !== true || Object.keys(body).length !== 1)
    return NextResponse.json({ error: "Invalid notification operation" }, { status: 400 });
  const result = await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ success: true, changed: result.count });
}

export async function DELETE(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    const removed = await prisma.notification.deleteMany({
      where: { id: Number(id), userId: user.id },
    });
    if (!removed.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  }
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true });
}

export async function createNotification(
    userId: string,
    data: {
        type: "info" | "success" | "warning" | "error" | "donation" | "volunteer" | "proposal" | "job" | "assignment" | "attendance" | "system";
        title: string;
        message: string;
        link?: string;
        metadata?: Record<string, unknown> | null;
    }
) {
    return prisma.notification.create({
        data: {
            userId: Number(userId),
            type: data.type as "info" | "success" | "warning" | "error" | "donation" | "volunteer" | "proposal" | "job" | "assignment" | "attendance" | "system",
            title: data.title,
            message: data.message,
            link: data.link || undefined,
            metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
    });
}

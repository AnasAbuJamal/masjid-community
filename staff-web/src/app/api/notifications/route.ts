import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { notificationId, notificationQuery, notificationMutation } from "@/lib/notification-input";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const parsed = notificationQuery.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Invalid notification filters" }, { status: 400 });
    const { page, limit } = parsed.data;
    const unreadOnly = parsed.data.unreadOnly === 'true';

    const where: Prisma.NotificationWhereInput = { userId: session.user.id };

    if (unreadOnly) {
        where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: { userId: session.user.id, isRead: false },
        }),
    ]);

    return NextResponse.json({
        notifications,
        total,
        unreadCount,
        page,
        totalPages: Math.ceil(total / limit),
    }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = notificationMutation.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid notification update" }, { status: 400 });
    if ('markAllRead' in parsed.data) {
        await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
        return NextResponse.json({ success: true });
    }
    const result = await prisma.notification.updateMany({ where: { id: parsed.data.id, userId: session.user.id }, data: { isRead: true } });
    return result.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Notification not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    // A malformed ID must never fall through to deletion of all notifications.
    if (searchParams.has('id')) {
        const parsed = notificationId.safeParse(searchParams.get('id'));
        if (!parsed.success) return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
        const result = await prisma.notification.deleteMany({ where: { id: parsed.data, userId: session.user.id } });
        return result.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    await prisma.notification.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true, message: "All notifications deleted" });
}

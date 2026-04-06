import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

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
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
        await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true },
        });
        return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!id) {
        return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });

    return NextResponse.json(notification);
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
        await prisma.notification.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    }

    await prisma.notification.deleteMany({
        where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, message: "All notifications deleted" });
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
            userId,
            type: data.type as "info" | "success" | "warning" | "error" | "donation" | "volunteer" | "proposal" | "job" | "assignment" | "attendance" | "system",
            title: data.title,
            message: data.message,
            link: data.link || undefined,
            metadata: data.metadata as Prisma.InputJsonValue | null | undefined,
        },
    });
}

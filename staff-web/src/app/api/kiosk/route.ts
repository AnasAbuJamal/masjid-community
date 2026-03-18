import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcements = await prisma.kioskAnnouncement.findMany({
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (body.startsAt) body.startsAt = new Date(body.startsAt);
    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

    const announcement = await prisma.kioskAnnouncement.create({ data: body });
    await logAudit({ action: "create_announcement", userId: session.user.id, details: `Created announcement "${body.title}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(announcement, { status: 201 });
}

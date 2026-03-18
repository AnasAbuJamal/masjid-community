import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    if (body.startsAt) body.startsAt = new Date(body.startsAt);
    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

    const announcement = await prisma.kioskAnnouncement.update({ where: { id }, data: body });
    await logAudit({ action: "update_announcement", userId: session.user.id, details: `Updated announcement ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(announcement);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.kioskAnnouncement.delete({ where: { id } });
    await logAudit({ action: "delete_announcement", userId: session.user.id, details: `Deleted announcement ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

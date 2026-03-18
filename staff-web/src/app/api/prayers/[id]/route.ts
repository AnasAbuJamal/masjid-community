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
    if (body.date) body.date = new Date(body.date);

    const prayer = await prisma.prayerTime.update({ where: { id }, data: body });
    await logAudit({ action: "update_prayer", userId: session.user.id, details: `Updated prayer ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(prayer);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.prayerTime.delete({ where: { id } });
    await logAudit({ action: "delete_prayer", userId: session.user.id, details: `Deleted prayer ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

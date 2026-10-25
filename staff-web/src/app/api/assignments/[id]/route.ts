import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    if (body.date) body.date = new Date(body.date);

    const assignment = await prisma.assignment.update({ where: { id }, data: body });
    await logAudit({ action: "update_assignment", userId: session.user.id, details: `Updated assignment ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(assignment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await prisma.assignment.delete({ where: { id } });
    await logAudit({ action: "delete_assignment", userId: session.user.id, details: `Deleted assignment ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

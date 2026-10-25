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
    const cls = await prisma.class.update({
        where: { id: id },
        data: body
    });
    await logAudit({ action: "update_class", userId: session.user.id, details: `Updated class ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(cls);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await prisma.class.delete({
        where: { id: id }
    });
    await logAudit({ action: "delete_class", userId: session.user.id, details: `Deleted class ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

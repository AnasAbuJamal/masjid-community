import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const cls = await prisma.class.update({ where: { id }, data: body });
    await logAudit({ action: "update_class", userId: session.user.id, details: `Updated class ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(cls);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.class.delete({ where: { id } });
    await logAudit({ action: "delete_class", userId: session.user.id, details: `Deleted class ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

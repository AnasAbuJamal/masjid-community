import { classInput } from "@/lib/class-input";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    const parsed = classInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid class details" }, { status: 400 });
    const body = parsed.data;
    if (body.teacherId && !await prisma.user.findFirst({ where: { id: body.teacherId, role: "teacher", isActive: true }, select: { id: true } })) return NextResponse.json({ error: "Choose an active teacher account" }, { status: 400 });
    const cls = await prisma.class.update({ 
        where: { id: parseInt(id) }, 
        data: body 
    });
    await logAudit({ action: "update_class", userId: session.user.id, details: `Updated class ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(cls);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await prisma.class.delete({ 
        where: { id: parseInt(id) } 
    });
    await logAudit({ action: "delete_class", userId: session.user.id, details: `Deleted class ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

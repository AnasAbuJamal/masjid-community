import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    if (body.date) body.date = new Date(body.date);

    const assignment = await prisma.assignment.update({ where: { id }, data: body });
    await logAudit({ action: "update_assignment", userId: session.user.id, details: `Updated assignment ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(assignment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.assignment.delete({ where: { id } });
    await logAudit({ action: "delete_assignment", userId: session.user.id, details: `Deleted assignment ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

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
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    if (body.reviewedAt) body.reviewedAt = new Date(body.reviewedAt);

    const proposal = await prisma.projectProposal.update({ where: { id }, data: body });
    await logAudit({ action: "update_proposal", userId: session.user.id, details: `Updated proposal ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(proposal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.projectProposal.delete({ where: { id } });
    await logAudit({ action: "delete_proposal", userId: session.user.id, details: `Deleted proposal ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

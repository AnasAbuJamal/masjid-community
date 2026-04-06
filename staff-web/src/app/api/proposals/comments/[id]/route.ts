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
    const { message, isInternal } = await req.json();

    const comment = await prisma.proposalComment.update({
        where: { id },
        data: {
            ...(message && { message }),
            ...(isInternal !== undefined && { isInternal }),
        },
    });

    await logAudit({ action: "update_proposal_comment", userId: session.user.id, details: `Updated comment ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(comment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.proposalComment.delete({ where: { id } });
    await logAudit({ action: "delete_proposal_comment", userId: session.user.id, details: `Deleted comment ${id}`, ipAddress: "" });
    return NextResponse.json({ success: true });
}

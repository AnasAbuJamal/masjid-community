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

    if (body.totalBudget !== undefined) body.totalBudget = parseFloat(String(body.totalBudget));
    if (body.volunteersNeeded !== undefined) body.volunteersNeeded = body.volunteersNeeded !== null ? parseInt(String(body.volunteersNeeded)) : null;
    if (body.reviewedBy !== undefined) body.reviewedBy = body.reviewedBy !== null ? parseInt(String(body.reviewedBy)) : null;
    if (body.actualSpent !== undefined) body.actualSpent = body.actualSpent !== null ? parseFloat(String(body.actualSpent)) : null;
    if (body.completionPercent !== undefined) body.completionPercent = body.completionPercent !== null ? parseInt(String(body.completionPercent)) : null;
    if (body.isFundingSecured !== undefined) body.isFundingSecured = body.isFundingSecured === true || body.isFundingSecured === "true";
    if (body.isCompleted !== undefined) body.isCompleted = body.isCompleted === true || body.isCompleted === "true";

    const proposal = await prisma.projectProposal.update({ 
        where: { id: parseInt(id) }, 
        data: body 
    });
    await logAudit({ action: "update_proposal", userId: session.user.id, details: `Updated proposal ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(proposal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.projectProposal.delete({ 
        where: { id: parseInt(id) } 
    });
    await logAudit({ action: "delete_proposal", userId: session.user.id, details: `Deleted proposal ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

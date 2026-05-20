import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ProposalStatus } from "@prisma/client";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const where = status ? { status: status as ProposalStatus } : {};

    const proposals = await prisma.projectProposal.findMany({
        where,
        include: { comments: { orderBy: { createdAt: "desc" }, take: 3 } },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ proposals });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);

    if (body.totalBudget !== undefined) body.totalBudget = parseFloat(String(body.totalBudget));
    if (body.volunteersNeeded !== undefined) body.volunteersNeeded = body.volunteersNeeded !== null ? parseInt(String(body.volunteersNeeded)) : null;
    if (body.reviewedBy !== undefined) body.reviewedBy = body.reviewedBy !== null ? parseInt(String(body.reviewedBy)) : null;
    if (body.actualSpent !== undefined) body.actualSpent = body.actualSpent !== null ? parseFloat(String(body.actualSpent)) : null;
    if (body.completionPercent !== undefined) body.completionPercent = body.completionPercent !== null ? parseInt(String(body.completionPercent)) : null;

    const proposal = await prisma.projectProposal.create({ data: body });
    await logAudit({ action: "create_proposal", userId: session.user.id, details: `Created proposal "${body.title}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(proposal, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const proposalId = searchParams.get("proposalId");
    const internal = searchParams.get("internal");

    const where: Prisma.ProposalCommentWhereInput = {};
    if (proposalId) where.proposalId = proposalId;
    if (internal !== null) where.isInternal = internal === "true";

    const comments = await prisma.proposalComment.findMany({
        where,
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { proposalId, message, isInternal } = await req.json();

    if (!proposalId || !message) {
        return NextResponse.json({ error: "Proposal ID and message are required" }, { status: 400 });
    }

    const comment = await prisma.proposalComment.create({
        data: {
            proposalId,
            authorName: session.user.name || "Staff",
            authorRole: session.user.role,
            message,
            isInternal: isInternal || false,
        },
    });

    await logAudit({ action: "add_proposal_comment", userId: session.user.id, details: `Added comment to proposal ${proposalId}`, ipAddress: getClientIp(req) });
    return NextResponse.json(comment, { status: 201 });
}

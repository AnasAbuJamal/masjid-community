import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = status ? { status: status as any } : {};

    const [applications, total] = await Promise.all([
        prisma.studentApplication.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.studentApplication.count({ where }),
    ]);

    return NextResponse.json({ applications, total, page, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, action, notes } = body;

        if (!id || !action) {
            return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
        }

        const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : undefined;
        if (!newStatus) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const application = await prisma.studentApplication.update({
            where: { id },
            data: {
                status: newStatus,
                reviewedBy: session.user.id,
                reviewedAt: new Date(),
                notes: notes,
            },
        });

        await logAudit({
            action: action === "approve" ? "approve_student_application" : "reject_student_application",
            userId: session.user.id,
            details: `${action === "approve" ? "Approved" : "Rejected"} student application for "${application.studentName}"`,
            ipAddress: getClientIp(req),
        });

        return NextResponse.json(application);
    } catch (error) {
        console.error("Error updating student application:", error);
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}
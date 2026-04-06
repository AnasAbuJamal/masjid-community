import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where: Prisma.ContactSubmissionWhereInput = {};
    if (status) {
        where.status = status as Prisma.EnumContactStatusFilter;
    }

    const [submissions, total, stats] = await Promise.all([
        prisma.contactSubmission.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.contactSubmission.count({ where }),
        prisma.contactSubmission.groupBy({
            by: ["status"],
            _count: true,
        }),
    ]);

    const statusCounts: Record<string, number> = {};
    stats.forEach((s) => {
        statusCounts[s.status] = s._count;
    });

    return NextResponse.json({
        submissions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: {
            pending: statusCounts["pending"] || 0,
            in_progress: statusCounts["in_progress"] || 0,
            resolved: statusCounts["resolved"] || 0,
            closed: statusCounts["closed"] || 0,
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const { name, email, phone, subject, message } = await req.json();

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: "All fields required" }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });
        }

        const submission = await prisma.contactSubmission.create({
            data: {
                name,
                email: email.toLowerCase(),
                phone: phone || null,
                subject,
                message,
                status: "pending",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Message sent successfully",
            id: submission.id,
        }, { status: 201 });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}

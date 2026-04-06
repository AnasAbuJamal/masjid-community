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
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");
    const resolved = searchParams.get("resolved");

    const where: Prisma.ErrorLogWhereInput = {};
    if (type) where.type = type as Prisma.EnumErrorTypeFilter;
    if (resolved !== null && resolved !== undefined) where.resolved = resolved === "true";

    const [errors, total, stats] = await Promise.all([
        prisma.errorLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.errorLog.count({ where }),
        prisma.errorLog.groupBy({
            by: ["type"],
            _count: true,
        }),
    ]);

    const typeCounts: Record<string, number> = {};
    stats.forEach((s) => {
        typeCounts[s.type] = s._count;
    });

    const unresolvedCount = await prisma.errorLog.count({ where: { resolved: false } });

    return NextResponse.json({
        errors,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: {
            byType: typeCounts,
            unresolved: unresolvedCount,
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, stack, type, path, method, statusCode, metadata } = body;

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        const error = await prisma.errorLog.create({
            data: {
                message,
                stack: stack || null,
                type: type || "server",
                path: path || null,
                method: method || null,
                statusCode: statusCode || null,
                metadata: metadata || null,
            },
        });

        return NextResponse.json(error, { status: 201 });
    } catch (error) {
        console.error("Error logging failed:", error);
        return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, resolved } = await req.json();

    if (!id) {
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const error = await prisma.errorLog.update({
        where: { id },
        data: { resolved },
    });

    return NextResponse.json(error);
}

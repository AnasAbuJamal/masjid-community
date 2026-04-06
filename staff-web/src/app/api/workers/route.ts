import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Prisma.WorkerProfileWhereInput = status ? { status: status as Prisma.EnumProfileStatusFilter } : {};

    const [profiles, total] = await Promise.all([
        prisma.workerProfile.findMany({
            where,
            include: { _count: { select: { applications: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.workerProfile.count({ where }),
    ]);

    return NextResponse.json({ profiles, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const profile = await prisma.workerProfile.create({ data: body });
    await logAudit({ action: "create_worker", userId: session.user.id, details: `Created worker profile for "${body.fullName}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(profile, { status: 201 });
}

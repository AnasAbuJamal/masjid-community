import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    const where: Prisma.EventWhereInput = {};

    if (status) {
        where.status = status as Prisma.EnumEventStatusFilter;
    }

    if (upcoming) {
        where.startDate = { gte: new Date() };
        where.status = "scheduled";
    }

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            include: {
                _count: { select: { rsvps: true } },
            },
            orderBy: { startDate: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.event.count({ where }),
    ]);

    return NextResponse.json({
        events,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (body.capacity !== undefined) {
        body.capacity = body.capacity !== null && body.capacity !== "" ? parseInt(String(body.capacity)) : null;
    }
    if (body.isAllDay !== undefined) body.isAllDay = body.isAllDay === true || body.isAllDay === "true";
    if (body.isPublic !== undefined) body.isPublic = body.isPublic === true || body.isPublic === "true";
    if (body.isRecurring !== undefined) body.isRecurring = body.isRecurring === true || body.isRecurring === "true";

    const createdByInt = session.user.id ? parseInt(session.user.id) : null;

    const event = await prisma.event.create({
        data: {
            ...body,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : null,
            createdBy: createdByInt,
        },
    });

    await logAudit({
        action: "create_event",
        entity: "event",
        entityId: String(event.id),
        userId: session.user.id,
        details: `Created event: ${body.title}`,
        ipAddress: getClientIp(req),
        success: true,
    });

    return NextResponse.json(event, { status: 201 });
}

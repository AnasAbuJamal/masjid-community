import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const month = searchParams.get("month");

    const where = month
        ? {
            date: {
                gte: new Date(`${month}-01`),
                lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
            },
        }
        : {};

    const [prayers, total] = await Promise.all([
        prisma.prayerTime.findMany({
            where,
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.prayerTime.count({ where }),
    ]);

    return NextResponse.json({ prayers, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const prayer = await prisma.prayerTime.upsert({
        where: { date: new Date(body.date) },
        update: { ...body, date: new Date(body.date) },
        create: { ...body, date: new Date(body.date) },
    });

    await logAudit({
        action: "upsert_prayer",
        userId: session.user.id,
        details: `Prayer times for ${body.date}`,
        ipAddress: getClientIp(req),
    });

    return NextResponse.json(prayer, { status: 201 });
}

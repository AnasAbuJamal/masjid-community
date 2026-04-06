import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const itemId = searchParams.get("itemId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;

    const [bookings, total] = await Promise.all([
        prisma.rentalBooking.findMany({
            where,
            include: { item: { select: { name: true, category: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.rentalBooking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, totalPages: Math.ceil(total / limit) });
}
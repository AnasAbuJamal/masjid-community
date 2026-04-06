import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const available = searchParams.get("available");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (category) where.category = category;
    if (available !== null) where.isAvailable = available === "true";

    const [items, total] = await Promise.all([
        prisma.rentalItem.findMany({
            where,
            orderBy: { name: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.rentalItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const item = await prisma.rentalItem.create({
            data: {
                name: body.name,
                description: body.description,
                category: body.category || "other",
                imageUrl: body.imageUrl,
                priceHourly: body.priceHourly,
                priceDaily: body.priceDaily,
                isAvailable: body.isAvailable ?? true,
            },
        });

        await logAudit({
            action: "create_rental_item",
            userId: session.user.id,
            details: `Created rental item "${body.name}"`,
            ipAddress: getClientIp(req),
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("Error creating rental item:", error);
        return NextResponse.json({ error: "Failed to create rental item" }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");

    const where: any = { isAvailable: true };
    if (category) where.category = category;

    const items = await prisma.rentalItem.findMany({
        where,
        select: {
            id: true,
            name: true,
            description: true,
            category: true,
            imageUrl: true,
            priceHourly: true,
            priceDaily: true,
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
}
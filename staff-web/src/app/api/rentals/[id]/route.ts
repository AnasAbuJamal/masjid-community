import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const item = await prisma.rentalItem.findUnique({
            where: { id },
            include: {
                bookings: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
        if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const item = await prisma.rentalItem.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.category && { category: body.category }),
                ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
                ...(body.priceHourly !== undefined && { priceHourly: body.priceHourly }),
                ...(body.priceDaily !== undefined && { priceDaily: body.priceDaily }),
                ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
            },
        });

        await logAudit({
            action: "update_rental_item",
            userId: session.user.id,
            details: `Updated rental item "${body.name || id}"`,
            ipAddress: getClientIp(req),
        });

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await prisma.rentalItem.delete({ where: { id } });

        await logAudit({
            action: "delete_rental_item",
            userId: session.user.id,
            details: `Deleted rental item "${id}"`,
            ipAddress: getClientIp(req),
        });

        return NextResponse.json({ message: "Item deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
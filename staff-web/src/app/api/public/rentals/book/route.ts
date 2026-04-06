import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { itemId, renterName, renterEmail, renterPhone, eventName, startDate, endDate, priceType } = body;

        if (!itemId || !renterName || !renterEmail || !renterPhone || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const item = await prisma.rentalItem.findUnique({ where: { id: itemId } });
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        let totalPrice = 0;
        if (priceType === "hourly" && item.priceHourly) {
            totalPrice = hours * item.priceHourly;
        } else if (priceType === "daily" && item.priceDaily) {
            totalPrice = item.priceDaily;
        } else {
            totalPrice = item.priceDaily || 0;
        }

        const booking = await prisma.rentalBooking.create({
            data: {
                itemId,
                renterName,
                renterEmail,
                renterPhone,
                eventName: eventName || null,
                startDate: start,
                endDate: end,
                totalPrice,
                status: "pending",
            },
        });

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        console.error("Error creating booking:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
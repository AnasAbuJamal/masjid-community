import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { itemId: rawItemId, renterName, renterEmail, renterPhone, eventName, startDate, endDate, priceType } = body;

        const itemId = Number(rawItemId);
        if (!Number.isSafeInteger(itemId) || itemId < 1 || !renterName || !renterEmail || !renterPhone || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const item = await prisma.rentalItem.findUnique({ where: { id: itemId } });
        if (!item || !item.isAvailable) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || start < new Date()) {
            return NextResponse.json({ error: "Choose a future start date and an end date after the start" }, { status: 400 });
        }
        if (!["hourly", "daily"].includes(priceType)) return NextResponse.json({ error: "Choose hourly or daily pricing" }, { status: 400 });
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        let totalPrice = 0;
        if (priceType === "hourly" && item.priceHourly !== null) {
            totalPrice = hours * item.priceHourly;
        } else if (priceType === "daily" && item.priceDaily !== null) {
            totalPrice = Math.ceil(hours / 24) * item.priceDaily;
        } else {
            return NextResponse.json({ error: "This pricing option is unavailable" }, { status: 400 });
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
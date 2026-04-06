import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");

    const where: Prisma.EventRSVPWhereInput = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status as Prisma.EnumRSVPStatusFilter;

    const rsvps = await prisma.eventRSVP.findMany({
        where,
        include: { event: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rsvps);
}

export async function POST(req: NextRequest) {
    const { eventId, name, email, phone, status } = await req.json();

    if (!eventId || !name || !email) {
        return NextResponse.json({ error: "Event ID, name, and email are required" }, { status: 400 });
    }

    const existing = await prisma.eventRSVP.findFirst({
        where: { eventId, email },
    });

    if (existing) {
        const rsvp = await prisma.eventRSVP.update({
            where: { id: existing.id },
            data: { status: status || "attending", phone },
        });
        return NextResponse.json(rsvp);
    }

    const rsvp = await prisma.eventRSVP.create({
        data: {
            eventId,
            name,
            email,
            phone: phone || null,
            status: status || "attending",
        },
    });

    return NextResponse.json(rsvp, { status: 201 });
}

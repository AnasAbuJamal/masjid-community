import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            rsvps: true,
        },
    });

    if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const event = await prisma.event.update({
        where: { id },
        data: {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        },
    });

    await logAudit({
        action: "update_event",
        entity: "event",
        entityId: event.id,
        userId: session.user.id,
        details: `Updated event: ${event.title}`,
        ipAddress: getClientIp(req),
        success: true,
    });

    return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.eventRSVP.deleteMany({
        where: { eventId: id },
    });

    await prisma.event.delete({
        where: { id },
    });

    await logAudit({
        action: "delete_event",
        entity: "event",
        entityId: id,
        userId: session.user.id,
        details: `Deleted event`,
        ipAddress: getClientIp(req),
        success: true,
    });

    return NextResponse.json({ success: true });
}

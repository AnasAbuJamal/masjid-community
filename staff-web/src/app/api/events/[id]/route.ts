import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
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

    if (body.capacity !== undefined) {
        body.capacity = body.capacity !== null && body.capacity !== "" ? parseInt(String(body.capacity)) : null;
    }
    if (body.isAllDay !== undefined) body.isAllDay = body.isAllDay === true || body.isAllDay === "true";
    if (body.isPublic !== undefined) body.isPublic = body.isPublic === true || body.isPublic === "true";
    if (body.isRecurring !== undefined) body.isRecurring = body.isRecurring === true || body.isRecurring === "true";

    const event = await prisma.event.update({
        where: { id: parseInt(id) },
        data: {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        },
    });

    await logAudit({
        action: "update_event",
        entity: "event",
        entityId: String(event.id),
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
    const parsedId = parseInt(id);

    await prisma.eventRSVP.deleteMany({
        where: { eventId: parsedId },
    });

    await prisma.event.delete({
        where: { id: parsedId },
    });

    await logAudit({
        action: "delete_event",
        entity: "event",
        entityId: String(id),
        userId: session.user.id,
        details: `Deleted event`,
        ipAddress: getClientIp(req),
        success: true,
    });

    return NextResponse.json({ success: true });
}

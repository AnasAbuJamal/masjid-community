import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const rsvp = await prisma.eventRSVP.findUnique({
        where: { id },
        include: { event: { select: { id: true, title: true } } },
    });

    if (!rsvp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rsvp);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const rsvp = await prisma.eventRSVP.update({
        where: { id },
        data: {
            ...(body.status && { status: body.status }),
            ...(body.name && { name: body.name }),
            ...(body.phone !== undefined && { phone: body.phone }),
        },
    });

    await logAudit({ action: "update_event_rsvp", userId: session.user.id, details: `Updated RSVP ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(rsvp);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.eventRSVP.delete({ where: { id } });
    await logAudit({ action: "delete_event_rsvp", userId: session.user.id, details: `Deleted RSVP ${id}`, ipAddress: "" });
    return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    if (body.eventDate) body.eventDate = new Date(body.eventDate);
    if (body.spotsTotal !== undefined) body.spotsTotal = parseInt(String(body.spotsTotal));
    if (body.spotsFilled !== undefined) body.spotsFilled = parseInt(String(body.spotsFilled));

    const opportunity = await prisma.volunteerOpportunity.update({ 
        where: { id: parseInt(id) }, 
        data: body 
    });
    await logAudit({ action: "update_volunteer_opp", userId: session.user.id, details: `Updated volunteer opportunity ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(opportunity);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.volunteerOpportunity.delete({ 
        where: { id: parseInt(id) } 
    });
    await logAudit({ action: "delete_volunteer_opp", userId: session.user.id, details: `Deleted volunteer opportunity ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

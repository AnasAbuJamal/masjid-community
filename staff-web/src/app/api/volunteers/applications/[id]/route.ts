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

    if (!body.status || !["pending", "approved", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.volunteerApplication.update({
        where: { id: parseInt(id) },
        data: { status: body.status },
    });

    await logAudit({
        action: "update_volunteer_application",
        entity: "volunteer_application",
        entityId: String(id),
        userId: session.user.id,
        details: `Updated volunteer application ${id} to ${body.status}`,
        ipAddress: getClientIp(req),
        success: true,
    });

    return NextResponse.json(application);
}

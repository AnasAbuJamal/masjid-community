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
    if (body.progressPercent !== undefined) body.progressPercent = parseInt(String(body.progressPercent));
    if (body.displayOrder !== undefined) body.displayOrder = parseInt(String(body.displayOrder));

    const project = await prisma.constructionProject.update({ 
        where: { id: parseInt(id) }, 
        data: body 
    });
    await logAudit({ action: "update_construction", userId: session.user.id, details: `Updated construction project ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.constructionProject.delete({ 
        where: { id: parseInt(id) } 
    });
    await logAudit({ action: "delete_construction", userId: session.user.id, details: `Deleted construction project ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

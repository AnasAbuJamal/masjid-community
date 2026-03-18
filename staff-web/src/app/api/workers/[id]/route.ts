import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const profile = await prisma.workerProfile.findUnique({
        where: { id },
        include: { applications: { include: { job: { select: { title: true, company: true } } } } },
    });

    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(profile);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const profile = await prisma.workerProfile.update({ where: { id }, data: body });
    await logAudit({ action: "update_worker", userId: session.user.id, details: `Updated worker profile ${id}${body.status ? ` (status: ${body.status})` : ""}`, ipAddress: getClientIp(req) });
    return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.workerProfile.delete({ where: { id } });
    await logAudit({ action: "delete_worker", userId: session.user.id, details: `Deleted worker profile ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

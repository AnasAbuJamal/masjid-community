import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // If password is being changed, hash it
    if (body.password) {
        body.passwordHash = await bcrypt.hash(body.password, 12);
        delete body.password;
    }

    if (body.email) body.email = body.email.toLowerCase();

    const user = await prisma.user.update({
        where: { id },
        data: body,
        select: {
            id: true, email: true, firstName: true, lastName: true,
            role: true, isActive: true, isVerified: true,
        },
    });

    await logAudit({ action: "update_user", userId: session.user.id, details: `Updated user ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Don't allow deleting self
    if (id === session.user.id) {
        return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    await logAudit({ action: "delete_user", userId: session.user.id, details: `Deactivated user ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

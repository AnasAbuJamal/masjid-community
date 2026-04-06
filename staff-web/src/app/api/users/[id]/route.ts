import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    // Field whitelist to prevent privilege escalation
    const allowedFields: Prisma.UserUpdateInput = {};
    if (body.firstName) allowedFields.firstName = body.firstName;
    if (body.lastName) allowedFields.lastName = body.lastName;
    if (body.phone !== undefined) allowedFields.phone = body.phone;
    if (typeof body.isActive === 'boolean') allowedFields.isActive = body.isActive;
    
    // Role changes require extra validation (admin can demote other admins)
    if (body.role && ['admin', 'teacher'].includes(body.role)) {
        // Prevent self-demotion
        if (id === session.user.id && body.role !== 'admin') {
            return NextResponse.json({ error: "Cannot demote your own account" }, { status: 400 });
        }
        allowedFields.role = body.role;
    }
    
    const user = await prisma.user.update({
        where: { id },
        data: allowedFields,
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

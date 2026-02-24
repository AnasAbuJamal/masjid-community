import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, role: true, isActive: true, isVerified: true,
            lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { password, ...userData } = body;

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email: userData.email.toLowerCase() } });
    if (existing) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: {
            ...userData,
            email: userData.email.toLowerCase(),
            passwordHash,
        },
    });

    return NextResponse.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
    }, { status: 201 });
}

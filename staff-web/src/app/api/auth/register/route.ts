import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registrationSchema } from "@/lib/auth-validation";
import { issueMobileToken } from "@/lib/mobile-token";

export async function POST(req: NextRequest) {
    try {
        const parsed = registrationSchema.safeParse(await req.json());
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        const { password, ...data } = parsed.data;
        if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required");
        const user = await prisma.user.create({ data: {
            ...data, passwordHash: await bcrypt.hash(password, 12), role: "member",
        } });
        const token = await issueMobileToken(user.id);
        return NextResponse.json({ user: {
            id: String(user.id), email: user.email, firstName: user.firstName,
            lastName: user.lastName, role: user.role, phone: user.phone,
        }, token }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
        }
        console.error("Registration failed", error);
        return NextResponse.json({ error: "Unable to create account" }, { status: 500 });
    }
}

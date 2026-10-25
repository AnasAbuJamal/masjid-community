import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { issueMobileToken } from "@/lib/mobile-token";
import { loginSchema } from "@/lib/auth-validation";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const parsed = loginSchema.safeParse(await req.json());
        if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.isActive) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return NextResponse.json({ error: "Account temporarily locked. Try again later." }, { status: 429 });
        }
        if (!(await bcrypt.compare(password, user.passwordHash))) {
            const attempts = user.lockoutUntil ? 1 : user.failedLoginAttempts + 1;
            await prisma.user.update({ where: { id: user.id }, data: {
                failedLoginAttempts: attempts,
                lockoutUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
            } });
            await logAudit({ action: "login_failed", userId: user.id, success: false, ipAddress: getClientIp(req) });
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        const token = await issueMobileToken(user.id);
        await prisma.user.update({ where: { id: user.id }, data: {
            failedLoginAttempts: 0, lockoutUntil: null, lastLoginAt: new Date(),
        } });
        await logAudit({ action: "login", userId: user.id, ipAddress: getClientIp(req) });
        return NextResponse.json({ user: {
            id: String(user.id), email: user.email, firstName: user.firstName,
            lastName: user.lastName, role: user.role, phone: user.phone,
        }, token }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        console.error("Login failed", error);
        return NextResponse.json({ error: "Unable to sign in. Please try again." }, { status: 500 });
    }
}

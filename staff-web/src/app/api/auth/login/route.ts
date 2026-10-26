import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMobileToken } from "@/lib/mobile-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${getClientIp(req)}`, 15, 15 * 60 * 1000).success)
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  try {
    const { email: rawEmail, password } = await req.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email || email.length > 254 || typeof password !== "string" || !password || password.length > 1024)
      return NextResponse.json({ error: "Valid email and password required" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || (user.lockoutUntil && user.lockoutUntil > new Date()))
      return NextResponse.json({ error: "Invalid credentials or account unavailable" }, { status: 401 });
    if (!await bcrypt.compare(password, user.passwordHash)) {
      const attempts = user.failedLoginAttempts + 1;
      await prisma.user.update({ where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockoutUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60000) : null } });
      return NextResponse.json({ error: "Invalid credentials or account unavailable" }, { status: 401 });
    }
    await prisma.user.update({ where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null, lastLoginAt: new Date() } });
    return NextResponse.json({
      user: { id: String(user.id), email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, phone: user.phone },
      token: createMobileToken(user),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

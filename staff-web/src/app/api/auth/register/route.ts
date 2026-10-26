import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMobileToken } from "@/lib/mobile-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${getClientIp(req)}`, 5, 60 * 60000).success)
    return NextResponse.json({ error: "Too many registrations" }, { status: 429 });
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        password.length < 12 || password.length > 128 ||
        !firstName || !lastName || firstName.length > 100 || lastName.length > 100)
      return NextResponse.json({ error: "Valid names, email, and a 12–128 character password are required" }, { status: 400 });
    if (await prisma.user.findUnique({ where: { email } }))
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const user = await prisma.user.create({ data: {
      email, passwordHash: await bcrypt.hash(password, 12), firstName, lastName, role: "member", isActive: true,
    } });
    return NextResponse.json({
      user: { id: String(user.id), email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, phone: user.phone },
      token: createMobileToken(user),
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

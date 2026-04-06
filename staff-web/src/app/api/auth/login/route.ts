import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          failedLoginAttempts: { increment: 1 },
          lockoutUntil: user.failedLoginAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
      token,
    }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}

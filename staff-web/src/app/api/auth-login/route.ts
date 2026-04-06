import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  return NextResponse.json({ message: "Login endpoint" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await logAudit({
        action: "login_failed",
        email: email.toLowerCase(),
        details: "User not found",
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        success: false,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isActive) {
      await logAudit({
        action: "login_failed",
        email: email.toLowerCase(),
        userId: user.id,
        details: "Account inactive",
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        success: false,
      });
      return NextResponse.json({ error: "Account is inactive" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      await logAudit({
        action: "login_failed",
        email: email.toLowerCase(),
        userId: user.id,
        details: "Invalid password",
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        success: false,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await logAudit({
      action: "login",
      email: user.email,
      userId: user.id,
      details: "Successful login",
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      success: true,
    });

    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
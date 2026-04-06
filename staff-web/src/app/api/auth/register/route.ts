import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
        { status: 400 },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: "member",
        isActive: true,
      },
    });

    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64");

    return NextResponse.json(
      {
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
      },
      { status: 201, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

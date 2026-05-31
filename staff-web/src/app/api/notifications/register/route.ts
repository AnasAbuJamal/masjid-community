import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Push token required" }, { status: 400 });
    }

    const existing = await prisma.pushToken.findUnique({ where: { token } });
    if (!existing) {
      await prisma.pushToken.create({ data: { token } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
  }
}

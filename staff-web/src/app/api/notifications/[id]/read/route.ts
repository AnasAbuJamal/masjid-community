import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}

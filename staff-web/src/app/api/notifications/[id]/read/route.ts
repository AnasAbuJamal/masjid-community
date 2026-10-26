import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getApiIdentity(req);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  const owned = await prisma.notification.updateMany({
    where: { id: Number(id), userId: identity.id },
    data: { isRead: true },
  });
  if (!owned.count)
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  return NextResponse.json({ success: true, id }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

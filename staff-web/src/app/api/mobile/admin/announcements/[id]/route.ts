import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || Object.keys(body).length !== 1 || typeof body.isActive !== "boolean")
    return NextResponse.json({ error: "Only visibility can be changed" }, { status: 400 });
  const result = await prisma.kioskAnnouncement.updateMany({
    where: { id: Number(id) }, data: { isActive: body.isActive },
  });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ action: "mobile_announcement_visibility",
    userId: String(admin.id), details: `Announcement ${id}: ${body.isActive ? "active" : "hidden"}`,
    ipAddress: getClientIp(req) });
  return NextResponse.json({ id, isActive: body.isActive }, { headers: { "Cache-Control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: raw } = await params;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1)
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  const id = Number(raw);
  let input: unknown;
  try { input = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = input as Record<string, unknown>;
  if (Object.keys(body).length === 0 || Object.keys(body).some(key => !["role", "isActive"].includes(key)))
    return NextResponse.json({ error: "Only role and active status can be updated" }, { status: 400 });
  if (body.isActive !== undefined && typeof body.isActive !== "boolean")
    return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
  const permittedRoles: UserRole[] = ["staff", "teacher", "member", "student"];
  if (body.role !== undefined && !permittedRoles.includes(body.role as UserRole))
    return NextResponse.json({ error: "Admin privileges cannot be assigned here" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "admin" || target.id === actor.id)
    return NextResponse.json({ error: "Administrator accounts cannot be modified here" }, { status: 403 });

  const changes: { role?: UserRole; isActive?: boolean } = {};
  if (body.role !== undefined) changes.role = body.role as UserRole;
  if (body.isActive !== undefined) changes.isActive = body.isActive as boolean;
  const updated = await prisma.user.update({
    where: { id },
    data: changes,
    select: { id: true, role: true, isActive: true },
  });
  await logAudit({
    action: "mobile_admin_update_user",
    userId: String(actor.id),
    details: `Changed user ${id}: ${Object.keys(changes).join(",")}`,
    ipAddress: getClientIp(req),
  });
  return NextResponse.json({ id: String(updated.id), role: updated.role, isActive: updated.isActive },
    { headers: { "Cache-Control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";
import { CrmTaskStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  const input = await req.json().catch(() => null);
  if (!input || Object.keys(input).length !== 1 || !Object.values(CrmTaskStatus).includes(input.status))
    return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
  const updated = await prisma.crmTask.updateMany({
    where: { id: Number(id) }, data: { status: input.status },
  });
  if (!updated.count) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await logAudit({ action: "update_crm_task", userId: String(actor.id),
    details: `Task ${id} status: ${input.status}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ id, status: input.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  const deleted = await prisma.crmTask.deleteMany({ where: { id: Number(id) } });
  if (!deleted.count) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await logAudit({ action: "delete_crm_task", userId: String(actor.id),
    details: `Deleted task ${id}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true });
}

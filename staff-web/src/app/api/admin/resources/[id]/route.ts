import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { parseResourceInput, serializeResource } from "@/lib/educational-resources";
import { logAudit, getClientIp } from "@/lib/audit";

async function authorize(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor || !["admin", "teacher"].includes(actor.role)) return null;
  return actor;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await authorize(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized or forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const checked = parseResourceInput(await req.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const prior = await prisma.educationalResource.findUnique({ where: { id: Number(id) }, select: { id: true } });
  if (!prior) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const resource = await prisma.educationalResource.update({ where: { id: Number(id) }, data: checked.data });
  await logAudit({ action: "update_educational_resource", userId: String(actor.id),
    details: `Updated resource ${resource.id}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ ...serializeResource(resource), isPublished: resource.isPublished },
    { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await authorize(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized or forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const removed = await prisma.educationalResource.deleteMany({ where: { id: Number(id) } });
  if (!removed.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ action: "delete_educational_resource", userId: String(actor.id),
    details: `Removed resource ${id}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}

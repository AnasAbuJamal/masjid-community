import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
  const result = await prisma.financialBudget.deleteMany({ where: { id: Number(id) } });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ action: "delete_financial_budget", userId: String(actor.id),
    details: `Deleted budget ${id}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true });
}

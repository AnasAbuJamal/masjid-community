import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (Object.keys(body || {}).length !== 1 ||
      !["active", "paused", "closed", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid job status" }, { status: 400 });
  const result = await prisma.jobPosting.updateMany({
    where: { id: Number(id) }, data: { status },
  });
  if (!result.count) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  await logAudit({ action: "mobile_job_status", userId: String(admin.id),
    details: `Changed job ${id} to ${status}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ id, status }, { headers: { "Cache-Control": "no-store" } });
}

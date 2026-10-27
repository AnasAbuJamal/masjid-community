import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { parseResourceInput, serializeResource } from "@/lib/educational-resources";
import { logAudit, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "teacher"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const resources = await prisma.educationalResource.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
  });
  return NextResponse.json({ resources: resources.map(r => ({
    ...serializeResource(r), isPublished: r.isPublished,
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "teacher"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`resource-admin:${user.id}:${getClientIp(req)}`, 60, 60 * 60 * 1000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const checked = parseResourceInput(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const resource = await prisma.educationalResource.create({ data: checked.data });
  await logAudit({
    action: "create_educational_resource", userId: String(user.id),
    details: `Created resource ${resource.id}`, ipAddress: getClientIp(req),
  });
  return NextResponse.json({ ...serializeResource(resource), isPublished: resource.isPublished },
    { status: 201, headers: { "Cache-Control": "no-store" } });
}

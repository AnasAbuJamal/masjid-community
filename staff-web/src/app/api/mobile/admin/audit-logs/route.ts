import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get("page")) || 1));
  const query = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 120);
  const limit = 50;
  const where: Prisma.AuditLogWhereInput = query ? { OR: [
    { action: { contains: query, mode: "insensitive" } },
    { entity: { contains: query, mode: "insensitive" } },
    { email: { contains: query, mode: "insensitive" } },
  ] } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, orderBy: { createdAt: "desc" },
      take: limit, skip: (page - 1) * limit,
      select: {
        id: true, action: true, entity: true, entityId: true,
        email: true, details: true, success: true, createdAt: true, userId: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return NextResponse.json({
    logs: logs.map(log => ({
      id: String(log.id), action: log.action,
      entity: log.entity || null, entityId: log.entityId || null,
      email: log.email || null, details: log.details || null,
      success: log.success, userId: log.userId ? String(log.userId) : null,
      timestamp: log.createdAt.toISOString(),
    })),
    page, total, hasMore: page * limit < total,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

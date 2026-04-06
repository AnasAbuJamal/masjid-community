import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";

const getCachedActions = unstable_cache(
  async () => {
    return await prisma.auditLog.findMany({
      where: {},
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    });
  },
  ["audit-log-actions"],
  { revalidate: 60 }
);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "15");
  const action = searchParams.get("action");
  const entity = searchParams.get("entity");
  const userId = searchParams.get("userId");
  const success = searchParams.get("success");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");

  const where: Prisma.AuditLogWhereInput = {};

  if (action) {
    where.action = { contains: action, mode: "insensitive" };
  }

  if (entity) {
    where.entity = entity;
  }

  if (userId) {
    where.userId = userId;
  }

  if (success !== null && success !== undefined) {
    where.success = success === "true";
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total, uniqueActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        details: true,
        email: true,
        ipAddress: true,
        success: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
    getCachedActions(),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    filters: {
      actions: uniqueActions.map((a) => a.action),
    },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const daysOld = parseInt(searchParams.get("daysOld") || "90");

  if (daysOld < 30) {
    return NextResponse.json({ error: "Cannot delete logs less than 30 days old" }, { status: 400 });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return NextResponse.json({ deleted: result.count, message: `Deleted logs older than ${daysOld} days` });
}
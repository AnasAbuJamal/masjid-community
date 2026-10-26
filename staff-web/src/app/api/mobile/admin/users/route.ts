import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

const userSelect = {
  id: true, email: true, firstName: true, lastName: true,
  role: true, isActive: true, isVerified: true, createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const role = req.nextUrl.searchParams.get("role") || "";
  const page = Math.max(1, Math.min(10000, Number(req.nextUrl.searchParams.get("page")) || 1));
  const limit = 50;
  if (role && !Object.values(UserRole).includes(role as UserRole))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role as UserRole;
  if (q) where.OR = [
    { firstName: { contains: q, mode: "insensitive" } },
    { lastName: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
  ];

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, select: userSelect,
      orderBy: [{ lastName: "asc" }, { id: "asc" }],
      skip: (page - 1) * limit, take: limit,
    }),
  ]);
  return NextResponse.json({
    users: users.map(u => ({
      id: String(u.id), email: u.email, firstName: u.firstName, lastName: u.lastName,
      role: u.role, isActive: u.isActive, isVerified: u.isVerified,
      joinedDate: u.createdAt.toISOString(),
    })),
    page, total, hasMore: page * limit < total,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

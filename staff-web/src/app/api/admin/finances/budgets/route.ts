import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [budgets, categories] = await Promise.all([
    prisma.financialBudget.findMany({
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }, { category: { name: "asc" } }],
      take: 250,
    }),
    prisma.expenseCategory.findMany({ select: { id: true, name: true },
      orderBy: { name: "asc" }, where: { isActive: true } }),
  ]);
  return NextResponse.json({ budgets, categories }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`budget-upsert:${actor.id}:${getClientIp(req)}`, 100, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input))
    return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
  const { categoryId, year, month, allocated, isPublished } = input;
  if (!Number.isSafeInteger(categoryId) || categoryId < 1 ||
      !Number.isSafeInteger(year) || year < 2020 || year > 2100 ||
      !Number.isSafeInteger(month) || month < 1 || month > 12 ||
      typeof allocated !== "number" || !Number.isFinite(allocated) ||
      allocated < 0 || allocated > 100000000 ||
      typeof isPublished !== "boolean")
    return NextResponse.json({ error: "Invalid budget amount, category, month or visibility" }, { status: 400 });
  const category = await prisma.expenseCategory.findUnique({
    where: { id: categoryId }, select: { isActive: true },
  });
  if (!category?.isActive) return NextResponse.json({ error: "Category unavailable" }, { status: 404 });

  const result = await prisma.financialBudget.upsert({
    where: { categoryId_year_month: { categoryId, year, month } },
    update: { allocated, isPublished },
    create: { categoryId, year, month, allocated, isPublished },
  });
  await logAudit({ action: "upsert_financial_budget", userId: String(actor.id),
    details: `Updated budget ${result.id} for category ${categoryId} (${year}-${month})`,
    ipAddress: getClientIp(req) });
  return NextResponse.json({ id: result.id, isPublished: result.isPublished }, { status: 200 });
}

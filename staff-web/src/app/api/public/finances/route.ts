import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const current = new Date();
  const year = Number(req.nextUrl.searchParams.get("year") || current.getUTCFullYear());
  const month = Number(req.nextUrl.searchParams.get("month") || current.getUTCMonth() + 1);
  if (!Number.isSafeInteger(year) || year < 2020 || year > 2100 ||
      !Number.isSafeInteger(month) || month < 1 || month > 12)
    return NextResponse.json({ error: "Invalid financial reporting period" }, { status: 400 });

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  try {
    const [records, summary, budgets, expenseTotals] = await Promise.all([
      prisma.financialRecord.findMany({
        select: { id: true, month: true, year: true, donations: true, expenses: true },
        orderBy: [{ year: "desc" }, { month: "desc" }], take: 24,
      }),
      prisma.financialSummary.findFirst({ orderBy: { lastUpdated: "desc" } }),
      prisma.financialBudget.findMany({
        where: { year, month, isPublished: true },
        include: { category: { select: { id: true, name: true, color: true, icon: true } } },
        orderBy: { category: { name: "asc" } },
        take: 50,
      }),
      prisma.financialExpense.groupBy({
        by: ["categoryId"], _sum: { amount: true },
        where: { date: { gte: start, lt: end } },
      }),
    ]);
    const spentByCategory = new Map(expenseTotals.map(row => [row.categoryId, row._sum.amount || 0]));
    const publishedBudgets = budgets.map(budget => ({
      id: String(budget.id), category: budget.category.name,
      color: budget.category.color || null, icon: budget.category.icon || null,
      allocated: budget.allocated,
      spent: spentByCategory.get(budget.categoryId) || 0,
    }));
    return NextResponse.json({
      records,
      // These summary figures are manually maintained by the finance team.
      summary: summary ? {
        totalSpent: summary.totalSpent, bankBalance: summary.bankBalance,
        totalGoal: summary.totalGoal, totalRaised: summary.totalRaised,
        remainingNeeded: summary.remainingNeeded,
        lastUpdated: summary.lastUpdated,
      } : null,
      period: { year, month },
      budgets: publishedBudgets,
      expenseCategories: publishedBudgets.map(b => ({
        name: b.category, amount: b.spent, icon: b.icon, color: b.color,
      })),
    }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } });
  } catch (error) {
    console.error("Public financial report failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to fetch published finances" }, { status: 500 });
  }
}

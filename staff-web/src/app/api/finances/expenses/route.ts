import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.FinancialExpenseWhereInput = {};
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total, summary] = await Promise.all([
        prisma.financialExpense.findMany({
            where,
            include: { category: { select: { id: true, name: true, color: true, icon: true } } },
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.financialExpense.count({ where }),
        prisma.financialExpense.aggregate({
            where,
            _sum: { amount: true },
            _count: true,
        }),
    ]);

    return NextResponse.json({
        expenses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        summary: { totalAmount: summary._sum.amount || 0, count: summary._count },
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const expense = await prisma.financialExpense.create({
        data: {
            categoryId: body.categoryId,
            amount: body.amount,
            description: body.description,
            date: new Date(body.date),
            receiptUrl: body.receiptUrl || null,
        },
        include: { category: { select: { id: true, name: true, color: true } } },
    });

    await logAudit({ action: "create_expense", userId: session.user.id, details: `Created expense "${body.description}" - $${body.amount}`, ipAddress: getClientIp(req) });
    return NextResponse.json(expense, { status: 201 });
}

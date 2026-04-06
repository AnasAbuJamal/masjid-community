import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const expense = await prisma.financialExpense.findUnique({
        where: { id },
        include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });

    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data: Prisma.FinancialExpenseUpdateInput = { ...body };
    if (body.date) data.date = new Date(body.date);

    const expense = await prisma.financialExpense.update({
        where: { id },
        data,
        include: { category: { select: { id: true, name: true, color: true } } },
    });

    await logAudit({ action: "update_expense", userId: session.user.id, details: `Updated expense ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.financialExpense.delete({ where: { id } });
    await logAudit({ action: "delete_expense", userId: session.user.id, details: `Deleted expense ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

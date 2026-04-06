import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.expenseCategory.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: { select: { expenses: true } },
        },
    });

    return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, color, icon } = await req.json();

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.expenseCategory.findFirst({ where: { name } });
    if (existing) {
        return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await prisma.expenseCategory.create({
        data: { name, description, color, icon },
    });

    await logAudit({ action: "create_expense_category", userId: session.user.id, details: `Created expense category "${name}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(category, { status: 201 });
}

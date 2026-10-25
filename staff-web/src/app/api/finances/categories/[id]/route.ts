import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();

    const category = await prisma.expenseCategory.update({
        where: { id },
        data: body,
    });

    await logAudit({ action: "update_expense_category", userId: session.user.id, details: `Updated expense category ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await prisma.expenseCategory.delete({ where: { id } });
    await logAudit({ action: "delete_expense_category", userId: session.user.id, details: `Deleted expense category ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

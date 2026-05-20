import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [records, summary] = await Promise.all([
        prisma.financialRecord.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
        prisma.financialSummary.findFirst({ orderBy: { lastUpdated: "desc" } }),
    ]);

    return NextResponse.json({ records, summary });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (body.donations !== undefined) body.donations = parseFloat(String(body.donations));
    if (body.expenses !== undefined) body.expenses = parseFloat(String(body.expenses));
    if (body.year !== undefined) body.year = parseInt(String(body.year));

    if (body._type === "record") {
        delete body._type;
        const record = await prisma.financialRecord.create({ data: body });
        return NextResponse.json(record, { status: 201 });
    }

    // Default: create record
    const record = await prisma.financialRecord.create({ data: body });
    await logAudit({ action: "create_finance_record", userId: session.user.id, details: `Created financial record`, ipAddress: getClientIp(req) });
    return NextResponse.json(record, { status: 201 });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (body._type === "summary") {
        delete body._type;
        if (body.totalSpent !== undefined) body.totalSpent = parseFloat(String(body.totalSpent));
        if (body.bankBalance !== undefined) body.bankBalance = parseFloat(String(body.bankBalance));
        if (body.totalGoal !== undefined) body.totalGoal = parseFloat(String(body.totalGoal));
        if (body.totalRaised !== undefined) body.totalRaised = parseFloat(String(body.totalRaised));
        if (body.remainingNeeded !== undefined) body.remainingNeeded = parseFloat(String(body.remainingNeeded));

        // Upsert the financial summary
        const existing = await prisma.financialSummary.findFirst({ orderBy: { lastUpdated: "desc" } });
        if (existing) {
            const summary = await prisma.financialSummary.update({
                where: { id: existing.id },
                data: { ...body, lastUpdated: new Date() },
            });
            return NextResponse.json(summary);
        } else {
            const summary = await prisma.financialSummary.create({
                data: { ...body, lastUpdated: new Date() },
            });
            return NextResponse.json(summary, { status: 201 });
        }
    }

    if (body._type === "delete_record") {
        const id = parseInt(body._id);
        await prisma.financialRecord.delete({ where: { id } });
        return NextResponse.json({ success: true });
    }

    if (body._type === "record" && body._id) {
        const id = parseInt(body._id);
        delete body._type;
        delete body._id;

        if (body.donations !== undefined) body.donations = parseFloat(String(body.donations));
        if (body.expenses !== undefined) body.expenses = parseFloat(String(body.expenses));
        if (body.year !== undefined) body.year = parseInt(String(body.year));

        const record = await prisma.financialRecord.update({ where: { id }, data: body });
        return NextResponse.json(record);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

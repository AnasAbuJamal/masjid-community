import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const record = await prisma.financialRecord.create({ data: body });
    return NextResponse.json(record, { status: 201 });
}

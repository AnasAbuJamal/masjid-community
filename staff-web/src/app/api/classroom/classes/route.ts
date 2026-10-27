import { classInput } from "@/lib/class-input";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "teacher"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const where = session.user.role === "admin" ? {} : { teacherId: Number(session.user.id) };
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [classes, total] = await Promise.all([
        prisma.class.findMany({
            where,
            include: { students: { where: { isActive: true } } },
            orderBy: { name: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.class.count({ where }),
    ]);

    return NextResponse.json({ classes, total, page, totalPages: Math.ceil(total / limit) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const parsed = classInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid class details" }, { status: 400 });
    const body = parsed.data;
    if (body.teacherId && !await prisma.user.findFirst({ where: { id: body.teacherId, role: "teacher", isActive: true }, select: { id: true } })) return NextResponse.json({ error: "Choose an active teacher account" }, { status: 400 });
    const cls = await prisma.class.create({ data: { ...body, dayOfWeek: body.dayOfWeek ?? [] } });
    await logAudit({ action: "create_class", userId: session.user.id, details: `Created class "${body.name}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(cls, { status: 201 });
}

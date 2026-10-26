import { managesSchool, classScope, studentScope } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [classes, total] = await Promise.all([
        prisma.class.findMany({
            where: classScope(session.user),
            include: { students: { where: { isActive: true } } },
            orderBy: { name: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.class.count({ where: classScope(session.user) }),
    ]);

    return NextResponse.json({ classes, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!managesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    delete body.teacherId; delete body.teacher; delete body.userId; delete body.user;
    const cls = await prisma.class.create({ data: body });
    await logAudit({ action: "create_class", userId: session.user.id, details: `Created class "${body.name}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(cls, { status: 201 });
}

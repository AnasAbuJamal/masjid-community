import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;

    const [assignments, total] = await Promise.all([
        prisma.assignment.findMany({
            where,
            include: {
                student: { select: { firstName: true, lastName: true, studentId: true } },
                teacher: { select: { firstName: true, lastName: true } },
            },
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.assignment.count({ where }),
    ]);

    return NextResponse.json({ assignments, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    body.date = new Date(body.date);
    if (!body.teacherId) body.teacherId = session.user.id;

    const assignment = await prisma.assignment.create({
        data: body,
        include: {
            student: { select: { firstName: true, lastName: true } },
            teacher: { select: { firstName: true, lastName: true } },
        },
    });

    return NextResponse.json(assignment, { status: 201 });
}

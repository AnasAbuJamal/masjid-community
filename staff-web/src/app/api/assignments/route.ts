import { studentScope, teachesSchool } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");

    const where: Record<string, unknown> = { student: studentScope(session.user) };
    if (studentId) where.studentId = Number(studentId);
    if (teacherId) where.teacherId = Number(teacherId);

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
    if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const allowedStudent = await prisma.student.findFirst({ where: { AND: [{ id: Number(body.studentId) }, studentScope(session.user)] }, select: { id: true } });
    if (!allowedStudent) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    body.studentId = allowedStudent.id;
    delete body.student; delete body.teacher; delete body.id;
    body.teacherId = session.user.id;
    body.date = new Date(body.date);
    if (!body.teacherId) body.teacherId = session.user.id;

    const assignment = await prisma.assignment.create({
        data: body,
        include: {
            student: { select: { firstName: true, lastName: true } },
            teacher: { select: { firstName: true, lastName: true } },
        },
    });

    await logAudit({ action: "create_assignment", userId: session.user.id, details: `Created assignment "${body.title || 'Untitled'}"`, ipAddress: getClientIp(req) });

    return NextResponse.json(assignment, { status: 201 });
}

import { Prisma } from "@prisma/client";
import { assignmentCreate, assignmentQuery } from "@/lib/assignment-validation";
import { utcDay } from "@/lib/attendance-validation";
import { schoolWriteError } from "@/lib/school-write-error";
import { studentScope, teachesSchool } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = assignmentQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Invalid assignment filters" }, { status: 400 });
    const { studentId, teacherId, page, limit } = parsed.data;

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
            orderBy: [{ date: "desc" }, { id: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.assignment.count({ where }),
    ]);

    return NextResponse.json({ assignments, total, page, totalPages: Math.ceil(total / limit) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = assignmentCreate.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid assignment. Check the student, date, description, type, location, status and rating." }, { status: 400 });
    const { studentId, date, ...fields } = parsed.data;
    try {
        const assignment = await prisma.$transaction(tx => tx.assignment.create({
            data: { ...fields, date: utcDay(date),
                student: { connect: { id: studentId, AND: [studentScope(session.user), { isActive: true }] } },
                teacher: { connect: { id: session.user.id } },
            },
            include: { student: { select: { firstName: true, lastName: true } }, teacher: { select: { firstName: true, lastName: true } } },
        }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        await logAudit({ action: "create_assignment", userId: session.user.id, details: `Created assignment ${assignment.id}`, ipAddress: getClientIp(req) });
        return NextResponse.json(assignment, { status: 201 });
    } catch (error) { return schoolWriteError(error); }
}

import { classScope, studentScope } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

import { attendanceInput, attendanceQuery, utcDay, nextDay } from "@/lib/attendance-validation";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["admin", "staff", "teacher"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = attendanceQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Invalid attendance filters" }, { status: 400 });
    const { classId, studentId, date, dateFrom, dateTo, page, limit } = parsed.data;
    const where: Prisma.AttendanceWhereInput = { class: classScope(session.user) };
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = { gte: utcDay(date), lt: nextDay(date) };
    else if (dateFrom || dateTo) where.date = {
        ...(dateFrom ? { gte: utcDay(dateFrom) } : {}),
        ...(dateTo ? { lt: nextDay(dateTo) } : {}),
    };

    const [records, total, classRecords, studentRecords] = await Promise.all([
        prisma.attendance.findMany({
            where,
            include: {
                student: { select: { id: true, firstName: true, lastName: true, studentId: true, class: { select: { name: true } } } },
                class: { select: { name: true, teacherName: true } },
            },
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.attendance.count({ where }),
        classId ? prisma.class.findFirst({ where: { AND: [{ id: Number(classId) }, classScope(session.user)] }, include: { students: true } }) : null,
        studentId ? prisma.student.findFirst({ where: { AND: [{ id: Number(studentId) }, studentScope(session.user)] } }) : null,
    ]);

    return NextResponse.json({
        records,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        class: classRecords,
        student: studentRecords,
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["admin", "staff", "teacher"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = attendanceInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid attendance. Supply a valid date, unique students, and a status for each student." }, { status: 400 });
    const body = parsed.data;
    const rows = "records" in body ? body.records : [body];
    const targetIds = rows.map(row => row.studentId);
    const date = utcDay(body.date);

    // Authorization, writes and derived rates share one serializable transaction.
    // A failed batch leaves all previous records intact. Retry serialization conflicts only.
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const records = await prisma.$transaction(async tx => {
                const allowedClass = await tx.class.findFirst({
                    where: { AND: [{ id: body.classId }, classScope(session.user)] }, select: { id: true },
                });
                if (!allowedClass) throw new AttendanceError(404, "Class not found");
                const matching = await tx.student.count({ where: { id: { in: targetIds }, classId: body.classId, isActive: true } });
                if (matching !== targetIds.length) throw new AttendanceError(400, "Students must belong to the selected class");
                // The schema allows one record per student/day. A transfer must not let a
                // teacher overwrite attendance previously recorded in someone else's class.
                const conflict = await tx.attendance.findFirst({ where: {
                    studentId: { in: targetIds }, date, classId: { not: body.classId },
                }, select: { id: true } });
                if (conflict) throw new AttendanceError(409, "A student already has attendance in another class on this day");
                const saved = [];
                for (const row of rows) {
                    saved.push(await tx.attendance.upsert({
                        where: { studentId_date: { studentId: row.studentId, date } },
                        create: { studentId: row.studentId, classId: body.classId, date, status: row.status, notes: row.notes, markedBy: session.user.id },
                        update: { status: row.status, notes: row.notes, markedBy: session.user.id },
                    }));
                    await updateStudentAttendanceRate(tx, row.studentId);
                }
                return saved;
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
            await logAudit({ action: "mark_attendance", entity: "attendance", userId: session.user.id,
                details: `Saved ${records.length} records for class ${body.classId} on ${body.date}`,
                ipAddress: getClientIp(req), success: true });
            return NextResponse.json("records" in body ? { count: records.length, records } : records[0]);
        } catch (error) {
            if (error instanceof AttendanceError) return NextResponse.json({ error: error.message }, { status: error.status });
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
                if (attempt < 2) continue;
                return NextResponse.json({ error: "Attendance changed during this save. Reload and try again." }, { status: 409 });
            }
            console.error("Attendance save failed", error);
            return NextResponse.json({ error: "Attendance was not saved. Please try again." }, { status: 500 });
        }
    }
    return NextResponse.json({ error: "Please retry the save" }, { status: 409 });
}

class AttendanceError extends Error {
    constructor(readonly status: number, message: string) { super(message); }
}

async function updateStudentAttendanceRate(tx: Prisma.TransactionClient, studentId: number) {
    const records = await tx.attendance.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 30,
    });

    if (records.length === 0) return;

    const presentCount = records.filter((r) => r.status === "present").length;
    const rate = presentCount / records.length;

    let attendanceStatus: "excellent" | "very_good" | "good" | "needs_improvement" | "poor" = "good";
    if (rate >= 0.95) attendanceStatus = "excellent";
    else if (rate >= 0.85) attendanceStatus = "very_good";
    else if (rate >= 0.75) attendanceStatus = "good";
    else if (rate >= 0.6) attendanceStatus = "needs_improvement";
    else attendanceStatus = "poor";

    await tx.student.update({
        where: { id: Number(studentId) },
        data: { attendanceRate: rate, attendanceStatus },
    });
}

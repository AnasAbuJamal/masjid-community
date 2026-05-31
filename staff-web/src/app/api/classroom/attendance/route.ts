import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

interface BulkRecord {
    studentId: string;
    status?: string;
    notes?: string;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Prisma.AttendanceWhereInput = {};

    if (classId) {
        where.classId = parseInt(classId);
    }

    if (studentId) {
        where.studentId = parseInt(studentId);
    }

    if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.date = { gte: startOfDay, lte: endOfDay };
    } else if (dateFrom || dateTo) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom);
        if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            dateFilter.lte = endOfDay;
        }
        where.date = dateFilter;
    }

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
        classId ? prisma.class.findUnique({ where: { id: parseInt(classId) }, include: { students: true } }) : null,
        studentId ? prisma.student.findUnique({ where: { id: parseInt(studentId) } }) : null,
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

    const body = await req.json();

    if (body.records && Array.isArray(body.records)) {
        // Bulk mark logic
        const { classId, date, records } = body;
        if (!classId || !date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const parsedClassId = parseInt(classId);
        const results = [];
        const studentIds = records.map((r: BulkRecord) => parseInt(r.studentId));

        await prisma.attendance.deleteMany({
            where: {
                classId: parsedClassId,
                date: attendanceDate,
                studentId: { in: studentIds },
            },
        });

        const markedByInt = parseInt(session.user.id);

        for (const record of records) {
            const parsedStudentId = parseInt(record.studentId);
            const created = await prisma.attendance.create({
                data: {
                    studentId: parsedStudentId,
                    classId: parsedClassId,
                    date: attendanceDate,
                    status: record.status || "present",
                    notes: record.notes,
                    markedBy: markedByInt,
                },
            });
            results.push(created);
            await updateStudentAttendanceRate(parsedStudentId);
        }

        await logAudit({
            action: "bulk_mark_attendance",
            entity: "attendance",
            userId: session.user.id,
            details: `Bulk marked attendance for ${records.length} students in class ${classId} on ${date}`,
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json({ count: results.length, records: results }, { status: 201 });
    } else {
        // Individual mark logic
        const { studentId, classId, date, status, notes } = body;

        if (!studentId || !classId || !date || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const parsedStudentId = parseInt(studentId);
        const parsedClassId = parseInt(classId);

        const existing = await prisma.attendance.findFirst({
            where: {
                studentId: parsedStudentId,
                date: attendanceDate,
            },
        });

        const markedByInt = parseInt(session.user.id);

        if (existing) {
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: { status, notes, markedBy: markedByInt },
            });

            await logAudit({
                action: "update_attendance",
                entity: "attendance",
                entityId: String(updated.id),
                userId: session.user.id,
                details: `Updated attendance for student ${studentId} on ${date} to ${status}`,
                ipAddress: getClientIp(req),
                success: true,
            });

            return NextResponse.json(updated);
        }

        const record = await prisma.attendance.create({
            data: {
                studentId: parsedStudentId,
                classId: parsedClassId,
                date: attendanceDate,
                status,
                notes,
                markedBy: markedByInt,
            },
        });

        await updateStudentAttendanceRate(parsedStudentId);

        await logAudit({
            action: "mark_attendance",
            entity: "attendance",
            entityId: String(record.id),
            userId: session.user.id,
            details: `Marked attendance for student ${studentId} on ${date} as ${status}`,
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json(record, { status: 201 });
    }
}

async function updateStudentAttendanceRate(studentId: number) {
    const records = await prisma.attendance.findMany({
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

    await prisma.student.update({
        where: { id: studentId },
        data: { attendanceRate: rate, attendanceStatus },
    });
}

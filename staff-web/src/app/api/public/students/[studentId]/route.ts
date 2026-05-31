import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const numericId = parseInt(studentId);

    const student = await prisma.student.findFirst({
      where: isNaN(numericId)
        ? { studentId: numericId }
        : { OR: [{ id: numericId }, { studentId: numericId }] },
      include: {
        class: { select: { id: true, name: true, teacherName: true, schedule: true } },
        attendances: {
          orderBy: { date: "desc" },
          take: 30,
          select: { id: true, date: true, status: true, class: { select: { name: true } } },
        },
        assignments: {
          orderBy: { date: "desc" },
          take: 10,
          select: { id: true, date: true, type: true, description: true, status: true, rating: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const reports = await prisma.studentReport.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, content: true, category: true, createdAt: true },
    });

    const presentCount = student.attendances.filter((a) => a.status === "present").length;
    const absentCount = student.attendances.filter((a) => a.status === "absent").length;
    const lateCount = student.attendances.filter((a) => a.status === "late").length;

    return NextResponse.json({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class,
      totalPoints: student.totalPoints,
      currentLevel: student.currentLevel,
      attendanceRate: student.attendanceRate,
      attendance: {
        rate: student.attendanceRate,
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLate: lateCount,
        recentRecords: student.attendances.slice(0, 10).map((a) => ({ date: a.date, status: a.status, className: a.class.name })),
      },
      recentAssignments: student.assignments.map((a) => ({ id: a.id, date: a.date, type: a.type, description: a.description, status: a.status, rating: a.rating })),
      reports,
    });
  } catch (error) {
    console.error("Student lookup error:", error);
    return NextResponse.json({ error: "Failed to lookup student" }, { status: 500 });
  }
}

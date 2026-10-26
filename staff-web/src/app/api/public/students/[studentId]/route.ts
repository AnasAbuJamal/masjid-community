import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const session = await auth();
  const mobile = await getMobileAuthUser(req);
  if (!session && !mobile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId: input } = await params;
  if (!/^\d+$/.test(input)) return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  const studentId = Number(input);
  if (!Number.isSafeInteger(studentId) || studentId < 1)
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  try {
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { studentId }] },
      include: {
        class: { select: { id: true, name: true, teacherName: true, schedule: true } },
        attendances: { orderBy: { date: "desc" }, take: 30,
          select: { date: true, status: true, class: { select: { name: true } } } },
        assignments: { orderBy: { date: "desc" }, take: 10,
          select: { id: true, date: true, type: true, description: true, status: true, rating: true } },
      },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    const role = session?.user.role || mobile?.role;
    const email = (mobile?.email || session?.user.email || "").toLowerCase();
    if (!["admin", "teacher", "staff"].includes(role || "") &&
        (!email || student.parentEmail?.toLowerCase() !== email))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const reports = await prisma.studentReport.findMany({
      where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, title: true, content: true, category: true, createdAt: true },
    });
    return NextResponse.json({
      id: student.id, studentId: student.studentId,
      firstName: student.firstName, lastName: student.lastName, class: student.class,
      totalPoints: student.totalPoints, currentLevel: student.currentLevel,
      attendanceRate: student.attendanceRate,
      attendance: {
        rate: student.attendanceRate,
        totalPresent: student.attendances.filter(a => a.status === "present").length,
        totalAbsent: student.attendances.filter(a => a.status === "absent").length,
        totalLate: student.attendances.filter(a => a.status === "late").length,
        recentRecords: student.attendances.slice(0, 10).map(a =>
          ({ date: a.date, status: a.status, className: a.class.name })),
      },
      recentAssignments: student.assignments, reports,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Student lookup error:", error);
    return NextResponse.json({ error: "Failed to lookup student" }, { status: 500 });
  }
}

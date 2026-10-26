import { NextRequest, NextResponse } from "next/server";
import { AttendanceMark } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "teacher"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`teacher-attendance:${user.id}:${getClientIp(req)}`, 150, 60 * 60000).success)
    return NextResponse.json({ error: "Too many attendance updates" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.classId) || !Number.isSafeInteger(body.studentId) ||
      body.classId <= 0 || body.studentId <= 0 ||
      !Object.values(AttendanceMark).includes(body.status) ||
      typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    return NextResponse.json({ error: "Invalid class, student, date or attendance mark" }, { status: 400 });
  const date = new Date(`${body.date}T00:00:00.000Z`);
  const now = new Date();
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== body.date ||
      date.getTime() > now.getTime() || date.getTime() < now.getTime() - 7 * 86400000)
    return NextResponse.json({ error: "Attendance must be marked within seven days" }, { status: 400 });

  const schoolClass = await prisma.class.findFirst({
    where: { id: body.classId, ...(user.role === "admin" ? {} : {
      teacherId: user.id,
    }) },
    select: { id: true },
  });
  if (!schoolClass) return NextResponse.json({ error: "Class unavailable or not assigned to teacher" }, { status: 403 });
  const student = await prisma.student.findFirst({
    where: { id: body.studentId, classId: body.classId, isActive: true },
    select: { id: true },
  });
  if (!student) return NextResponse.json({ error: "Student is not enrolled in this class" }, { status: 404 });
  const record = await prisma.attendance.upsert({
    where: { studentId_date: { studentId: student.id, date } },
    update: { classId: schoolClass.id, status: body.status, markedBy: user.id },
    create: { studentId: student.id, classId: schoolClass.id,
      date, status: body.status, markedBy: user.id },
  });
  const all = await prisma.attendance.groupBy({
    by: ["status"], where: { studentId: student.id }, _count: { _all: true },
  });
  const total = all.reduce((sum, row) => sum + row._count._all, 0);
  const attended = all.filter(r => r.status === "present" || r.status === "late")
    .reduce((sum, row) => sum + row._count._all, 0);
  await prisma.student.update({
    where: { id: student.id },
    data: { attendanceRate: total ? Math.round(attended * 10000 / total) / 100 : 0 },
  });
  await logAudit({ action: "mark_class_attendance",
    userId: String(user.id),
    details: `Attendance entry ${record.id}, class ${body.classId}, student ${student.id}: ${body.status}`,
    ipAddress: getClientIp(req) });
  return NextResponse.json({ id: String(record.id), status: record.status },
    { headers: { "Cache-Control": "no-store" } });
}

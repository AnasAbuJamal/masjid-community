import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "teacher"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const classes = await prisma.class.findMany({
    where: user.role === "admin" ? {} : {
      teacherName: { equals: fullName, mode: "insensitive" },
    },
    include: { students: {
      where: { isActive: true }, orderBy: { firstName: "asc" },
      select: { id: true, studentId: true, firstName: true, lastName: true },
    } },
    orderBy: { name: "asc" }, take: 100,
  });
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const end = new Date(start.getTime() + 86400000);
  const attendance = await prisma.attendance.findMany({
    where: { classId: { in: classes.map(c => c.id) },
      date: { gte: start, lt: end } },
    select: { studentId: true, classId: true, status: true },
  });
  const marked = new Map(attendance.map(a => [`${a.classId}:${a.studentId}`, a.status]));
  return NextResponse.json({
    date: start.toISOString().slice(0, 10),
    classes: classes.map(c => ({
      id: String(c.id), name: c.name, instructor: c.teacherName,
      schedule: c.schedule, days: c.dayOfWeek,
      students: c.students.map(s => ({
        id: String(s.id), code: String(s.studentId),
        name: `${s.firstName} ${s.lastName}`,
        attendance: marked.get(`${c.id}:${s.id}`) || null,
      })),
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

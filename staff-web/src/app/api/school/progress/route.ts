import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity, isStaff } from "@/lib/api-identity";

/** Verified parents see only their children; staff can view assigned progress records. */
export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(user.role) && !user.isVerified) {
    return NextResponse.json({ error: "Verify your email to view progress records" }, { status: 403 });
  }
  const where = isStaff(user.role) ? { isActive: true } :
    { isActive: true, parentEmail: user.email };
  const students = await prisma.student.findMany({
    where, take: 100, orderBy: { firstName: "asc" },
    select: {
      id: true, firstName: true, lastName: true,
      class: { select: { id: true, name: true, teacherName: true, schedule: true } },
      assignments: {
        take: 30, orderBy: { date: "desc" },
        select: { id: true, date: true, type: true, description: true,
          rating: true, status: true },
      },
      reports: {
        take: 20, orderBy: { createdAt: "desc" },
        select: { id: true, title: true, content: true, category: true, createdAt: true },
      },
    },
  });
  return NextResponse.json({ students: students.map(student => ({
    id: String(student.id),
    name: `${student.firstName} ${student.lastName}`,
    className: student.class.name,
    instructor: student.class.teacherName,
    schedule: student.class.schedule,
    assignments: student.assignments.map(a => ({
      id: String(a.id),
      date: a.date.toISOString(), type: a.type,
      description: a.description, rating: a.rating, status: a.status,
    })),
    reports: student.reports.map(r => ({
      id: String(r.id), title: r.title, content: r.content,
      category: r.category, date: r.createdAt.toISOString(),
    })),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

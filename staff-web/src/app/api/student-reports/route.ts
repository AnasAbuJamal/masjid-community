import { reportInput } from "@/lib/school-report-validation";
import { schoolId } from "@/lib/assignment-validation";
import { studentScope, teachesSchool } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");

    if (studentId && !schoolId.safeParse(studentId).success) return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    if (studentId) {
      const reports = await prisma.studentReport.findMany({
        where: { studentId: Number(studentId), student: studentScope(session.user) },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { teacher: { select: { firstName: true, lastName: true } } },
      });
      return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
    }

    const reports = await prisma.studentReport.findMany({
      where: { student: studentScope(session.user) },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { student: { select: { firstName: true, lastName: true, studentId: true } }, teacher: { select: { firstName: true, lastName: true } } },
    });
    return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const parsed = reportInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid report. Check the student, title, content and category." }, { status: 400 });
    const { studentId, title, content, category } = parsed.data;
    const allowedStudent = await prisma.student.findFirst({ where: { AND: [{ id: studentId, isActive: true }, studentScope(session.user)] }, select: { id: true } });
    if (!allowedStudent) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const report = await prisma.studentReport.create({
      data: {
        studentId,
        teacherId: session.user.id,
        title,
        content,
        category: category || "general",
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

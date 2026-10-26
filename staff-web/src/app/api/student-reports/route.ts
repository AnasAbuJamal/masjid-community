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

    if (studentId) {
      const reports = await prisma.studentReport.findMany({
        where: { studentId: Number(studentId), student: studentScope(session.user) },
        orderBy: { createdAt: "desc" },
        include: { teacher: { select: { firstName: true, lastName: true } } },
      });
      return NextResponse.json({ reports });
    }

    const reports = await prisma.studentReport.findMany({
      where: { student: studentScope(session.user) },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { student: { select: { firstName: true, lastName: true, studentId: true } }, teacher: { select: { firstName: true, lastName: true } } },
    });
    return NextResponse.json({ reports });
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
    const body = await req.json();
    const allowedStudent = await prisma.student.findFirst({ where: { AND: [{ id: Number(body.studentId) }, studentScope(session.user)] }, select: { id: true } });
    if (!allowedStudent) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    body.studentId = allowedStudent.id;
    delete body.student; delete body.teacher; delete body.id;
    body.teacherId = session.user.id;
    const { studentId, title, content, category } = body;

    if (!studentId || !title || !content) {
      return NextResponse.json({ error: "Missing required fields: studentId, title, content" }, { status: 400 });
    }

    const report = await prisma.studentReport.create({
      data: {
        studentId: parseInt(studentId),
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

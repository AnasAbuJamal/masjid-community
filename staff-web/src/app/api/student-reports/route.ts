import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const reports = await prisma.studentReport.findMany({
        where: { studentId: parseInt(studentId) },
        orderBy: { createdAt: "desc" },
        include: { teacher: { select: { firstName: true, lastName: true } } },
      });
      return NextResponse.json({ reports });
    }

    const reports = await prisma.studentReport.findMany({
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

  try {
    const body = await req.json();
    const { studentId, title, content, category } = body;

    if (!studentId || !title || !content) {
      return NextResponse.json({ error: "Missing required fields: studentId, title, content" }, { status: 400 });
    }

    const report = await prisma.studentReport.create({
      data: {
        studentId: parseInt(studentId),
        teacherId: parseInt(session.user.id),
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

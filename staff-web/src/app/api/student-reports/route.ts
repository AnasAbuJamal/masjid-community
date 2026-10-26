import { Prisma } from "@prisma/client";
import { schoolWriteError } from "@/lib/school-write-error";
import { reportInput, reportQuery } from "@/lib/school-report-validation";
import { studentScope, teachesSchool } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = reportQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Invalid report filters" }, { status: 400 });
    const { studentId, page, limit } = parsed.data;
    const rows = await prisma.studentReport.findMany({
      where: { student: studentScope(session.user), ...(studentId ? { studentId } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit + 1,
      include: { student: { select: { firstName: true, lastName: true, studentId: true } }, teacher: { select: { firstName: true, lastName: true } } },
    });
    return NextResponse.json({ reports: rows.slice(0, limit), page, hasMore: rows.length > limit }, { headers: { "Cache-Control": "no-store" } });
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
    // Keep the authorization read and report insert in the same serializable
    // transaction, including concurrent class/student assignment changes.
    const report = await prisma.$transaction(async tx => {
      const allowedStudent = await tx.student.findFirst({
        where: { AND: [{ id: studentId, isActive: true }, studentScope(session.user)] },
        select: { id: true },
      });
      if (!allowedStudent) return null;
      return tx.studentReport.create({
        data: { studentId: allowedStudent.id, teacherId: session.user.id, title, content, category },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!report) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return schoolWriteError(error);
  }
}

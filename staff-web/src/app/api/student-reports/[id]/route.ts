import { reportUpdate } from "@/lib/school-report-validation";
import { schoolId } from "@/lib/assignment-validation";
import { logAudit, getClientIp } from "@/lib/audit";
import { schoolWriteError } from "@/lib/school-write-error";
import { studentScope, teachesSchool } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await prisma.studentReport.delete({ where: { id, student: studentScope(session.user) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return schoolWriteError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = schoolId.safeParse((await params).id);
  const parsed = reportUpdate.safeParse(await req.json().catch(() => null));
  if (!id.success || !parsed.success) return NextResponse.json({ error: "Invalid report update" }, { status: 400 });
  const { expectedUpdatedAt, title, content, category } = parsed.data;
  try {
    // Compare-and-update in one statement: a stale editor cannot silently replace a newer report.
    const result = await prisma.studentReport.updateMany({
      where: { id: id.data, updatedAt: new Date(expectedUpdatedAt), student: studentScope(session.user) },
      data: { title, content, category },
    });
    if (!result.count) return NextResponse.json({ error: "This report changed or is no longer accessible. Reload it before editing." }, { status: 409 });
    await logAudit({ action: "update_student_report", entity: "student_report", entityId: String(id.data), userId: session.user.id, ipAddress: getClientIp(req) });
    return NextResponse.json({ success: true });
  } catch (error) { return schoolWriteError(error); }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity, isStaff } from "@/lib/api-identity";
export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(user.role) && !user.isVerified) return NextResponse.json({ error: "Verify your email to access these records" }, { status: 403 });
  const { studentId: raw } = await params;
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const id = Number(raw);
  const student = await prisma.student.findFirst({
    where: { OR: [{ id }, { studentId: id }] },
    select: { id: true, parentEmail: true },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isStaff(user.role) && student.parentEmail?.toLowerCase() !== user.email)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const records = await prisma.attendance.findMany({
    where: { studentId: student.id }, select: { date: true, status: true },
    orderBy: { date: "desc" }, take: 100,
  });
  return NextResponse.json(records.map(r => ({
    date: r.date.toISOString().slice(0, 10), present: r.status === "present" || r.status === "late",
  })), { headers: { "Cache-Control": "no-store" } });
}

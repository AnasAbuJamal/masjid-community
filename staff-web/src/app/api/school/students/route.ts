import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity, isStaff } from "@/lib/api-identity";
export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(user.role) && !user.isVerified) return NextResponse.json({ error: "Verify your email to access these records" }, { status: 403 });
  const students = await prisma.student.findMany({
    where: isStaff(user.role) ? { isActive: true } : { isActive: true, parentEmail: user.email },
    include: { class: { select: { name: true } } },
    orderBy: { firstName: "asc" }, take: 100,
  });
  return NextResponse.json(students.map(s => ({
    id: String(s.id), name: `${s.firstName} ${s.lastName}`, grade: s.class.name,
    attendance: s.attendanceRate,
  })), { headers: { "Cache-Control": "no-store" } });
}

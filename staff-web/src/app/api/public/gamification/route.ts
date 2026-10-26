import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity, isStaff } from "@/lib/api-identity";
export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const students = await prisma.student.findMany({
    where: { isActive: true }, orderBy: { totalPoints: "desc" }, take: 100,
    select: { id: true, studentId: true, firstName: true, lastName: true,
      parentEmail: true, totalPoints: true, currentLevel: true, attendanceRate: true },
  });
  return NextResponse.json({
    // Children are anonymized on community leaderboards; staff and verified parents see names.
    students: students.map((s, index) => {
      const visible = isStaff(user.role) || s.parentEmail?.toLowerCase() === user.email;
      return {
        id: String(s.id), studentId: visible ? String(s.studentId) : String(index + 1),
        firstName: visible ? s.firstName : "Student",
        lastName: visible ? s.lastName : `#${index + 1}`,
        totalPoints: s.totalPoints, currentLevel: s.currentLevel, attendanceRate: s.attendanceRate,
      };
    }),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

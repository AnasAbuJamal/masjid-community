import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity, isStaff } from "@/lib/api-identity";
export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(user.role) && !user.isVerified) return NextResponse.json({ error: "Verify your email to access these records" }, { status: 403 });
  const assignments = await prisma.assignment.findMany({
    where: isStaff(user.role) ? {} : { student: { parentEmail: user.email } },
    orderBy: { date: "desc" }, take: 100,
  });
  return NextResponse.json(assignments.map(a => ({
    id: String(a.id), title: a.type.replaceAll("_", " "), subject: a.description,
    dueDate: a.date.toISOString(), completed: a.status === "completed",
    rating: a.rating === "none" ? null : a.rating,
  })), { headers: { "Cache-Control": "no-store" } });
}

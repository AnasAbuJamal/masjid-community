import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  const classes = await prisma.class.findMany({
    select: { id: true, name: true, teacherName: true, schedule: true, dayOfWeek: true,
      _count: { select: { students: true } } },
    orderBy: { name: "asc" }, take: 100,
  });
  return NextResponse.json({ classes: classes.map(c => ({
    id: String(c.id), name: c.name, teacher: c.teacherName,
    schedule: c.schedule, dayOfWeek: c.dayOfWeek, enrolled: c._count.students,
  })) }, { headers: { "Cache-Control": "no-store" } });
}

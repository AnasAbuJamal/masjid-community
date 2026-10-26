import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
  const c = await prisma.class.findUnique({
    where: { id: Number(id) },
    select: { id: true, name: true, teacherName: true, schedule: true, dayOfWeek: true,
      _count: { select: { students: true } } },
  });
  if (!c) return NextResponse.json({ error: "Class not found" }, { status: 404 });
  return NextResponse.json({
    id: String(c.id), name: c.name, teacher: c.teacherName,
    schedule: c.schedule, dayOfWeek: c.dayOfWeek, enrolled: c._count.students,
  }, { headers: { "Cache-Control": "no-store" } });
}

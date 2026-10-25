import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
export async function GET() {
 const session = await auth();
 if (!session?.user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 const account = await prisma.user.findUnique({ where: { id: Number(session.user.id) }, select: { isVerified: true } });
 if (!account?.isVerified) return NextResponse.json({ error: 'Ask the school office to verify your account before accessing family records' }, { status: 403 });
 const students = await prisma.student.findMany({
  where: { parentEmail: { equals: session.user.email.trim(), mode: 'insensitive' }, isActive: true },
  orderBy: [{ firstName: 'asc' }, { id: 'asc' }],
  select: { id: true, firstName: true, lastName: true,
   class: { select: { name: true, teacherName: true, schedule: true } },
   attendances: { take: 30, orderBy: { date: 'desc' }, select: { id: true, date: true, status: true, class: { select: { name: true } } } },
   reports: { take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, content: true, category: true, createdAt: true } },
  },
 });
 return NextResponse.json({ children: students.map(student => ({ ...student, id: String(student.id),
  attendances: student.attendances.map(row => ({ ...row, id: String(row.id) })),
  reports: student.reports.map(row => ({ ...row, id: String(row.id) })),
 })) }, { headers: { 'Cache-Control': 'no-store' } });
}

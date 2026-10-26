import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'student') return NextResponse.json({ error: 'Student account required' }, { status: 403 });
  // No caller-supplied student ID is accepted. Identity always comes from the session.
  const params = req.nextUrl.searchParams;
  const rawPage = params.get('page') ?? '1';
  if ([...params.keys()].some(key => key !== 'page') || !/^[1-9]\d*$/.test(rawPage) || Number(rawPage) > 10000) {
    return NextResponse.json({ error: 'Invalid attendance filters' }, { status: 400 });
  }
  const page = Number(rawPage);
  const limit = 30;
  try {
    const result = await prisma.$transaction(async tx => {
      const student = await tx.student.findFirst({
        where: { userId: session.user.id, isActive: true },
        select: { id: true, firstName: true, lastName: true, class: { select: { name: true } } },
      });
      if (!student) return { student: null, records: [], summary: null, page, totalPages: 0 };
      const where = { studentId: student.id };
      const records = await tx.attendance.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        select: { id: true, date: true, status: true, class: { select: { name: true } } },
      });
      const groups = await tx.attendance.groupBy({ by: ['status'], where, _count: { _all: true } });
      const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      for (const group of groups) {
        summary[group.status] = group._count._all;
        summary.total += group._count._all;
      }
      return { student: { ...student, id: String(student.id) },
        records: records.map(record => ({ ...record, id: String(record.id) })),
        summary, page, totalPages: Math.ceil(summary.total / limit) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Student attendance read failed', error);
    return NextResponse.json({ error: 'Unable to load attendance. Please try again.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/audit';
const linkInput = z.object({ kind: z.enum(['teacher', 'student']), recordId: z.number().int().positive(), userId: z.number().int().positive().nullable() }).strict();
export async function GET() {
 const session = await auth();
 if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 const [classes, students, users] = await Promise.all([
  prisma.class.findMany({ select: { id: true, name: true, teacherId: true }, orderBy: { name: 'asc' } }),
  prisma.student.findMany({ where: { isActive: true }, select: { id: true, firstName: true, lastName: true, userId: true }, orderBy: { firstName: 'asc' } }),
  prisma.user.findMany({ where: { role: { in: ['teacher', 'student'] }, isActive: true }, select: { id: true, firstName: true, lastName: true, email: true, role: true }, orderBy: { firstName: 'asc' } }),
 ]);
 return NextResponse.json({ classes, students, users }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: NextRequest) {
 const session = await auth();
 if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 const parsed = linkInput.safeParse(await req.json().catch(() => null));
 if (!parsed.success) return NextResponse.json({ error: 'Invalid account association' }, { status: 400 });
 const { kind, recordId, userId } = parsed.data;
 const user = userId === null ? null : await prisma.user.findFirst({ where: { id: userId, role: kind, isActive: true } });
 if (userId !== null && !user) return NextResponse.json({ error: `Choose an active ${kind} account` }, { status: 400 });
 try {
  if (kind === 'teacher') await prisma.class.update({ where: { id: recordId }, data: { teacherId: userId, ...(user ? { teacherName: `${user.firstName} ${user.lastName}` } : {}) } });
  else await prisma.student.update({ where: { id: recordId }, data: { userId } });
 } catch { return NextResponse.json({ error: 'Record not found or account already linked to another student' }, { status: 409 }); }
 await logAudit({ action: 'school_account_link', userId: session.user.id, details: `${kind} record ${recordId} linked to account ${userId ?? 'none'}`, ipAddress: getClientIp(req) });
 return NextResponse.json({ success: true });
}

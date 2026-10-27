import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
export async function GET() {
 const session = await auth();
 if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 const teachers = await prisma.user.findMany({ where: { role: 'teacher', isActive: true }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: [{ firstName: 'asc' }, { id: 'asc' }] });
 return NextResponse.json({ teachers }, { headers: { 'Cache-Control': 'no-store' } });
}

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
export function schoolWriteError(error: unknown) {
 if (error instanceof Prisma.PrismaClientKnownRequestError) {
  if (error.code === 'P2025') return NextResponse.json({ error: 'Record unavailable or outside your assigned classes' }, { status: 404 });
  if (error.code === 'P2034') return NextResponse.json({ error: 'School records changed during this save. Reload and try again.' }, { status: 409 });
 }
 console.error('School record write failed', error);
 return NextResponse.json({ error: 'The operation could not be completed. Reload to check the current record before retrying.' }, { status: 500 });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
const input = z.object({ token: z.string().max(256).regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/) }).strict();
export async function POST(req: NextRequest) {
 const session = await auth();
 if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 const parsed = input.safeParse(await req.json().catch(() => null));
 if (!parsed.success) return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 });
 const userId = Number(session.user.id);
 // Re-registration transfers this installation to its current signed-in user.
 const expiresAt = new Date(Date.now() + 30 * 86400000);
 await prisma.pushToken.upsert({ where: { token: parsed.data.token },
 create: { token: parsed.data.token, userId, expiresAt }, update: { userId, expiresAt } });
 return NextResponse.json({ success: true });
}
export async function DELETE(req: NextRequest) {
 const session = await auth();
 if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 const parsed = input.safeParse(await req.json().catch(() => null));
 if (!parsed.success) return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 });
 await prisma.pushToken.deleteMany({ where: { token: parsed.data.token, userId: Number(session.user.id) } });
 return NextResponse.json({ success: true });
}

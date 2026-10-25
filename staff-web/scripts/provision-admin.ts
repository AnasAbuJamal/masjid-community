import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();
async function main() {
  const parsed = z.object({
    ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
    ADMIN_PASSWORD: z.string().min(12).max(72),
  }).safeParse(process.env);
  if (!parsed.success) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12–72 characters) through secure environment configuration.');
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = parsed.data;
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing) throw new Error('An account already exists. Use the account recovery or authorized role management workflow.');
  await prisma.user.create({ data: {
    email, passwordHash: await bcrypt.hash(password, 12), firstName: 'Community', lastName: 'Administrator',
    role: 'admin', isVerified: true, isActive: true,
  } });
  console.log('Administrator created. Sign in with the credentials you supplied, then update your profile.');
}
main().catch(error => {
  // Never print provider errors that might contain credentials or personal data.
  console.error(error instanceof Error && (error.message.startsWith('Set ADMIN_') || error.message.startsWith('An account already'))
    ? error.message : 'Administrator creation failed. Check database connectivity and migrations.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());

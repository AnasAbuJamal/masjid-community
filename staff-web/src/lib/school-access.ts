import type { Prisma } from '@prisma/client';
export interface SchoolActor { id: number; role: string; email?: string | null; isVerified?: boolean }
export const managesSchool = (user: SchoolActor) => ['admin', 'staff'].includes(user.role);
export const teachesSchool = (user: SchoolActor) => managesSchool(user) || user.role === 'teacher';
export function classScope(user: SchoolActor): Prisma.ClassWhereInput {
 if (managesSchool(user)) return {};
 if (user.role === 'teacher') return { teacherId: user.id };
 return { id: -1 };
}
export function studentScope(user: SchoolActor): Prisma.StudentWhereInput {
 if (managesSchool(user)) return {};
 if (user.role === 'teacher') return { class: { teacherId: user.id } };
 if (user.role === 'student') return { userId: user.id };
 if (user.role === 'member' && user.isVerified && user.email) return { parentEmail: { equals: user.email, mode: 'insensitive' } };
 return { id: -1 };
}

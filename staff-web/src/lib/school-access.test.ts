import { describe, expect, it } from 'vitest';
import { studentScope, classScope, managesSchool, teachesSchool } from './school-access';
describe('school role boundaries', () => {
 it('limits teachers to their assigned classes and students', () => {
  const user = { id: 7, role: 'teacher' };
  expect(classScope(user)).toEqual({ teacherId: 7 });
  expect(studentScope(user)).toEqual({ class: { teacherId: 7 } });
  expect(managesSchool(user)).toBe(false);
  expect(teachesSchool(user)).toBe(true);
 });
 it('limits students to their linked account and denies school writes', () => {
  const user = { id: 7, role: 'student', email: 'parent@example.com', isVerified: true };
  expect(studentScope(user)).toEqual({ userId: 7 });
  expect(classScope(user)).toEqual({ id: -1 });
  expect(teachesSchool(user)).toBe(false);
 });
 it('requires verification for parents and scopes by family email', () => {
  const user = { id: 7, role: 'member', email: 'parent@example.com' };
  expect(studentScope(user)).toEqual({ id: -1 });
  expect(studentScope({ ...user, isVerified: true })).toEqual({ parentEmail: { equals: user.email, mode: 'insensitive' } });
  expect(teachesSchool(user)).toBe(false);
 });
 it('fails closed for unknown roles and missing family identity', () => {
  expect(studentScope({ id: 7, role: 'unknown', isVerified: true })).toEqual({ id: -1 });
  expect(studentScope({ id: 7, role: 'member', isVerified: true })).toEqual({ id: -1 });
 });
 it.each(['admin','staff'])('allows %s to manage school records', role => {
  expect(managesSchool({ id: 1, role })).toBe(true);
  expect(studentScope({ id: 1, role })).toEqual({});
 });
});

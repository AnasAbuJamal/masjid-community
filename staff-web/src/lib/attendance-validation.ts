import { z } from 'zod';

// A school day is a calendar date, stored at UTC midnight, never server-local midnight.
export const schoolDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a valid calendar date (YYYY-MM-DD)');
const id = z.union([z.number(), z.string().regex(/^[1-9]\d*$/).transform(Number)])
  .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER));
const row = z.object({
  studentId: id,
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().trim().max(2000).optional(),
}).strict();
export const attendanceInput = z.union([
  row.extend({ classId: id, date: schoolDay }),
  z.object({ classId: id, date: schoolDay, records: z.array(row).min(1).max(500) }).strict()
    .refine(value => new Set(value.records.map(r => r.studentId)).size === value.records.length, 'Each student may appear only once'),
]);
export const attendanceQuery = z.object({
  classId: id.optional(), studentId: id.optional(),
  date: schoolDay.optional(), dateFrom: schoolDay.optional(), dateTo: schoolDay.optional(),
  page: id.default(1), limit: id.pipe(z.number().max(500)).default(50),
}).refine(q => !(q.date && (q.dateFrom || q.dateTo)), 'Use a day or a range, not both')
  .refine(q => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, 'Invalid date range');
export const utcDay = (value: string) => new Date(`${value}T00:00:00.000Z`);
export const nextDay = (value: string) => new Date(utcDay(value).getTime() + 86400000);

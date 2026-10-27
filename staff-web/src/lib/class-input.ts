import { z } from 'zod';
export const classInput = z.object({
 name: z.string().trim().min(1).max(200),
 teacherName: z.string().trim().max(200),
 schedule: z.string().trim().max(500),
 dayOfWeek: z.array(z.string().max(20)).max(7).optional(),
 teacherId: z.number().int().positive().nullable().optional(),
}).strict();

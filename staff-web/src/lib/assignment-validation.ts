import { z } from 'zod';
import { schoolDay } from './attendance-validation';
export const schoolId = z.union([z.number(), z.string().regex(/^[1-9]\d*$/).transform(Number)]).pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER));
const fields = z.object({
 date: schoolDay, type: z.enum(['new_lesson', 'review']), location: z.enum(['masjid', 'home']),
 description: z.string().trim().min(1).max(10000), status: z.enum(['pending', 'completed']),
 rating: z.enum(['none', 'weak', 'good', 'very_good', 'excellent']),
}).strict();
export const assignmentCreate = fields.extend({ studentId: schoolId, status: fields.shape.status.default('pending'), rating: fields.shape.rating.default('none') });
export const assignmentUpdate = fields.partial().refine(value => Object.keys(value).length > 0, 'Supply fields to update');
export const assignmentQuery = z.object({
 studentId: schoolId.optional(), teacherId: schoolId.optional(),
 page: schoolId.pipe(z.number().max(10000)).default(1), limit: schoolId.pipe(z.number().max(100)).default(30),
});

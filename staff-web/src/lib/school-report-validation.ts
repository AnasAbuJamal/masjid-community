import { z } from 'zod';
import { schoolId } from './assignment-validation';
export const reportInput = z.object({
 studentId: schoolId, title: z.string().trim().min(1).max(200),
 content: z.string().trim().min(1).max(20000),
 category: z.enum(['general', 'academic', 'behavioral', 'daily']).default('general'),
}).strict();
export const reportUpdate = reportInput.omit({ studentId: true }).extend({
 expectedUpdatedAt: z.string().datetime(),
});
export const reportQuery = z.object({
 studentId: schoolId.optional(),
 page: schoolId.pipe(z.number().max(10000)).default(1),
 limit: schoolId.pipe(z.number().max(50)).default(50),
});

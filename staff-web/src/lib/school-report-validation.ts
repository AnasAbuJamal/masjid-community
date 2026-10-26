import { z } from 'zod';
import { schoolId } from './assignment-validation';
export const reportInput = z.object({
 studentId: schoolId, title: z.string().trim().min(1).max(200),
 content: z.string().trim().min(1).max(20000),
 category: z.enum(['general', 'academic', 'behavioral', 'daily']).default('general'),
}).strict();

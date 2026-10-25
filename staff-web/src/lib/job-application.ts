import { z } from 'zod';

export const jobApplicationSchema = z.object({
  jobId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  coverLetter: z.string().trim().min(50).max(10000),
  resumeUrl: z.string().url().max(2048).refine(value => new URL(value).protocol === 'https:', 'Use an HTTPS resume URL').optional(),
});

export function isJobAcceptingApplications(job: { status: string; expiresAt: Date | null }, now = new Date()) {
  return job.status === 'active' && (!job.expiresAt || job.expiresAt > now);
}

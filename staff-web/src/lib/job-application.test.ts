import { describe, expect, it } from 'vitest';
import { jobApplicationSchema, isJobAcceptingApplications } from './job-application';

describe('job application boundaries', () => {
  const valid = { jobId: '12', coverLetter: 'Relevant experience and availability for this position.'.repeat(2) };
  it('rejects invalid IDs, empty letters, and insecure resume URLs', () => {
    for (const override of [{ jobId: -1 }, { jobId: 1.5 }, { jobId: 'abc' }, { coverLetter: '   ' }, { resumeUrl: 'javascript:alert(1)' }, { resumeUrl: 'http://example.com/resume' }]) {
      expect(jobApplicationSchema.safeParse({ ...valid, ...override }).success).toBe(false);
    }
  });
  it('does not accept client identity or review status as application data', () => {
    const data = jobApplicationSchema.parse({ ...valid, applicantEmail: 'other@example.com', workerProfileId: 3, status: 'hired' });
    expect(data).toEqual({ jobId: 12, coverLetter: valid.coverLetter });
  });
  it('rejects expired, boundary-time, and unpublished jobs', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    expect(isJobAcceptingApplications({ status: 'active', expiresAt: now }, now)).toBe(false);
    expect(isJobAcceptingApplications({ status: 'active', expiresAt: new Date(now.getTime() - 1) }, now)).toBe(false);
    for (const status of ['pending_review', 'paused', 'closed', 'expired', 'rejected']) {
      expect(isJobAcceptingApplications({ status, expiresAt: null }, now)).toBe(false);
    }
    expect(isJobAcceptingApplications({ status: 'active', expiresAt: null }, now)).toBe(true);
    expect(isJobAcceptingApplications({ status: 'active', expiresAt: new Date(now.getTime() + 1) }, now)).toBe(true);
  });
});

-- Store the applicant's acknowledgement of review conditions as a server timestamp.
-- This is a self-attestation, NOT a finding of guardianship or legal consent.
-- Existing applications remain NULL and cannot be approved until resubmitted.
ALTER TABLE "EnrollmentApplication" ADD COLUMN "reviewAcknowledgedAt" TIMESTAMP(3);
ALTER TABLE "EnrollmentApplication" ADD COLUMN "reviewAcknowledgementVersion" TEXT;

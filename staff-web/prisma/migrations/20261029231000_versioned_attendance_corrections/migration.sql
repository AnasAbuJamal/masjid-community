-- Existing attendance gets revision 1, but NO fabricated original-mark time.
-- All corrections must append original/new status and reason to AuditEvent.
ALTER TABLE "Attendance" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Attendance" ADD COLUMN "markedAt" TIMESTAMP(3);
ALTER TABLE "Attendance" ADD COLUMN "correctedAt" TIMESTAMP(3);
ALTER TABLE "Attendance" ADD COLUMN "correctedById" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "correctionReason" TEXT;

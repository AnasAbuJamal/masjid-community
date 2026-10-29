-- Additive ownership marker for new student records.
-- Existing student rows remain null pending reviewed manual backfill.
ALTER TABLE "Student" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "Student_organizationId_idx" ON "Student"("organizationId");
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
 ON DELETE SET NULL ON UPDATE CASCADE;

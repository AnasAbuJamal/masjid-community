-- Explicit, private school cohort waitlist. Does not backfill or
-- infer guardianship from name, family email or a previous enrollment.
CREATE TYPE "SchoolWaitlistStatus" AS ENUM ('waiting','promoted','cancelled');
CREATE TABLE "SchoolWaitlist" (
 "id" TEXT NOT NULL,
 "classId" TEXT NOT NULL,
 "studentId" TEXT NOT NULL,
 "status" "SchoolWaitlistStatus" NOT NULL DEFAULT 'waiting',
 "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "decidedAt" TIMESTAMP(3),
 "decidedById" TEXT,
 "decisionReason" TEXT,
 CONSTRAINT "SchoolWaitlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SchoolWaitlist_classId_studentId_key"
 ON "SchoolWaitlist"("classId","studentId");
CREATE INDEX "SchoolWaitlist_classId_status_requestedAt_id_idx"
 ON "SchoolWaitlist"("classId","status","requestedAt","id");
ALTER TABLE "SchoolWaitlist" ADD CONSTRAINT "SchoolWaitlist_classId_fkey"
 FOREIGN KEY ("classId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolWaitlist" ADD CONSTRAINT "SchoolWaitlist_studentId_fkey"
 FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

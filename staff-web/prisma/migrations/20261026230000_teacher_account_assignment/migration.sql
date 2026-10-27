ALTER TABLE "Class" ADD COLUMN "teacherId" INTEGER;
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Deliberately no display-name backfill: an administrator must link trusted accounts.

ALTER TABLE "Class" ADD COLUMN "teacherId" INTEGER;
ALTER TABLE "Student" ADD COLUMN "userId" INTEGER;
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

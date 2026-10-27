DO $$ BEGIN
  CREATE TYPE "CrmTaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CrmTaskStatus" AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CrmTask" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "assignedTo" TEXT,
  "dueDate" TIMESTAMP(3),
  "priority" "CrmTaskPriority" NOT NULL DEFAULT 'medium',
  "status" "CrmTaskStatus" NOT NULL DEFAULT 'pending',
  "category" TEXT NOT NULL DEFAULT 'general',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CrmTask_status_dueDate_idx" ON "CrmTask"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "CrmTask_category_idx" ON "CrmTask"("category");

CREATE TABLE IF NOT EXISTS "EducationalResource" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "gradeLevels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "thumbnailUrl" TEXT,
  "duration" INTEGER,
  "fileSize" INTEGER,
  "createdBy" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EducationalResource_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EducationalResource_isPublished_category_idx"
  ON "EducationalResource"("isPublished","category");
CREATE INDEX IF NOT EXISTS "EducationalResource_createdAt_idx"
  ON "EducationalResource"("createdAt");

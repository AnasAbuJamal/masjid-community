ALTER TABLE "VolunteerApplication"
ADD COLUMN "decisionReason" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT;

-- Additive migration: connect private donation history to authenticated account ownership.
-- Existing guest donations remain unlinked; do not infer ownership from a submitted email.
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
CREATE INDEX IF NOT EXISTS "Donation_userId_idx" ON "Donation"("userId");

-- Preserve legacy records while prohibiting anonymous registration going forward.
-- Legacy NULL-owner tokens must not be used to deliver private notifications.
ALTER TABLE "PushToken" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
CREATE INDEX IF NOT EXISTS "PushToken_userId_idx" ON "PushToken"("userId");
DO $$ BEGIN
  ALTER TABLE "PushToken"
    ADD CONSTRAINT "PushToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

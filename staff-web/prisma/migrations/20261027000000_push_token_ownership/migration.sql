ALTER TABLE "PushToken" ADD COLUMN "userId" INTEGER, ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Existing unowned tokens must not receive personalized deliveries. Require re-registration.

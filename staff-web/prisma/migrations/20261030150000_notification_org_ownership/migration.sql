-- Privacy-safe additive notification organization ownership.
-- Historic notifications retain NULL organizationId: never infer tenancy
-- from the user or assign private historical text to the first mosque.
ALTER TABLE "Notification" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "Notification_organizationId_userId_createdAt_idx" ON "Notification"("organizationId","userId","createdAt");
CREATE INDEX "Notification_userId_organizationId_readAt_idx" ON "Notification"("userId","organizationId","readAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

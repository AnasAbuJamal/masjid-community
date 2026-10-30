-- Additive, explicit per-mosque email preferences. All optional purposes
-- start opted OUT; legacy global newsletter/event booleans cannot create
-- organization-specific consent and therefore are deliberately NOT backfilled.
CREATE TYPE "DeliveryPurpose" AS ENUM ('service','event_updates','community_news');
CREATE TYPE "DeliveryChannel" AS ENUM ('email');
ALTER TABLE "Notification" ADD COLUMN "purpose" "DeliveryPurpose" NOT NULL DEFAULT 'service';
CREATE TABLE "OrganizationDeliveryPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "purpose" "DeliveryPurpose" NOT NULL,
  "channel" "DeliveryChannel" NOT NULL DEFAULT 'email',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "consentedAt" TIMESTAMP(3),
  "quietStartHour" INTEGER,
  "quietEndHour" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationDeliveryPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationDeliveryPreference_optional_only_check" CHECK ("purpose" <> 'service'),
  CONSTRAINT "OrganizationDeliveryPreference_quiet_hours_check"
  CHECK ((("quietStartHour" IS NULL AND "quietEndHour" IS NULL)
      OR ("quietStartHour" IS NOT NULL AND "quietEndHour" IS NOT NULL
       AND "quietStartHour" BETWEEN 0 AND 23
       AND "quietEndHour" BETWEEN 0 AND 23
       AND "quietStartHour" <> "quietEndHour"))),
  CONSTRAINT "OrganizationDeliveryPreference_consent_check"
  CHECK (NOT "enabled" OR "consentedAt" IS NOT NULL)
);
CREATE UNIQUE INDEX "OrganizationDeliveryPreference_organizationId_userId_purpose_channel_key"
 ON "OrganizationDeliveryPreference"("organizationId","userId","purpose","channel");
CREATE INDEX "OrganizationDeliveryPreference_userId_organizationId_idx"
 ON "OrganizationDeliveryPreference"("userId","organizationId");
ALTER TABLE "OrganizationDeliveryPreference" ADD CONSTRAINT "OrganizationDeliveryPreference_userId_fkey"
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationDeliveryPreference" ADD CONSTRAINT "OrganizationDeliveryPreference_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

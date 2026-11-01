-- F-049 optional, independent per-mosque analytics consent.
-- All pre-existing users remain opted OUT; no backfill from email preferences.
CREATE TABLE "OrganizationAnalyticsConsent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationAnalyticsConsent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationAnalyticsConsent_organizationId_userId_key"
    ON "OrganizationAnalyticsConsent"("organizationId", "userId");
CREATE INDEX "OrganizationAnalyticsConsent_organizationId_enabled_consentedAt_idx"
    ON "OrganizationAnalyticsConsent"("organizationId", "enabled", "consentedAt");
ALTER TABLE "OrganizationAnalyticsConsent"
    ADD CONSTRAINT "OrganizationAnalyticsConsent_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationAnalyticsConsent"
    ADD CONSTRAINT "OrganizationAnalyticsConsent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

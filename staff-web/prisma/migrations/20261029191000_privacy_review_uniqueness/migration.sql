-- Prevent simultaneous privacy submissions creating duplicate pending reviews.
-- Historical NULL-organization requests are intentionally outside this
-- uniqueness constraint until a privacy officer performs scoped reconciliation.
-- This does not delete or automatically classify any legacy request.
CREATE UNIQUE INDEX "DeletionRequest_one_active_per_org_user_idx"
 ON "DeletionRequest" ("organizationId","userId")
 WHERE "organizationId" IS NOT NULL
 AND "status" IN ('pending'::"DeletionStatus",'in_review'::"DeletionStatus");

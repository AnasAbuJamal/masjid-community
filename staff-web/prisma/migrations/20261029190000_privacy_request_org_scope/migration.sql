-- Additive tenant ownership for requests to review organization-held data.
-- Historical unscoped privacy requests stay NULL and are NOT assigned to a
-- mosque by email, membership, timestamp, or guesswork.
ALTER TABLE "DeletionRequest" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "DeletionRequest_organizationId_status_createdAt_idx"
 ON "DeletionRequest"("organizationId","status","createdAt");
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
 ON DELETE SET NULL ON UPDATE CASCADE;

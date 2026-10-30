-- Add session-scoped member mosque choice. Existing sessions remain on
-- the original pilot mosque (NULL), never inferred from membership count.
-- Keep this as an opaque ID until all privileged roles are tenant-scoped.
ALTER TABLE "AuthSession" ADD COLUMN "selectedOrganizationId" TEXT;
CREATE INDEX "AuthSession_userId_selectedOrganizationId_idx"
 ON "AuthSession"("userId","selectedOrganizationId");

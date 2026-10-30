-- Optional care feature: encrypted-at-rest, scoped to one organization and
-- two-person authorization before staff can decrypt a request.
-- Do not backfill public contact messages as care cases.
ALTER TYPE "RoleCapability" ADD VALUE 'care_manage';

CREATE TYPE "CareCaseStatus" AS ENUM ('submitted','in_review','closed');
CREATE TYPE "CareAccessStatus" AS ENUM ('proposed','approved','revoked');
CREATE TABLE "CareRequest" (
 "id" TEXT NOT NULL,
 "reference" TEXT NOT NULL,
 "organizationId" TEXT NOT NULL,
 "requesterId" TEXT NOT NULL,
 "encryptedMessage" TEXT NOT NULL,
 "consentVersion" TEXT NOT NULL,
 "consentedAt" TIMESTAMP(3) NOT NULL,
 "status" "CareCaseStatus" NOT NULL DEFAULT 'submitted',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "closedAt" TIMESTAMP(3),
 "retentionAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CareRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareRequest_reference_key" ON "CareRequest"("reference");
CREATE INDEX "CareRequest_organizationId_status_createdAt_idx" ON "CareRequest"("organizationId","status","createdAt");
CREATE INDEX "CareRequest_requesterId_organizationId_createdAt_idx" ON "CareRequest"("requesterId","organizationId","createdAt");
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_requesterId_fkey"
 FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "CareCaseAccess" (
 "id" TEXT NOT NULL,
 "caseId" TEXT NOT NULL,
 "assigneeId" TEXT NOT NULL,
 "proposedById" TEXT NOT NULL,
 "approvedById" TEXT,
 "reason" TEXT NOT NULL,
 "status" "CareAccessStatus" NOT NULL DEFAULT 'proposed',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "approvedAt" TIMESTAMP(3),
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "revokedAt" TIMESTAMP(3),
 CONSTRAINT "CareCaseAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareCaseAccess_caseId_assigneeId_key" ON "CareCaseAccess"("caseId","assigneeId");
CREATE INDEX "CareCaseAccess_caseId_status_expiresAt_idx" ON "CareCaseAccess"("caseId","status","expiresAt");
CREATE INDEX "CareCaseAccess_assigneeId_status_expiresAt_idx" ON "CareCaseAccess"("assigneeId","status","expiresAt");
ALTER TABLE "CareCaseAccess" ADD CONSTRAINT "CareCaseAccess_caseId_fkey"
 FOREIGN KEY ("caseId") REFERENCES "CareRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareCaseAccess" ADD CONSTRAINT "CareCaseAccess_assigneeId_fkey"
 FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

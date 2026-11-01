-- F-050: explicit, time-limited delegated support permission.
-- Granting the enum alone does not provide authority. Expiry, MFA, mosque
-- membership, role and revocation are checked live on every support request.
ALTER TYPE "RoleCapability" ADD VALUE IF NOT EXISTS 'support_manage';

-- Metadata-only operational cases. No free-text case body or arbitrary
-- support note payload can be persisted through these tables.
CREATE TABLE "SupportCase" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportCase_category_check" CHECK ("category" IN
   ('login_access','public_content','event_registration','school_access','payments_metadata','technical_fault')),
  CONSTRAINT "SupportCase_status_check" CHECK ("status" IN ('open','investigating','resolved')),
  CONSTRAINT "SupportCase_resolved_check" CHECK (
    ("status"='resolved' AND "resolvedAt" IS NOT NULL) OR
    ("status"<>'resolved' AND "resolvedAt" IS NULL)
  )
);
CREATE UNIQUE INDEX "SupportCase_organizationId_traceId_key"
 ON "SupportCase"("organizationId","traceId");
CREATE INDEX "SupportCase_organizationId_createdAt_id_idx"
 ON "SupportCase"("organizationId","createdAt","id");
ALTER TABLE "SupportCase"
 ADD CONSTRAINT "SupportCase_organizationId_fkey" FOREIGN KEY ("organizationId")
 REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportCase"
 ADD CONSTRAINT "SupportCase_createdById_fkey" FOREIGN KEY ("createdById")
 REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SupportCaseNote" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportCaseNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportCaseNote_code_check" CHECK ("code" IN
   ('investigation_started','reproduced','unable_to_reproduce','escalated_to_owner','fix_in_progress','resolution_verified'))
);
CREATE INDEX "SupportCaseNote_caseId_createdAt_id_idx"
 ON "SupportCaseNote"("caseId","createdAt","id");
ALTER TABLE "SupportCaseNote"
 ADD CONSTRAINT "SupportCaseNote_caseId_fkey" FOREIGN KEY ("caseId")
 REFERENCES "SupportCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportCaseNote"
 ADD CONSTRAINT "SupportCaseNote_authorId_fkey" FOREIGN KEY ("authorId")
 REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A separate, tenant-specific, application-keyed HMAC trail.
-- Historical AuditEvent records are intentionally not backfilled with
-- imaginary integrity, organization ownership, or request identity.
CREATE TABLE "IntegrityAuditEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "requestId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "previousHash" TEXT NOT NULL,
  "recordHash" TEXT NOT NULL,
  CONSTRAINT "IntegrityAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IntegrityAuditEvent_sequence_positive" CHECK ("sequence" > 0),
  CONSTRAINT "IntegrityAuditEvent_hash_length" CHECK
   (length("previousHash")=64 AND length("recordHash")=64),
  CONSTRAINT "IntegrityAuditEvent_outcome" CHECK ("outcome" IN ('allowed','denied')),
  CONSTRAINT "IntegrityAuditEvent_requestId_length" CHECK
   (length("requestId") BETWEEN 8 AND 64)
);
CREATE UNIQUE INDEX "IntegrityAuditEvent_organizationId_sequence_key"
 ON "IntegrityAuditEvent"("organizationId","sequence");
CREATE INDEX "IntegrityAuditEvent_organizationId_occurredAt_idx"
 ON "IntegrityAuditEvent"("organizationId","occurredAt");
ALTER TABLE "IntegrityAuditEvent" ADD CONSTRAINT "IntegrityAuditEvent_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Application-level updates, deletes and TRUNCATE are forbidden even for
-- the usual app DB account. This is NOT protection against a DBA who can
-- drop triggers/rewrite tables; independent head anchoring remains missing.
CREATE FUNCTION sila_block_integrity_audit_mutation() RETURNS trigger
 LANGUAGE plpgsql AS $$
 BEGIN
  RAISE EXCEPTION 'Integrity audit entries are append-only' USING ERRCODE='55000';
 END;
$$;
CREATE TRIGGER sila_integrity_audit_no_update_delete
 BEFORE UPDATE OR DELETE ON "IntegrityAuditEvent" FOR EACH ROW
 EXECUTE FUNCTION sila_block_integrity_audit_mutation();
CREATE TRIGGER sila_integrity_audit_no_truncate
 BEFORE TRUNCATE ON "IntegrityAuditEvent" FOR EACH STATEMENT
 EXECUTE FUNCTION sila_block_integrity_audit_mutation();

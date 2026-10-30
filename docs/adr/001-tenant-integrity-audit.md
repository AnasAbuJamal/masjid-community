# ADR 001 — Tenant-scoped HMAC audit trail (pilot)

Status: **Implemented as code and disposable-CI verification only; not approved for production.**

## Problem
The original `AuditEvent` records document many actions but lack a trustworthy
organization owner, outcome, request correlation, tamper detection and
application-enforced immutability. Retroactively assigning old records to a
mosque or claiming they are sealed would create false assurances.

## Decision
Create a separate additive `IntegrityAuditEvent` rather than mutate historical
audit data. Each new protected privilege/invitation/privacy-export transaction
appends an explicitly scoped, safe-metadata event with a sequential per-mosque
HMAC-SHA256 chain. The HMAC key lives **outside the database** and
`pg_advisory_xact_lock` serializes per-mosque append. PostgreSQL triggers
forbid ordinary UPDATE, DELETE and TRUNCATE on these records. Keep the opaque
actor reference even after account deletion, without a hard FK to the identity.
Fail closed when the independent key is absent.

## Boundaries and trade-offs
- This does not cryptographically cover earlier `AuditEvent` rows or unrelated
  modules and does not yet capture denied actions or detailed change diffs.
- The record hash includes canonical JSON values, a sequence number, previous
  hash, actor, mosque, request ID, object and outcome. Metadata is allowlisted.
- An administrator with database DDL rights can remove triggers or rewrite the
  chain; a compromised runtime HMAC key can permit forged hashes. Independent,
  append-only head anchoring is therefore required before signoff.
- Truncation of the verifier at 10,000 rows reports *incomplete*, never a
  silent pass; operations teams must scale verification/pagination later.
- Tenant context remains the explicit guarded **single-mosque pilot**. It does
  not solve account-global roles or multi-mosque context selection.
- CI exercises real PostgreSQL constraints and HMAC recomputation with
  artificial identities; no live data, external provider or production
  migration is involved.

## Follow-up
Develop independent auditor grants, approved offsite anchors, external custody
of chain heads/keys, key rollover and full historical audit retention policy,
and instrument denied security events and other sensitive workflows.

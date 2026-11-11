# Selected mosque private export plan

**Goal:** F-043/F-048: a verified member can export their own bounded records from the selected active mosque, including a secondary membership, without combining organizations.

**Architecture:** Reuse server-selected `requireMemberContext` and retain password/MFA step-up, no-store responses, limited field selection, audit and per-account download limits. Revalidate authorization and the exact same context immediately before the export audit/response. Reject caller-supplied identity or tenant fields. Native confirmation/response isolation remains in place.

**Spec:** `document.md` F-043/F-048 and existing per-mosque export exclusions. Student/guardian records, confidential care text, provider records and cross-organization archives remain excluded; no new roles or scope grants.

## Work
1. Add disposable PostgreSQL HTTP acceptance tests for two mosques and two synthetic owners across all eight export categories, context switching, expired/revoked membership/session, role escalation, password/MFA denial, injection rejection, no-store and per-person limits. Observe second-mosque export failing on current code.
2. Change export authorization to the session-selected active member context, validate strict input and recheck context after retrieval; preserve category and owner filters and honest truncation.
3. Run all root tests and both TypeScript checks, Prisma validation, Expo package compatibility and web build; run synthetic PostgreSQL integration in GitHub CI (no local PostgreSQL server is available). Review and publish to existing privacy-export PR, then inspect exact-head GitHub CI.
4. Document evidence and remaining external/device/legal acceptance. No deployment, remote database change, actual user export or provider operations.

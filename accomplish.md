# Completion plan — resume from the latest edited branch

Canonical source for continued work: `fix/security-functionality-apple-ui-20261026`, draft PR #2. This session started at `abe4bf3a62a8c66b6a72d40caf34e7d392b49062` after the user explicitly asked to resume the edits from another chat. Do not replace this tree with the older `codex/completion-and-database-readiness` branch. That branch and its unfinished mobile assignment work remain separate.

Read `SECURITY_AND_RELEASE_AUDIT.md` for the current feature inventory and release blockers. The previous checklist from the older branch is not a reliable description of this newer tree.

## Verification baseline

GitHub run 40412704771 passed both jobs for the latest starting commit, including its existing authenticated API and responsive browser tests. This does not prove all features or production integrations work. A fresh run is required for this session's changes.

## Current improvement: trusted teacher account links

- Added nullable Class.teacherId with User relation/index and additive migration `20261026230000_teacher_account_assignment`.
- Replaced mutable display-name matching in the mobile teacher overview and attendance APIs with account ID matching. No automatic name-based migration/backfill.
- Administrators can select an active teacher account in Classroom create/edit. Display names remain display-only. Unassigned classes do not grant teacher access.
- Restricted legacy class/student roster mutations to administrators, scoped teacher roster reads to linked classes, and blocked other roles from those internal roster reads.
- Whitelisted flat fields in legacy assignment writes so nested Prisma objects cannot be used to modify class assignments indirectly.
- Added permission tests for name impersonation, role exclusions and denied legacy roster mutations.

Deployment prerequisite: review/apply the additive migration in staging, then explicitly link teacher accounts. This session did not access or modify production data or credentials. Existing teacher users need account links before using the teaching portal.

## Next priorities

1. Re-audit every legacy school API (assignments, reports, attendance, student lookup, exports) for role and row scope. This new branch contains different implementations from the older work. The teacher-account fix is not a claim of complete school authorization coverage.
2. Improve teacher attendance atomicity, transferred-student/day conflicts, simultaneous updates and rate policy; preserve this branch's current attendance percentage semantics until a deliberate policy change.
3. Verify feature parity and honest empty/error states across all mobile/admin/CRM routes against the actual current source. Some audit notes may lag changes already implemented.
4. Review this branch's migrations against a staging snapshot; CI db push is not migration validation. Test real payment/email/push providers and account isolation.
5. Continue responsive/accessibility review and native device testing; run the full CI suite before merging.
6. Resolve the secret-rotation and operational release blockers listed in the release audit. Do not mark the entire app complete based on builds/unit tests alone.

## Design and construction rules

Use shared theme tokens, clear labels, keyboard and screen-reader access, at least 44px touch targets, responsive wrapping, and truthful loading/error/empty/success feedback. Keep validation and role checks on the server; derive ownership from verified sessions. Avoid self-selected roles, name/email-only grants without trusted verification, nested client-controlled database writes, fake counts and fake successful actions. Database changes must have reviewed migrations; records must survive retries and failures without accidental data loss.

Local verification for teacher linking: all 43 staff unit tests and TypeScript passed; Prisma schema-only diff matches the added SQL migration. Added an authenticated CI scenario proving that renaming a teacher preserves only the linked class and never exposes an unassigned class with the same display name. That new browser/API scenario still requires a fresh CI run.

Concurrent edits arrived on the canonical branch during this session (kiosk, Qibla and settings, through 11c5fdd). Integrate them before publishing; never replace their tree with the starting snapshot.

Integrated the newer kiosk/Qibla/settings commits through 11c5fdd without conflicts. The combined tree passed both TypeScript checks, 43 staff unit tests and 81 mobile unit tests. The new authenticated teacher-link E2E case is committed for CI but has not been run locally. Full production readiness is still blocked by the release audit requirements.

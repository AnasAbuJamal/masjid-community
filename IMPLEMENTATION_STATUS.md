# Implementation status — 2026-10-26

## Reality check
\`document.md\` describes the intended entire community platform. This new code is a **foundational implementation**, not an assertion that all specified features are complete. The former program was deleted from the active Git tree before this rebuild, and no old application code was restored.

### Built in this iteration
- Next.js admin sign-in, responsive original azure/white glass styling and publishing controls for prayer, announcements, events, school program, giving campaign, volunteer opportunity, jobs, proposals and rentals.
- Organization/venue, users/sessions/verification, worship, school/guardians/teacher assignments, events, giving/payment events, volunteer, proposal, work/rental, notifications and audit database models.
- Public APIs returning **database records only**; protected sessions, registration and email challenge scaffolding.
- Authenticated member actions: event RSVP with transactional capacity, volunteer application, proposal vote, job application, facility request; teachers can record assigned-class session attendance.
- Stripe donation checkout and signed webhook payment-confirmation foundation (requires configured keys).
- Expo native app with five tabs; guest/member flows, published prayer calendar, Qibla true-north bearing, event/volunteer/job/proposal/rental detail actions, signup/login and protected account/history.
- Initial CI/build configuration and local-only bootstrap.

### Not completed / not safe for a production release
- No staging/production database migration, reconciliation, restore rehearsal or live secrets/provider provisioning.
- MFA, login throttling/distributed rate limiting, native rotating refresh tokens, fine-grained role grants and full cross-organization object authorization.
- Full guardian/teacher enrollment workflow administration, private invoices, attendance session management UI, report cards, grading, student resources and safeguarding/legal review.
- Full donation ledger, recurring payments, refunds, provider event ordering/reconciliation and receipt generation.
- Event cancellation, volunteer shift/check-in, proposal moderation/revision, booking collision locks/fees/approval calendar, job resume upload, full CRM, financial budgets and kiosk.
- Authenticated notification preferences, real push/email delivery QA, account export/deletion, localization/Arabic/RTL and all native-device accessibility testing.
- App icon/splash/media assets, automated native E2E, stress/security tests and live production deployment.
- SDK versions and lint/build must be validated in GitHub CI; this environment cannot install dependencies from the public registry.

### Twenty-fourth implementation pass: public SILA visitor website (in review)
- Added a server-rendered, guest-accessible `/visit` website with mosque and venue selection, venue-local published prayer/iqamah/Jummah times, source/revision information, approved faith notices, published announcements, upcoming gatherings and published learning programs.
- Published gatherings, notices, faith dates and programs have shareable detail URLs with server-side publication and organization filters; unknown or draft IDs return 404.
- Guest public site preserves explicit missing-schedule states and never substitutes sample worship values. Staff sign-in now links to public information.
- CI integration checks no-login access, venue isolation, hidden drafts and public detail routes, and workflow checks run on development-targeted pull requests.
- This is one vertical slice; it does **not** complete comprehensive Arabic/RTL, offline access, approved prayer revision workflow, child safeguarding, cross-organization launch readiness, or end-to-end device/accessibility review.

## Feature acceptance
No feature is considered production-complete until it meets the privacy, accuracy, security, accessibility, migration and device verification criteria in \`document.md\`. API endpoints can be present without every related role/screen being ready.

## Next priorities
1. Get Prisma validate, TypeScript and Next build green on GitHub; resolve any CI errors.
2. Build verified guardian/class admin workflows and row-scoped tests.
3. Fix account safety gaps (durable throttling, privileged MFA, access-token rotation/revocation).
4. Complete reliable money/webhook reconciliation, actual receipts and provider setup.
5. Finish mobile/design accessibility, Arabic/RTL, native device tests and production runbooks.

### Second implementation pass
- Dedicated school operations portal for classes, student records, verified guardian links, teacher assignments, enrollments and scheduled class sessions.
- Scoped teacher classes API and native teacher attendance screen, with persisted marks.
- Separate restricted finance overview displaying **only** latest paid Stripe-verified donation records, explicitly not a financial reconciliation or bank balance.
- Role-specific links from admin portal and school mobile tab.

### Third implementation pass
- School invoice model in integer minor currency units with a designated, approved guardian payer.
- Admin tuition issuance and voiding with audited role checks; native family invoice list and Stripe Checkout initiation.
- Expanded signed webhook handling for invoice settlement and session expiry.
- **Not yet complete:** invoice refund workflow, reconciliation ledger, electronic receipt generation and finance dual approval; these remain release blockers.

### Fourth implementation pass
- Facility approval/rejection queue with server-side conflict checks and private status notifications.
- Member event RSVP cancellation, in-app notification read state, and personal booking/volunteer/job histories.
- Staff portal operations navigation and mobile notification inbox.

### Fifth implementation pass
- Password-reset request and secure one-use time-limited reset token flows, with existing-session revocation.
- Database-backed per-account failed-login throttling (additional network/provider-level anti-abuse still required).
- Native and web password recovery screens and sign-in links.

### Sixth implementation pass
- SchoolAssignment, StudentSubmission and StudentReport models, scoped to class/student relations.
- Teacher-authored assignments and progress reports with explicit publication state, own-student submission, and verified guardian/student read views.
- Dedicated teacher web workspace and native learning center.
- Still missing grading rubrics, full enrollment decision workflow, safeguarding review and broad cross-role E2E tests.

### Seventh implementation pass
- Database-backed member proposals with moderation and an owned submission history.
- Public contact form with basic cooldown, admin inbox and review/close actions.
- Public read-only mosque kiosk showing only published daily Salah, announcements, and events.
- **Not yet complete:** network-level anti-spam, full content revision workflow, moderated attachments, CRM contact consents and safe automated alerts.

### Eighth implementation pass
- CI now provisions a dedicated PostgreSQL 16 service, initializes the schema in a disposable database, tests relationships/constraints, then runs web/API smoke checks.
- This validates schema functionality but is not a staging/prod migration rehearsal or full native end-to-end suite.

### Ninth implementation pass
- Financial budget allocations and expense approval workflows with separate submitter and reviewer identities.
- Restricted finance control center; published budget allocations appear in the public transparency API.
- Financial allocations and expense records included in disposable PostgreSQL integration tests.
- **Not a reconciled ledger**: accounting journal lines, receipts, provider settlements, expense attachments and refund workflows require further engineering and finance approval.

### Tenth implementation pass
- Verified guardians can submit program applications; admins approve or decline with documented relationship-verification confirmation.
- Approval creates a private student profile and approved guardian relationship with a recorded decision and notification.
- Class enrollment remains a separate administrative action; student accounts are never automatically activated by acceptance.

### Eleventh implementation pass
- Member profile/preferences, session revocation, bounded account data export and account-deletion request workflows.
- Dedicated native account settings and restricted admin privacy review screen.
- **Important:** requesting deletion does not erase records; legal retention and child-data safeguards still need formal implementation. Marketing integrations are not activated by saving opt-ins.

### Twelfth implementation pass
- Staff scheduling, check-in and completion of approved volunteer shifts, with a private member shift history.
- Shift relationships and status are persisted and covered by the disposable PostgreSQL fixture.
- Further work needed: shift capacity across multiple venues, check-in identity proof, recurring shifts and canceled-event reconciliation.

### Thirteenth implementation pass
- Publishable community articles and construction projects with visible verified milestones.
- Staff authoring and public mobile browsing through the same governed content API.
- Dedicated tables and simple database integration checks. Media uploads, revisions and granular editorial approval are still future requirements.

### Fourteenth implementation pass: privileged MFA and security checks
- Privileged admin/finance sessions now require TOTP verification before sensitive `requireVerified` operations; first enrollment requires the account password.
- Authenticator secrets are encrypted with a separate environment key; codes accept a small clock-skew window and reject replayed counters.
- Added web/native MFA setup and verification screens.
- CI tests the **actual HTTP** privileged gate, enrollment, wrong code, replay prevention and member denial against a disposable Postgres database.
- Operational blockers remain: production secret provisioning, account recovery/break-glass policy, privileged TOTP recovery, penetration testing, hardware-key/passkey options and authorization audits.

### Fifteenth implementation pass: verified payment receipts and balanced accounting entries
- Signed Stripe Checkout events now post a private payment receipt and a two-line balanced clearing/revenue journal transactionally for donations and school tuition.
- Persist the provider payment intent ID; fully refunded charges produce a reversing journal and retain the receipt as refunded. Partial refunds **do not** pretend to be fully refunded.
- Added private member/guardian receipt API and native viewing screens.
- Synthetic signed provider events exercise amount mismatch, signature rejection, exact/different replay IDs, both payment types, privacy, full reversal and partial-refund behavior in CI.
- **Remaining:** real provider test-mode end-to-end runs, formal refund approvals, partial-refund ledger postings, settlement reconciliation, receipt PDF/legal wording, provider failure retries and migration rehearsal.

### Sixteenth implementation pass: maker/checker refunds
- Admin/finance may request full refunds on verified settled payments; a separate authorized account must review and approve.
- Server invokes Stripe Refunds with a stable idempotency key; pending state stays pending until the signed full-refund webhook posts a reversing accounting entry.
- Refund requests and outcomes are auditable and available to privileged finance users.
- Partial refund accounting, webhook recovery for out-of-order provider events, multi-person limit thresholds and live Stripe settlement reconciliation remain release blockers.

### Seventeenth implementation pass: searchable published content and faith calendar
- Bounded multilingual-letter search over published public events, programs, campaigns, articles, jobs and community records; native search discovery interface.
- Mosque-approved Ramadan, Eid and moon-sighting dates with draft/publish/archive workflow and audit trail. No automatic astronomical date is presented as official.
- Editable Friday Jummah sessions by venue, with admin date/clock validation.
- CI verifies published-only search, faith notice privacy, and private admin access denial.
- Next work still needed: full Arabic translations/RTL across every screen, accessibility/device testing, automated notifications, and detailed faith schedule review workflow.

### Eighteenth implementation pass: scoped staff delegation
- Explicit organization memberships, active/suspended states, expirations, and capability grants for worship publishing, facilities, volunteering and community moderation.
- Privileged administrators may provision a verified member's staff/teacher/finance primary role, suspend membership, grant/revoke staff responsibilities, and revoke affected sessions; all operations are audited.
- Staff receive a restricted workspaces page instead of global admin aggregates. Scoped capability enforcement is checked at each delegated API.
- CI checks ungranted staff denial, allowed community moderation, expired grants and admin MFA gating.
- **Still required:** a migration/backfill plan for any existing database, fine-grained multi-organization/class/venue scoping of every remaining API, multi-role identity beyond the legacy primary role, and independent security review.

### Nineteenth implementation pass: bilingual core navigation and RTL-aware primitives
- Added a durable user-selected English/Arabic preference on the native app without storing private server data.
- Primary navigation labels, Home/Salah/Discover/School/Profile headers, prayer names, common loading/error/retry states and prominent actions now use bilingual resources.
- Shared press rows, headings, action layouts and form text alignment mirror appropriately for Arabic.
- **Not yet complete:** exhaustive Arabic translations on all secondary/detail screens, localized server-provided editorial data, translated error catalog and testing on real Arabic RTL devices.

### Twentieth implementation pass: job application lifecycle
- Restricted job-application review dashboard and server-controlled approve/decline decisions for published opportunities.
- Members see their own application statuses; reviews create audited transitions and private notifications.
- Provider messaging, file uploads/resume scanning, candidate consent policy and professional recruiting integrations remain to be implemented and reviewed.

### Twenty-first implementation pass: authenticator abuse protection
- Durable per-account TOTP throttling now applies to enrollment and re-authentication, in addition to the existing one-time code replay checks.
- Successful verification clears attempt counters; privilege enforcement stays on the server.
- Production IP/network edge controls, privileged recovery and independent penetration testing are still required.

### Twenty-second implementation pass: durable notification delivery
- In-app notifications and durable email outbox records now commit atomically in key business workflows: school enrollment, facilities, volunteering, jobs and team role changes.
- A separately authenticated bounded delivery worker leases pending items, sends only privacy-safe generic email text via the configured provider, and records failures and retry state.
- Worker is **disabled by default** without strong `CRON_SECRET`, `RESEND_API_KEY`, sender domain and origin; no external emails are claimed delivered without provider success.
- Still missing: configured scheduler, production sender domain, locked-down recipient preferences, push notification device registration/delivery, provider reconciliation, multi-tenant source scoping and full lifecycle/integration tests.

### Twenty-third implementation pass: versioned database migration for clean installations
- Generated and retained a SQL baseline for the complete current PostgreSQL/Prisma schema, with 56 tables.
- CI now performs `prisma migrate deploy` against a fresh database, followed by `migrate status` and the full domain/API smoke suite, instead of using development `db push`.
- **Critical scope:** this migration is for newly created databases only. Existing installations need audited migration planning/backfill and restore testing; staging/production database changes were not run.


### Twenty-fifth implementation pass: single-branch consolidation and SILA venue context
- Merged the public SILA website slice into the default `development` branch after the full GitHub CI suite passed. Its guest-facing `/visit` pages render only published, mosque-scoped prayer, announcements, confirmed faith dates, gatherings and learning content.
- Closed the unapproved alternate planning PR rather than overwriting the authoritative `document.md`; verified that `development` is the repository's only branch after one-time cleanup.
- Reorganized the native primary navigation to the five documented areas: Today, Gather, Learn, Care, You, while retaining access to Salah and its separate worship utilities.
- Added a real Care entry point for volunteering, published donation campaigns, the member's approved shifts and published financial allocations; confidential care case intake remains unavailable and is explicitly described as such.
- Added guest `public/venues`, scoped `public/home?venueId=...` and `public/prayers?venueId=...`, with missing/foreign venue IDs rejected on the server.
- Added a persisted, publicly validated mobile venue selector for Today and Salah and request-version invalidation to prevent earlier venue responses appearing after selection changes. No GPS or location permission is required.
- Added public integration coverage for venue listing, selected-home timing, invalid IDs and published-content filtering.
- Release gates still open: comprehensive Arabic/RTL and accessibility device QA, correctly authorized production multi-tenancy, guardian/teacher and care safeguarding audit, payment provider reconciliation, full account recovery, migrations/backups, true end-to-end suites, and reviewed deployment secrets.

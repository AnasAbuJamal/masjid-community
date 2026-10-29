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


### Twenty-sixth implementation pass: prayer publication maker/checker
- Implemented a private, venue-scoped `PrayerScheduleRevision` model and additive SQL migration; each candidate retains a civil date, all adhan/iqamah values, the authoritative source, author, reviewer, state and revision. Existing published `PrayerDay` records remain intact while a new candidate is drafted or reviewed.
- Added `/api/v1/admin/prayer-revisions` with explicit creation, submission, independent approval, publication and withdrawal transitions. The author may not approve their own proposal. Access is checked server-side using the existing `worship_publish` capability, email verification and administrator MFA rules.
- Publication uses a serializable database transaction, checks the published base revision to prevent stale corrections, copies the reviewed values atomically, and writes previous/new values and the reason to an audit record. Published requests can be safely retried without posting again.
- Added a staff publishing screen at `/admin/prayer-revisions` and a link from the existing worship console. Blank optional iqamah fields are supported and invalid civil dates, time ordering and invalid corrections are rejected.
- Expanded isolated CI HTTP acceptance coverage for anonymous/member denial, maker/checker separation, delegated reviewer access, draft non-disclosure, publication retry, verified revision correction, audit snapshots and withdrawn draft handling. The public faith feed now also requires a named approver rather than merely the published flag.
- This slice advances `document.md` SILA-006/008 and J10 but **does not finish** the full worship system: Jummah publication still uses the older direct workflow, automatic import and emergency alert fan-out are not complete, independent device/accessibility testing is still required, and the additive migration has not been reviewed or applied against any live database.
- Production deployment remains blocked: the connected Vercel project has no configured database connection or production environment secrets; no changes to a live production database were made.


### Twenty-seventh implementation pass: closed worship bypass and real gathering waitlists
- Disabled the legacy `POST /api/v1/admin` prayer upsert entirely. Even an authenticated MFA-verified administrator receives `409 PRAYER_REVIEW_REQUIRED`, and the old admin form has been removed in favor of a prominent `/admin/prayer-revisions` workflow link. Regression tests verify the old route cannot write even an unpublished prayer record. This closes an independent-review bypass left behind after the new prayer revision model.
- Added an **opt-in per-gathering waitlist**. Previously registered attendees migrate as confirmed. Under a serializable transaction, an RSVP claims a seat if capacity remains or records an explicitly *waitlisted* (not confirmed) request if the organizer enabled waitlisting. Duplicate RSVPs are idempotent, and membership is scoped to the active mosque.
- Cancelling a confirmed RSVP before the start automatically promotes the oldest waitlisted RSVP to a confirmed place without increasing or falsely freeing event capacity; the member receives a generic durable private notification/outbox record. Cancelling a waitlisted RSVP never changes the confirmed count. Concurrent reservation conflicts produce a retriable conflict response rather than an invented success.
- Added an additive SQL migration for `Event.waitlistEnabled` and `EventRSVP.status`, organizer checkbox, public/mobile capacity and waitlist clarity, and a member profile showing confirmed versus waitlisted registration with the appropriate cancellation action.
- Extended isolated PostgreSQL CI tests for guest denial, idempotence, capacity, FIFO promotion, notifications, waitlist exit, full events without waitlisting and cross-organization rejection.
- **Limitations:** Circles, real host check-in and rich event policies (language, pricing, accessibility, RSVP cutoffs, waitlist opt-in messaging and cancellation terms) still require a scoped implementation and field review. Existing records require a tested migration plan before any existing production database is changed.


### Twenty-eighth implementation pass: member self-service and calendar downloads
- Added `GET /api/v1/events/registration?eventId=...`, with verified identity and organization scoping, returning **only the signed-in member's** confirmed/waitlisted record (never another attendee's record or a public roster). Native Gather detail shows this live state, avoids duplicate RSVP actions, and lets the member leave the waitlist or cancel before the event.
- Added a safe public iCalendar download for published, organization-scoped gatherings at `/api/v1/events/{id}/calendar`. Exports actual event timestamps in UTC with calendar escaping/folding and no attendee information, explicitly stating that downloading **does not reserve a seat**. The public gathering detail links to this download.
- Expanded isolated HTTP tests for guest denial, private member-specific state before/after promotion/cancellation, foreign-mosque denial and public calendar content and published-only restrictions.
- Remaining Gather release gates: real host-scoped event check-in, fair conflict/last-seat stress tests, explicit RSVP deadlines and cancellation policy, accessible complete Arabic UX, and event policy review.


### Twenty-ninth implementation pass: organization-scoped classroom access
- Scoped teacher classroom listings and assigned-cohort learning views to the configured mosque's program, including administrator classroom listings. A teacher assignment to a different organization's class does not authorize reading it.
- Scoped teacher attendance updates and assignment/report creation to the same organization before checking class assignment or enrollment. Family learning lists and student submissions now filter assignments, reports and submissions through the current organization's program.
- Added disposable-PostgreSQL HTTP negative tests for foreign classes with an explicit cross-organization teacher assignment, denied foreign attendance/report/assignment writes, and foreign guardian-linked learning data not appearing in the family view. No schema migration or production data changes.
- **Still incomplete:** broader school admin/student endpoints and guardian/custody revocation need a full organization-wide authorization audit, multi-organization context selection, field-level safeguarding review and independent child-data security testing. This slice is not production readiness.

### Thirtieth implementation pass: owned child records and cross-organization school administration
- Added nullable, explicitly assigned `Student.organizationId` ownership for all newly created manual student profiles and approved guardian applications. The SQL migration adds one column, index and foreign key; **no existing student row is reassigned or deleted**. A legacy unowned child is available only with evidence from this mosque's school plus no conflicting foreign enrollment, approved application or invoice. A missing ownership value never authorizes an unlinked child read.
- Restricted school-admin student, class-session and user selectors to the operational organization. Guardian creation, teacher assignment, student enrollment, school report/attendance writes and tuition issuance/voiding reject foreign-owned students, staff and invoices. Member enrollment histories/applications, family/teacher learning views, invoices and invoice checkout now apply ownership boundaries even if malformed legacy relationships exist.
- Added disposable PostgreSQL HTTP regression checks for a distinct foreign organization, foreign teacher, guardian, invoices and submitted application, plus a deliberately malformed enrollment of a foreign-owned child into a local class. Verified both denied writes and hidden read-side child records. Existing home-org students and verified school flows remain available.
- **Backfill gate:** nullable ownership for legacy rows is intentional, not production completion. A safeguarding owner must review identities, enrollments, applications, guardians and any conflicting cross-org records before mapping existing students. Never infer a child's organization or custody from email, name or guardian link. Test any live-data migration in isolated staging with backup/restore first.
- **Still incomplete:** multi-organization context selection and global session/role model, two-person guardianship grant/revocation and custody evidence workflow, security penetration testing, full financial reconciliation, Arabic/RTL accessibility and signed device previews. These changes have not been applied to any production database.

### Thirty-first implementation pass: member actions, steward queues and payment-source isolation
- Protected every shared member-action ID lookup in `POST /api/v1/actions` (volunteer applications, published proposal votes, job applications and facility booking requests) with the active organization's ID. Foreign published IDs now fail before any insert or idempotent upsert. Existing gathering RSVP and school attendance organization checks remain in place.
- Scoped the `/api/v1/me` activity sections to the active mosque: donation campaigns, gatherings, facility bookings, volunteer applications and job applications. Scoped the volunteer shift list and personal proposal submission/listing and deduplication to that mosque; global account notifications and privacy exports still require a separate organization-aware product policy.
- Fixed privileged steward overview counts, upcoming/prayer/announcement/application lists, volunteer application decisions, volunteer shift listing/scheduling/updates and facilities approval decisions. Finance verified-payment summaries now filter by the active mosque's campaign instead of aggregating all mosques' donations.
- The donation checkout entrypoint now rejects a published campaign owned by a different mosque before creating any donation or contacting the payment provider. No live payment provider call or schema migration was required for this change.
- Added `test-community-scope.mjs` to the main disposable-PostgreSQL CI API suite. It deliberately creates published foreign records tied to the same user identity and exercises denied writes, private read filtering, steward decisions, finance totals and positive local actions; expanded tests also cover foreign donation checkout. This pass does not claim cross-tenant penetration testing.
- **Not complete:** membership/session context is still bound to the initial configured mosque rather than explicitly selected per-request tenancy; notification ownership, account exports, provider settlement reconciliation, domain-wide data flows, invited administrator scope, external security testing and safeguarding approval require independent review. Source access control improvements do not authorize a production deployment.

### Thirty-second implementation pass: explicit guardian application review acknowledgement
- The family application screen now requires an accessible native acknowledgement control before sending a child's minimal name and optional school notes; the screen warns against attaching medical/custody information to notes. On success the control resets and the request remains `submitted`, never approved merely by a client acknowledgement.
- The server now requires `reviewAcknowledged:true` (literal true) for a new `POST /api/v1/enrollment` and persists **server-issued** `reviewAcknowledgedAt` and the user-facing copy version `guardian-review-v1` on the application. Omitting the field or submitting false returns 422 before writing child information. The version is an internal acknowledgement copy reference, **not** a substitute for a legally approved consent notice.
- The staff enrollment queue displays acknowledgement state. Approving a legacy request lacking it fails closed with `409 ACKNOWLEDGEMENT_REQUIRED`; a reviewer may still decline. Independent school verification of legal guardianship remains mandatory, and the self-attestation does **not** constitute that verification.
- An additive migration `20261029170000_guardian_review_acknowledgement` adds nullable timestamp/version fields, without overwriting historical records. Disposable-PostgreSQL HTTP tests cover omission, explicit false, stored server timestamp, pending status, denied legacy approval and the existing foreign-school application boundary.
- **Still incomplete:** approved legal privacy/child-consent text, custody evidence workflow with distinct safeguarding authority, independent staff decisions, student data retention, reviewed migration/backfill and device accessibility QA. No real child data or production database was touched.

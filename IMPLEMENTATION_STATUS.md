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

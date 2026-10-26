# Masjid Community — Release Audit and Verification Matrix

**Updated:** 2026-10-26. **Release status: NOT READY.** Draft pull request [#2](https://github.com/AnasAbuJamal/masjid-community/pull/2) is intentionally unmerged.

## Repository and build verification

The initial `development` branch included 316 tracked files across the Next.js staff backend/dashboard and Expo React Native app. That tree was inventoried. **Not every function in every source file has been individually executed**, and green CI is not a guarantee of flawless production behavior.

GitHub Actions verifies:
- An isolated PostgreSQL 16 service with `npx prisma validate`, `prisma db push` and strictly guarded CI-only fixtures.
- Staff-web unit tests, TypeScript compilation and the Next.js production build.
- Expo mobile unit tests and TypeScript compilation.
- Chromium Playwright tests of login and responsive navigation at phone (390px), iPad (820px) and desktop (1440px) widths.
- Integration tests for bearer sessions, verified-parent isolation, administrative users, school invoices, resource publishing, monthly financial budget visibility, CRM reports, volunteer capacity, job moderation, donor anonymity, announcement scheduling and facility collision prevention.

A confirmed green workflow before the newest changes was **[run 40398499899](https://github.com/AnasAbuJamal/masjid-community/actions/runs/40398499899)**. **The newest commits require a fresh completed green run**; do not count cancelled intermediate runs as passing.

## Features implemented or significantly repaired in this PR

### Security and authentication
- Removed checked-in active environment files and insecure hard-coded runtime secrets. Hardened CORS and build checks.
- Replaced unsigned mobile bearer tokens with signed, expiring sessions validated by the server. Restored mobile register/login/me/profile/password APIs and runtime role checks.
- Added expiring, hashed, one-time email verification. Parent-only student, attendance, progress, enrollment, rental and application access requires verified email ownership rather than relying on an unverified claimed address.
- Added audited administrator operations, strict input validation, more appropriate no-store responses and failure handling across new endpoints.

### School and parent experience
- Database-backed class catalog, class details, instructor-entered assessments, weekly schedules, assignments and parent/student information.
- Replaced fictitious tuition charges with `SchoolInvoice`, parent-scoped billing, Stripe Checkout and amount-bound signed webhook reconciliation.
- Responsive administrator billing dashboard for issuing, viewing and safely voiding invoices.
- Curated `EducationalResource` model, staff/teacher publishing dashboard, public resource search/filter/pagination, safe HTTPS links and tracked views; drafts are not publicly accessible.

### Donations and financial transparency
- Stripe-hosted donations and verified webhook updates, recurring subscription state/cancellation, private donation history and actual account records instead of fabricated receipts.
- Published `FinancialBudget` categories with administrator create/edit/delete workflow. Community mobile finances now shows actual recorded summary and expense category aggregations with budget draft privacy.
- Admin-only CRM aggregation of verified payment totals and donor history, with anonymous donor names and emails excluded.
- Admin-only CRM financial/member trends. Reports clearly label event RSVPs as registrations, not attendance or check-ins.

### Community and administration
- Real job listings, job detail and applications; administrative mobile job publishing and status moderation.
- Volunteer applications with transactional approval, bounded capacity and duplicate-action protection.
- Real mobile admin users, status/role management, audit history, announcement publishing/scheduling and hide/show controls.
- Real CRM facilities and rental booking moderation with time-overlap checks.
- Proposal voting and persisted counts, public events and RSVPs, prayer times, public community announcements and other mobile API connections.

### Design and product polish
- Semantic light/dark web styles, focus treatment, reduced-motion support, navigation semantics and responsive layouts.
- Phone/tablet-centered React Native content where edited, generally 44pt+ tap targets, accessible UI labels, honest loading/empty/error states.
- Removed unused shared mock API generators and simulated content from numerous public, school, accounting and admin flows.

## Remaining work and release blockers

1. **CRITICAL — exposed historical secrets:** Repository history previously contained credentials. Rotate production/staging database passwords, authentication secrets, administrator/teacher seed passwords, and any exposed real email/Stripe keys. HEAD file deletion does **not** invalidate secrets or erase Git history. Review production environment settings and access logs.
2. **Production data and migrations:** Audit migrations in `staff-web/prisma/migrations`, back up the real database, run through them against staging, check all existing data relationships, and then apply through an approved production migration procedure. CI `prisma db push` does not verify production migration compatibility.
3. **Real payment systems:** Run Stripe sandbox one-time/recurring checkout, signed events, refunds, retries, customer receipts, duplicate webhook delivery and failed payments using a real staging payment configuration. Do not enable real billing until verified.
4. **Provider integrations:** Configure authenticated Resend sender, test actual registration verification and password-reset delivery, verify push notifications and email notification preferences. Ensure production secrets are never committed.
5. **Remaining unfinished screens:** CRM volunteer shifts/teams, CRM task workflows, some approval screens, and portions of community member administration still contain placeholder data, missing persisted models or incomplete actions. Some school resources may require class-specific assignment/authorization. Audit all unfinished routes before release.
6. **Native device QA:** No physical iOS/iPadOS/Android release build or full VoiceOver/TalkBack, dynamic-type, keyboard, orientation, offline, push permission, and App Store package audit has been performed. Browser width tests are not native tests. Expo production icons/splash images require review.
7. **Scale and reliability:** In-memory request throttles are not distributed across serverless workers. Add durable rate limiting, telemetry, backups, retention/deletion policies and security review for children's information, uploads, payouts, and other privileged API actions.
8. **Historical donor linking:** Existing guest donations cannot safely be assigned to accounts from email strings alone. Preserve privacy until verified ownership/reconciliation is implemented.

**Do not merge or deploy this draft PR as 100% complete until these outstanding tasks and a fresh full CI run are resolved.**

## Latest continuation: teacher account assignment

Resumed from PR #2 head abe4bf3 (not PR #1). Run 40412704771 passed for that starting revision. Replaced editable display-name authorization in the teaching overview/attendance endpoints with explicit administrator-managed Class.teacherId relations. Classroom UI now supports account linking; existing classes are intentionally unassigned until an administrator links them. Apply migration `20261026230000_teacher_account_assignment` in reviewed staging before deploying these queries. No live migration or credential operations ran.

Legacy class/student roster writes are now admin-only and teacher roster reads use assigned account IDs. Flat assignment inputs exclude nested relation writes. **Further legacy school endpoint authorization review is still required**; this fix does not establish complete role isolation across the application. Continue from `accomplish.md` in this branch.

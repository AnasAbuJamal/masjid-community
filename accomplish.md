# Masjid Community — completion and deployment plan

## Purpose and working agreement

The goal is a consistent, fully functioning community app and staff portal, with real database persistence and a verified deployment. The user reported that jobs appear in admin but cannot be found in the app, and that designs are inconsistent. Treat these as release blockers.

This file is the durable handoff for future sessions. This session creates the plan only. Do not begin implementing the backlog until the user selects work. Do not describe the app as 100% ready until every agreed release gate below has evidence. A successful build alone does not establish readiness.

## Project context to preserve

- Repository: https://github.com/AnasAbuJamal/masjid-community
- Default branch: `development`.
- Work branch: `codex/completion-and-database-readiness`.
- Draft PR: https://github.com/AnasAbuJamal/masjid-community/pull/1
- Published implementation commit: `2efe4b611b2ace8a97bb5b476ac9cab65b75e8f9`.
- Local implementation commit: `f865b7645c6f19ab9e41e0d3cbd262173745bc54`. GitHub publication used the connector, producing a different commit. Compare trees before synchronizing; do not overwrite remote work or force-push to reconcile the hashes.
- Frontend: `masjid-mobile/`, Expo/React Native with a web export.
- Staff portal and API: `staff-web/`, Next.js, Prisma, PostgreSQL.
- Related documents: `README.md`, `Deploy.md`, `docs/COMPLETION.md`.
- Schema and migrations: `staff-web/prisma/`.
- GitHub connection previously confirmed the owner account and push permission. Direct shell push lacked authentication; connector publication succeeded.
- Vercel projects: `masjid-community` uses `staff-web`; `masjid-community1` and `masjid-community-url3` both use `masjid-mobile`. Determine which mobile project is canonical before changing deployments.
- Last observed Vercel preview status was building, not confirmed ready. Recheck actual status; do not rely on that historical observation.
- User is working from a phone and needs links and straightforward access, without requiring a local computer.

## Evidence already available, and its limits

Earlier work improved design, navigation accessibility, mobile authentication, current-user/profile APIs, numeric IDs, database setup, event registration, rental/application/donation history endpoints, and donation Checkout. The detailed inventory is in `docs/COMPLETION.md`; review the actual code before extending it.

Earlier local checks passed: staff and mobile TypeScript, staff unit tests (46), mobile unit tests (83), Prisma validation, staff build, and Expo web export. The staff build needed a temporary environment workaround. These historical results do not prove current builds or deployed workflows work.

No live database was provisioned or modified by that work. Browser screenshot verification and native-device testing were not completed. Multiple screens still contain sample data, simulated success, or calls to missing endpoints. No working deployed staff credentials were confirmed. The seed requires an explicitly configured password; do not invent a default login.

## Session procedure — prevent lost context and unfinished batches

1. Read this file, repository instructions, current git status, remote head, and the relevant existing code.
2. Select one numbered batch below with the user. Keep the batch small enough to implement, verify, and checkpoint in one session.
3. Record the active batch and acceptance criteria here before making changes.
4. Complete its database, API, permissions, UI, and error handling together where applicable.
5. Run relevant tests and checks; record commands, outcomes, and remaining limitations. Never mark unchecked behavior as passed.
6. Update this document and `docs/COMPLETION.md`, save a coherent commit, and publish within the user's authorized scope. Do not leave secrets in code, logs, or documentation.
7. End with a short handoff: what works, what remains, exact commit/PR, and the next suggested batch.
8. If context is becoming limited, stop starting new features. Save current work and a precise checkpoint, including incomplete edits and failed commands. Never rely on chat memory alone.

Use `[ ]` for pending and `[x]` only for completed work with evidence. Label blocked tasks explicitly with the missing prerequisite. Do not quietly remove a feature to make the checklist pass; scope changes need user agreement.

## 01 — Full feature and navigation inventory

- [ ] Inventory every app route, staff route, API endpoint, service method, database model, and visible button/link.
- [ ] Create a feature matrix: member entry point, staff entry point, allowed roles, API, tables, current implementation, missing work, and verification evidence.
- [ ] Classify features as implemented, partial, sample-only, unreachable, or missing. Inspect beyond the known list below.
- [ ] Audit jobs first: `masjid-mobile/app/jobs/` exists. Trace entry points, role restrictions, published status, list/detail responses, and application submission before deciding what to add.
- [ ] Check all home shortcuts, Community menus, tabs, profile menus, admin sidebar items, deep links, back buttons, and notification destinations.
- [ ] Make member-facing admin-managed content discoverable in the app. Internal finance, audit, and staff controls must remain restricted to appropriate roles.
- [ ] Record intended behavior for draft, published, archived, expired, and deleted records; implement the same rules across clients.

Acceptance: every intended feature has a documented path to use it; no dead navigation or unexplained admin/app discrepancy remains.

## 02 — Database, API contracts, and environments

- [ ] Choose separate development/test and production databases; configure server secrets through the hosting provider.
- [ ] Inspect whether a database already exists. Back it up and compare schema before applying or baselining migrations.
- [ ] Replace missing models/relationships with reviewed migrations; enforce required fields, foreign keys, unique constraints, indexes, and sensible deletion policies.
- [ ] Define consistent request/response contracts, ID types, dates/timezones, currency units, pagination, filtering, sorting, and error responses.
- [ ] Reconcile every mobile service URL and response shape with implemented backend routes.
- [ ] Remove simulated successful writes, production mock fallbacks, hardcoded counts, and local-only business records. Clearly distinguish legitimate device preferences from shared data.
- [ ] Ensure mutation success appears only after persisted server confirmation; refresh affected screens and caches.
- [ ] Add transactions and concurrency protection for capacity, bookings, votes, applications, and payment records.
- [ ] Keep production demo mode disabled; isolate seed data from real community records.
- [ ] Verify `/api/health`, database pooling/SSL, preview versus production API URLs, CORS, and HTTPS.

Acceptance: data survives refresh/restart and appears consistently in app and admin; unauthorized access and malformed data are rejected.

## 03 — Accounts, staff access, and permissions

- [ ] Provision a real first administrator through a controlled process and establish usable staff access for the owner.
- [ ] Distinguish Vercel deployment access prompts from application sign-in; document the actual access path.
- [ ] Verify registration, login, logout, session restoration/expiry, profile editing, password change, and password reset delivery.
- [ ] Align mobile reset screens with backend reset contracts; finish social authentication only if retained in the agreed product scope.
- [ ] Define and enforce the role matrix for admin, staff, teacher, parent, member, and student as applicable.
- [ ] Test API authorization directly, including guardian ownership, teacher assignments, private records, and role changes during a session.
- [ ] Review account lockout, rate limits, two-factor flows if exposed, account disabling/deletion, and audit trails.
- [ ] Remove password logging from the seed (`staff-web/prisma/seed.ts` currently prints the supplied admin password).
- [ ] Rotate previously exposed database/authentication credentials; deletion from the current tree did not revoke historical secrets.

Acceptance: owner can sign in from a phone; each role sees and changes only authorized records; recovery is usable.

## 04 — Shared design and screen-by-screen review

- [ ] Inventory visual issues on every app and portal screen with screenshots and specific fixes.
- [ ] Establish shared brand colors, typography, spacing, radii, icons, buttons, inputs, cards, lists, badges, dialogs, and navigation patterns.
- [ ] Replace inconsistent hardcoded styles and align light/dark themes, selected tabs, headings, labels, and action placement.
- [ ] Check small/large phones, tablet, desktop portal, safe areas, keyboard overlap, scrolling, long text, and touch targets.
- [ ] Provide loading, empty, offline, permission-denied, validation, not-found, and retry states for every data screen.
- [ ] Make forms explain required fields and validation errors, prevent duplicate submits, and preserve input after recoverable failure.
- [ ] Verify keyboard navigation, visible focus, labels, contrast, screen-reader announcements, large text, and reduced motion.
- [ ] Review any supported Arabic/RTL and localization behavior; establish the intended language scope with the owner if unclear.
- [ ] Remove placeholder content, inconsistent terminology, broken images, clipped text, and buttons that do nothing.

Acceptance: a recorded visual review covers every route and relevant state; shared patterns are consistent across features.

## 05 — Jobs, workers, and applications (first feature batch)

- [ ] Connect staff create/edit/publish/archive jobs to member discovery, detail, and application screens.
- [ ] Verify jobs are reachable from appropriate app navigation, including web and native layouts.
- [ ] Persist saved jobs and applications; enforce deadlines, duplicate prevention, required fields, and attachment rules.
- [ ] Show application status/history to the applicant; allow authorized staff review and status changes with audit records.
- [ ] Complete worker listing/detail and any advertised worker management/contact flows.

Acceptance: staff publishes a job, member finds and applies, staff reviews it, and member sees the updated status after signing in again.

## 06 — Community content, prayers, events, and construction

- [ ] Connect announcements/blog/categories and media to staff publishing and member lists/details.
- [ ] Verify prayer calendar, masjid timezone, midnight changes, future dates, iqamah settings, and notification schedules.
- [ ] Verify Qibla/location/compass on physical devices, including denied permissions and unavailable sensors.
- [ ] Finish event creation, publication, details, RSVP, cancellation, capacity, attendance, and member registration history.
- [ ] Complete construction/project updates, progress figures, and any advertised donation associations.
- [ ] Complete kiosk content and schedules with appropriate display access.

Acceptance: admin changes propagate to all applicable surfaces; calendar and event behavior remain correct across timezones and concurrent requests.

## 07 — Rentals, volunteers, proposals, and public submissions

- [ ] Complete facility availability, booking, cancellation, approval/status, member history, and conflict prevention.
- [ ] Complete volunteer opportunities, applications, staff decisions, shifts, teams, attendance, and recorded hours.
- [ ] Persist proposals, comments, votes, moderation, and accurate counts; enforce vote uniqueness and permissions.
- [ ] Complete contact/newsletter submissions and staff processing where exposed, including unsubscribe/preferences where applicable.
- [ ] Add server validation, abuse limits, duplicate prevention, and clear privacy boundaries for public forms.

Acceptance: each submission can be followed from member creation through staff processing to member-visible outcome, without fake success.

## 08 — School, parents, teachers, and students

- [ ] Complete enrollment, review/approval, classes, schedules, assignments, student/guardian links, and teacher assignments.
- [ ] Persist attendance/check-in, grades, reports, report cards, resources, progress, points, and leaderboard rules.
- [ ] Complete teacher and parent dashboards using real records and correctly scoped access.
- [ ] Complete tuition/payment history and receipts using verified payment events if tuition remains in scope.
- [ ] Verify staff/student/parent/teacher views match for the same records while protecting other families' data.

Acceptance: enrollment creates valid relationships; assigned teachers can record outcomes and the correct parent can see them after refresh.

## 09 — Donations, finance, and CRM

- [ ] Complete one-time and recurring Checkout, failed/cancelled flows, receipts, donor history, and subscription management.
- [ ] Verify signed webhooks, retries, idempotency, recurring invoices, refunds, currency/amount correctness, and database reconciliation.
- [ ] Never confirm a payment solely from a redirect or client callback.
- [ ] Complete donors, campaigns, pledges, expense categories, expenses, facilities, tasks, assignments, and CRM reports advertised in either client.
- [ ] Replace sample charts and totals with scoped database queries and agreed accounting definitions.
- [ ] Implement referenced-but-missing CRM endpoints and models; verify reports against underlying records.

Acceptance: Stripe test transactions and webhook retries produce accurate, nonduplicated records, history, receipts, and totals.

## 10 — Notifications, storage, settings, and administration

- [ ] Complete notification list/read state, device-token ownership, preferences, delivery, and deep linking.
- [ ] Verify push registration/delivery on Android/iOS and handle denied permissions and expired tokens.
- [ ] Move server uploads from ephemeral local storage to durable object storage, with type/size checks and authorized access.
- [ ] Connect mobile admin users/jobs/volunteers/announcements/settings/audit screens to real APIs.
- [ ] Persist community settings; apply them consistently to portal, app, kiosk, and email content.
- [ ] Complete search, audit/error views, exports, and all remaining inventory features not named in this plan.

Acceptance: settings and admin actions persist, files survive redeployments, and notification links open authorized records.

## 11 — Automated and manual verification

- [ ] Add focused tests for business rules, authorization/ownership, invalid input, and concurrency.
- [ ] Exercise actual PostgreSQL migrations and integration flows in an isolated test database.
- [ ] Run type checks, relevant lint/unit/integration checks, staff build, and Expo web export on the current revision.
- [ ] Run end-to-end scenarios for every feature batch using separate role accounts; record screenshots and outcomes.
- [ ] Test deployed API connectivity, offline/slow network/retry behavior, stale sessions, deep links, and browser refresh.
- [ ] Test physical Android and iPhone behavior, push, Qibla, keyboards, and payment returns.
- [ ] Review query efficiency, pagination, startup/load performance, upload limits, and error handling under expected usage.
- [ ] Fix all release-blocking failures; do not treat skipped tests as passes.

## 12 — Deployment, operations, and release gates

- [ ] Resolve Vercel project duplication and select canonical app/API URLs; document preview and production environments.
- [ ] Audit root `vercel.json`: it currently includes `prisma db push` and seeding in the build command. Replace unsafe automatic schema/seed behavior with reviewed migration/provisioning steps; confirm which config each Vercel project actually uses.
- [ ] Configure database, auth, email, Stripe, storage, app origins, and masjid timezone without committing secrets.
- [ ] Verify migrations, backups, a tested restore procedure, rollback plan, monitoring, and operational alerts.
- [ ] Configure native Expo/EAS identifiers, signing, permissions, production builds, and distribution as required by the agreed release scope.
- [ ] Confirm appropriate privacy information, consent/preferences, data retention, account deletion, and support contacts for the features shipped.
- [ ] Confirm intended preview/production access controls, valid HTTPS, and usable owner/admin login.
- [ ] Verify actual successful deployment status and open the deployed links on a phone.
- [ ] Run the complete critical-path smoke suite against the deployed revision using safe test records.
- [ ] Record owner acceptance of the final screens and workflows, release commit, URLs, migration version, and known nonblocking limitations.

Release acceptance: all agreed features work with persisted records, role boundaries hold, design review is complete, payment/email/push/storage integrations have evidence, deployment and recovery are verified, and no unresolved blocker remains. Do not promise zero bugs or equate a checklist with a guarantee.

## Mandatory UI, UX, and software construction rules

These are project requirements for every future batch, including screens already implemented. They are not a claim that the current app meets them. “Construction” here means software architecture, implementation quality, and maintainability. Verify applicable platform guidance and accessibility standards against official documentation during implementation; record the versions and scope used before claiming compliance.

### A. Design system and visual consistency

- [ ] Document a single design system: brand palette, semantic colors, type scale, spacing scale, layout widths, corner radii, elevation, icon family, motion, and component states.
- [ ] Store these decisions in reusable tokens and shared components within each client. Keep app and portal semantics consistent while respecting native and web interaction patterns.
- [ ] Use semantic colors for text, surfaces, borders, actions, success, warnings, and errors. Avoid scattered hardcoded colors and arbitrary spacing.
- [ ] Define button hierarchy, input styles, cards, tables/lists, badges, dialogs, bottom sheets, navigation, and toast/inline feedback once; reuse them across features.
- [ ] Give each screen a clear title, content hierarchy, and primary action. Keep secondary actions visually subordinate and destructive actions clearly identified.
- [ ] Use a small consistent spacing scale, stable alignments, readable line lengths, and deliberate whitespace. Avoid competing card styles, excessive shadows, and decorative clutter.
- [ ] Verify every component in light/dark mode, disabled, pressed, focused, selected, loading, and error states where applicable.
- [ ] Preserve readable contrast for text and controls. Adopt project baselines of at least 4.5:1 for normal text and 3:1 for large text and meaningful UI boundaries; validate against the applicable accessibility standard rather than judging by appearance alone.
- [ ] Use touch areas of at least 44 × 44 logical units as a project baseline, with spacing between neighboring controls; check platform-specific guidance during native review.
- [ ] Use consistent image proportions, fallbacks, cropping, and icon sizes. Never rely on color or an unlabeled icon alone to communicate an action or status.

### B. Information architecture and interaction design

- [ ] Create a navigation map for every role. Group related tasks using language community members understand; make jobs and other member services discoverable without guessing hidden routes.
- [ ] Keep destinations and action names consistent across app and admin. Show internal-only management features only to authorized roles.
- [ ] Preserve predictable back behavior, selected tabs, scroll position, filters, and form progress where appropriate. Support deep links and meaningful not-found states.
- [ ] Keep common tasks short: identify the goal, remove unnecessary fields/steps, prefill known information safely, and show the next action clearly.
- [ ] Use persistent field labels, appropriate keyboards/autocomplete, helpful examples, and inline validation. Explain how to fix errors; preserve entered data on retry.
- [ ] Confirm destructive or consequential actions with the affected record and consequence. Provide undo where practical and avoid repetitive confirmation for routine actions.
- [ ] Show timely feedback for actions, prevent accidental duplicate submission, and distinguish pending from confirmed completion. Do not show success before the authoritative write succeeds.
- [ ] Define loading, empty, partial, offline, stale, denied, expired-session, and error states. Empty states explain what happened and offer a relevant next step.
- [ ] Request permissions at the moment their purpose is clear. Provide a useful fallback if location, camera, or notification permission is denied.
- [ ] Use plain, consistent copy; readable dates and amounts; explicit timezone/currency where ambiguity matters. Explain fees and payment outcomes before users commit.
- [ ] Do not expose developer terminology, stack traces, database details, or misleading sample results in normal user flows.
- [ ] Review member and staff journeys with realistic tasks: finding a job, applying, reviewing an application, booking a room, enrolling a child, and making a donation.

### C. Accessibility and responsive behavior

- [ ] Use semantic web elements and native accessibility properties, meaningful names, logical reading order, and appropriate status announcements.
- [ ] Support keyboard-only web use, visible focus, modal focus management, Escape/back dismissal where appropriate, and restoration of focus after dialogs close.
- [ ] Support text enlargement without clipped content or lost actions; respect reduced motion and avoid essential information conveyed only through animation.
- [ ] Check screen readers on representative web, iOS, and Android workflows. Automated scans supplement manual checks; they do not establish full accessibility.
- [ ] Adapt layouts to small phones, large phones, tablets, and desktop using content-driven breakpoints. Avoid horizontal page overflow; provide intentional handling for dense tables.
- [ ] Respect device safe areas, on-screen keyboards, orientation, browser zoom, and long translated text. Validate RTL if included in the supported language scope.
- [ ] Record the accessibility target, evaluated screens, tools, manual findings, and unresolved issues before release.

### D. Architecture and code organization

- [ ] Use a maintainable modular structure with clear ownership for features. Keep presentation, business rules, API access, and database access separated; avoid a large rewrite unless evidence requires it.
- [ ] Keep the server authoritative for shared business data, permissions, prices, capacity, and status transitions. Clients must never access database credentials or determine authorization themselves.
- [ ] Keep React components focused on rendering and interaction. Put reusable data access and domain behavior into named modules rather than duplicating logic across screens.
- [ ] Use the shared API client and documented contracts. Centralize authentication, consistent error mapping, request cancellation, and safe timeout/retry behavior.
- [ ] Validate untrusted input at server boundaries and maintain strong types through services and UI. Avoid unchecked casts and broad `any` types hiding incompatible contracts.
- [ ] Define state ownership: server records, temporary form state, and device preferences. Use explicit invalidation/refresh rules after mutations; avoid competing copies of the same business record.
- [ ] Model important workflows as explicit allowed status transitions, validated on the server. Keep money in integer minor units and apply an explicit timestamp/timezone policy.
- [ ] Keep reusable abstractions small and justified by actual use. Favor clear functions and predictable dependency boundaries over speculative frameworks or unnecessary services.
- [ ] Document non-obvious architectural decisions, including alternatives and constraints, in brief decision records. Keep setup instructions and API contracts synchronized with implementation.

### E. Data integrity, security, and reliability

- [ ] Design migrations to preserve existing records, with reviewed rollback or forward-recovery procedures. Do not reset production data or seed it automatically during normal builds.
- [ ] Use database constraints and transactions to enforce invariants, and concurrency-safe operations for bookings, capacity, applications, and votes.
- [ ] Require authorization and record ownership checks on every relevant API operation. Protect privileged fields from client updates and test cross-account access attempts.
- [ ] Review session/cookie security, CSRF where applicable, restrictive CORS, rate limits, upload validation, and safe rendering of user content.
- [ ] Store secrets only in approved server configuration, never mobile bundles, public environment variables, commits, screenshots, or logs. Redact personal and sensitive data from diagnostics.
- [ ] Verify webhook signatures and idempotency; retry only when safe. Define recovery for partial failures between payments, database writes, email, and notifications.
- [ ] Use durable storage and explicit access policies for files; clean up failed/orphaned uploads and account for retention and deletion requirements.
- [ ] Add structured operational errors and correlation identifiers where useful. Provide health checks, actionable alerts, backups, and a tested recovery process.
- [ ] Keep dependencies and lockfiles intentional; review relevant security advisories and upgrade compatibility before release.

### F. Performance, testing, and delivery discipline

- [ ] Establish measurable performance budgets for representative devices and network conditions before optimization; record actual load time, interaction responsiveness, API latency, and large-list behavior.
- [ ] Paginate server lists, index real query patterns, avoid repeated per-row queries, and limit returned fields to what each client needs.
- [ ] Optimize images, use appropriate list virtualization, and prevent unnecessary refetches/renders. Cache only with explicit freshness and invalidation rules.
- [ ] Keep changes reviewable and focused. Avoid unrelated formatting or dependency churn in feature batches.
- [ ] Test meaningful business rules and failure cases, actual database/API interactions, authorization boundaries, and critical user journeys. Do not substitute mocks for all integration evidence.
- [ ] Require a reproducible install/build, migration verification, relevant automated checks, and manual visual evidence for touched screens before marking a batch complete.
- [ ] Exercise both supported clients after shared API/schema changes. Preserve compatibility during deployments or coordinate a documented migration path.
- [ ] Record deployment status and verify the actual release URL. Provide a usable admin account and documented recovery path before declaring the owner can use the portal.

### G. Definition of done for every feature

A feature is complete only when all applicable items below pass. Any non-applicable item needs a recorded reason.

- [ ] Reachable through appropriate navigation and usable by the intended roles.
- [ ] Follows approved design tokens/components and passes responsive, accessibility, and interaction review.
- [ ] Reads and writes real persisted data, with consistent results in app and portal after refresh and a new session.
- [ ] Implements documented business rules, validation, ownership, and authorization on the server.
- [ ] Handles loading, empty, offline/error, retry, and duplicate/concurrent actions without misleading outcomes.
- [ ] Has relevant passing automated checks and recorded manual end-to-end evidence, including failure paths.
- [ ] Includes required migration/configuration/documentation updates and contains no production mock behavior or exposed secrets.
- [ ] Has a saved checkpoint identifying the commit, verification evidence, known limitations, and next work.

Before the final release, repeat a product-wide consistency review: individual features passing is not enough if navigation, terminology, shared records, or cross-feature workflows disagree.

## Recommended order for future requests

1. “Start batch 01: audit feature parity and jobs navigation.”
2. “Start batches 02–03: database foundation and working staff access.” Split into smaller sessions as needed.
3. “Start batch 04: shared design system,” then review designs alongside each feature batch.
4. “Finish jobs end to end,” followed by batches 06–10 one workflow at a time.
5. “Run final verification and deployment,” only after the feature checklist is complete.

## Checkpoint for the next session

- Active task: implementation started — jobs discovery/application safety and deployment foundation.
- Completed code changes: Community service links; jobs detail navigation/loading/retry states; truthful application feedback; authenticated applicant identity; expiry/duplicate checks; seed password logging removal; build/seed separation; administrator provisioning command.
- Inventory: see `docs/FEATURE-AUDIT.md`. Route enumeration is complete; the full service/model/role matrix and visual review are still pending.
- Unknowns: current deployment status, live database configuration, actual admin account, canonical mobile deployment, and exact remaining screen defects.
- Checks for this batch: staff/mobile TypeScript completed without diagnostics; 8 focused job validation/API tests passed. Live PostgreSQL, concurrent requests, screenshots, native devices, and deployed flows remain unverified.
- Next work: finish jobs staff CRUD/status validation and saved jobs persistence; then real database/admin setup and remaining feature batches.
- Blocking external setup: live database and hosting environment access/configuration are not confirmed. No production account was created and no live database was modified.
- Update this section after every work session with changed files, commit/PR, checks, blockers, and next action.

## Checkpoint — proposals and notification persistence

Implemented in the next batch (not a claim of release readiness):
- Notification API envelopes now map to app records; no invented notification feed on errors.
- Read/read-all actions persist before the app updates its state; staff bell checks HTTP failures.
- Notification pagination is bounded, ownership is enforced, and malformed deletion IDs cannot delete the entire feed.
- Member notification destinations use a known-route allowlist and the actual linked record, not the notification ID.
- Proposal lists/details/comments load from APIs; simulated detail content, timer comments, fake vote increments, and fake submission success are removed.
- Voting uses a database unique constraint for one vote per account/proposal with idempotent upsert. The old simulated voting route opens the real proposals workflow.
- Proposal submissions validate fields and derive identity from the session. Comments use server-derived authorship; public queries exclude internal comments and sensitive submission fields.
- Legacy staff comment-list/create endpoints require staff/admin access.
- The staff notification panel has narrower-screen sizing, accessible toggle/close labels, and visible error feedback.

Verification: both TypeScript checks passed; 12 focused backend tests and 2 mobile destination tests passed. Prisma client generation passed. Schema-only migration diff matches the committed voting migration (no database connection used). `git diff --check` passed.

Deployment prerequisite: apply `20261026000000_proposal_votes` via the reviewed migration process BEFORE deploying these proposal queries. No live migration or account provisioning has run. Do not call the preview functional until database configuration, migrations, and deployed smoke checks pass.

Remaining in these areas: physical-device push registration/delivery and token ownership; comprehensive visual/accessibility testing; proposal milestone JSON contracts; rate limits, large-list pagination, moderation/status transitions and database-backed concurrent vote tests. Existing pending-proposal visibility is retained and needs a product/moderation review. School, CRM and other release backlog items remain unfinished.

Next session: read this checkpoint and current git/remote state first. Finish push-token ownership and school/CRM API/model inventory, then complete one end-to-end workflow at a time. Do not ask the user to reauthorize continuing the agreed backlog.

## Checkpoint — family records and push registration ownership

Implemented:
- Replaced the parent landing page's invented children, grades, tuition balances, and broken quick links with real family attendance and teacher reports. Added working parent attendance and child-detail routes using one responsive, theme-aware component with loading/error/empty states.
- Added `/api/parents/me/children`: scope comes from the session email, requires a verified account, includes only active linked students, returns bounded recent attendance/reports, and disables caching. Verification must be established through a trusted school/admin process; there is no self-verification shortcut.
- Added authenticated, validated Expo token registration, account association, expiring records, and ownership-scoped removal. Native initialization waits for authentication and skips web. Logout attempts device removal before clearing credentials.
- Added migration `20261027000000_push_token_ownership`; existing token rows retain null owners/expiry. Never use them for personalized delivery. No migration has run on a live database.
- Blocked members/students from school-wide attendance GET/POST endpoints; parent reads use the dedicated family endpoint.

Verification: staff/mobile TypeScript checks passed; 10 focused backend tests and 22 existing mobile authentication tests passed. Prisma generated successfully and its schema-only diff matches the ownership migration. No physical device or live database checks performed.

Remaining and next priority:
- Class currently stores only teacherName, not a trusted teacher-account relationship. Add assigned-teacher relations and scope all teacher/student/attendance endpoints before production. Some legacy endpoints still allow broad teacher reads. Attendance bulk writes also need transaction/validation/concurrency review.
- Parent tuition payments, formal report cards, grades, resources and teacher messaging are NOT complete. They were previously fake or broken on the landing page; removing fabricated summaries is not completion of those features. Existing standalone screens remain in the backlog.
- Both attendance/check-in standalone screens still simulate self-check-in. Define verifiable class sessions/check-in rules and persist records; do not treat this batch as completing attendance.
- Push sending/receipt handling and native tests are unfinished. Future personalized delivery MUST filter by verified current owner and nonexpired registration. Handle offline logout, expired auth and registration/logout races before enabling sensitive push payloads. Unregistration is best effort during an offline logout; do not imply instant server revocation.
- Confirm EAS project configuration, permission flow, token refresh, invalid-token cleanup and actual device delivery.
- Apply both proposal-vote and push-ownership migrations in a reviewed environment before deploying this revision. Provision a real owner account, then verify complete deployed flows.

Continue the authorized backlog without asking the user to reauthorize. Read the newest checkpoint and git state at the start of the next session.

## Checkpoint — teacher, student and parent boundaries

Added explicit teacher-to-class and student-to-account database relationships, shared school scope filters, verified-parent reads, scoped assignment/report/attendance and roster APIs, and an administrator-only School Access page. Removed teacher roster-management controls and added appropriate school navigation labels for mobile roles. Fixed mobile school student/homework service paths to implemented scoped APIs. Student number lookup is now explicit (`lookup=schoolId`) rather than ambiguously matching either internal or school ID.

Permission matrix and setup are in `docs/SCHOOL-ROLES.md`. Parent access remains a verified family capability; no self-selected parent role grants extra authority. Reports now require sign-in. School managers are admin/staff; only admins manage account links. Teachers need an explicit assigned class, students need an account link, and verified member parents are filtered to their family email.

Apply `20261028000000_school_account_links` before the new APIs are deployed, then use School Access to link real accounts. No name-based automatic backfill is performed. No live database changes have run. Schema-only Prisma diff matches the migration. Both TypeScript checks passed; 24 school scope/report/session/attendance/account-association tests passed.

Remaining: full physical-device/visual and live role-isolation tests; association changes concurrent with writes; atomic/validated bulk attendance; real check-in; tuition, formal grades/report cards and dedicated teacher/student dashboards; remaining CRM and release checklist. Re-audit other dashboards/search/exports before claiming complete role coverage.

## Checkpoint — reliable staff attendance saves

Replaced destructive delete/recreate bulk marking with upserts inside a serializable transaction. Class authorization, active roster validation, writes and recalculated attendance rates now run together. Individual corrections also refresh rates. A transferred student's existing attendance in another class cannot be overwritten through the new class. Serialization failures retry up to three attempts, then return a visible conflict.

Attendance requires explicit valid statuses, positive integer IDs, unique student rows, bounded notes/batches and real YYYY-MM-DD calendar dates. Dates use UTC midnight as a calendar-day storage convention, independent of the server timezone. Read filters/ranges/pagination are validated and bounded. No schema migration is added in this batch.

Staff UI requires an explicit choice per unmarked student, supports intentional Mark All actions, filters inactive students, requests up to 500 daily records, and shows load errors with retry instead of silently displaying an empty feed. Icon actions/selects have clearer accessible labels. Report creation now checks HTTP success before clearing the form. Device-local date defaults avoid UTC shifting today's selection.

Verification: staff TypeScript passed; 41 focused attendance/school-role/report/account-link tests passed, including 21 new attendance tests. These are unit/mocked API checks, NOT live PostgreSQL rollback/concurrency or browser/device verification. No live migration or deployment smoke checks ran.

Remaining attendance work: PostgreSQL integration tests and visual/mobile checks; history pagination/full summaries; explicit school timezone setting; review/backfill any historical non-UTC-midnight records before adopting the calendar-day convention in an existing production dataset; attendance policy for late/excused (existing rate formula counts only present); multi-session/day model if required (current schema permits one record per student/day); genuine mobile check-in; comprehensive stale-form/concurrent-editor UX. Previous migration and role-link setup prerequisites still apply. Full application release checklist remains open.

## Checkpoint — real student attendance history

Removed fabricated attendance, class sessions, percentages and timer-based check-in success from both mobile attendance routes. The legacy check-in URL now routes to the real attendance history with an explicit teacher/staff marking explanation. Added student and family attendance entry points to the School tab.

Added `/api/students/me/attendance`: student-role only, active enrollment linked by authenticated user ID, no arbitrary student selector, 30-row pagination and all-record counts for present/absent/late/excused. Only limited display fields leave the API; no notes/contact/staff IDs. Snapshot-consistent queries and no-store responses. No records does not mean absent. The mobile screen uses theme colors, wrapping layouts, accessible controls, loading/error/retry/unlinked states, page navigation and request guards. Old account/page results are not displayed for a new account/page.

Both staff and mobile TypeScript checks passed; 21 attendance/family access tests passed (15 new student-history tests). No live database, deployed account flow, native device, or visual accessibility testing ran. No new schema migration is needed, but the prior account-link migration and admin linking remain prerequisites.

Remaining: actual self-check-in with verifiable sessions; teacher dashboard/mobile marking; school-timezone and historical date normalization; larger role/feature audit and all remaining release checklist work. Build inspection also found missing native notification icon and a placeholder EAS projectId; these still require proper native setup. Web favicon now references the existing app icon instead of a missing file.

Web build verification: Expo static web export completed successfully for all 79 routes. Rechecked after fixing the favicon reference. This confirms bundling/static export, not authenticated browser flows or native readiness.

## Checkpoint — teacher mobile roster and attendance

Replaced the fabricated teacher dashboard (invented classes, grade counts and broken action links) with paginated database classes scoped by the existing teacher/account rules. Added a School-tab teaching entry point and a real `/school/teacher/attendance` route for teacher/admin/staff accounts. Teachers see assigned classes only; staff/admin retain their existing school-wide access.

The form loads a selected calendar day's roster and recorded statuses, excludes inactive students, keeps unmarked students unmarked, submits only explicitly selected students, and uses the existing atomic attendance API. Includes explicit Mark all present, unsaved labels, discard, loading/errors, accessible labeled controls and wrapping theme-aware layout. Date changes/in-page back navigation are blocked while edits remain; duplicate save taps are guarded. Ambiguous network saves trigger a server reload before another attempt. Rosters beyond 500 active students are blocked from mobile bulk editing rather than silently truncated. No fabricated grades/assignment counts remain on the teacher landing page; those teacher workflows are still unfinished.

Class-list pagination is now bounded and validated, and roster responses specify no-store. Both TypeScript checks passed; 33 focused class/attendance tests passed, including 9 new class access/pagination tests. No live database/device/visual tests have run. Prior migration and account assignment setup remain required; this batch adds no migration.

Next work: complete teacher assignment/report CRUD validation and UI, formal grade model/workflow, improve general navigation-away handling for unsaved drafts and concurrent-editor conflicts, minimize roster payloads, and continue the full release audit. Browser/system-back and app suspension need device-level testing; there is no offline draft persistence. Current full app remains not release-ready.

Expo web export passed for 80 routes, including the new teacher attendance route. This is a build check, not a live browser/device validation. Pending date text must be loaded before marking, so edits cannot accidentally target the previously loaded date.

# Masjid Community · Azure Sanctuary

This is a **new implementation from zero** guided by [document.md](document.md). The current repository has one branch, \`development\`.

## What's here

- \`staff-web/\`: Next.js 16 with a glass-styled administrative interface, PostgreSQL/Prisma models and versioned JSON API.
- \`masjid-mobile/\`: Expo 54 / React Native mobile app with Home, Salah, Discover, School and Profile, plus detail actions, registration/login, giving, prayer calendar and Qibla bearing.
- \`tests/\`: early repository verification. The CI workflow checks Prisma, TypeScript and app build.

**Important: this is an in-progress platform, not a completed production system.** Staging/production setup and database-change gates are documented in [docs/deployment-runbook.md](docs/deployment-runbook.md). Every real schedule and receipt comes from the database/provider; never fabricate data to fill blank screens. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) before deploying.

## Development

Node.js 22+, PostgreSQL 16+.

1. For disposable local database: \`docker compose up -d db\`.
2. \`cd staff-web && npm install && cp .env.example .env.local\`. Replace AUTH_SECRET with a strong random secret. Set local-only DATABASE_URL.
3. \`npx prisma validate && npx prisma migrate deploy\` **only against a new, isolated local development database**.
4. Provision a **local** organization/admin with \`ADMIN_EMAIL=you@local.test ADMIN_PASSWORD=<unique-password-of-16-or-more> node --env-file=.env.local scripts/bootstrap.mjs\`. This script refuses production/Vercel execution.
5. \`npm run dev\` in staff-web, then open http://localhost:3000 and sign in.
6. \`cd ../masjid-mobile && npm install && cp .env.example .env && npm start\`. Set EXPO_PUBLIC_API_URL to your API server origin. On a device use your computer's LAN IP, not localhost.

## Check

\`\`\`sh
npm test
cd staff-web
npx prisma validate
npx prisma generate
npm run check
npm run build
cd ../masjid-mobile
npm run check
npx expo install --check
\`\`\`

No real database migration or external deployment is attempted by the GitHub Actions workflow.

## Reviewed prayer publication

Steward users with the `worship_publish` capability can visit `/admin/prayer-revisions` to create venue-specific private schedule drafts, submit for review by a different authorized person, approve and atomically publish numbered revisions. An additive `PrayerScheduleRevision` migration preserves candidate history and audit snapshots; public readers continue to see only the previous published `PrayerDay` until a reviewed revision is published. See `document.md` §20.1 and §20.4.

## Gathering reservations and waitlists

Published events offer capacity-aware reservations to verified members. Organizers may explicitly enable a waitlist for an event; full events without one reject further registrations. Members see **confirmed** or **waitlisted — not confirmed** status. A confirmed attendee's cancellation before the event starts atomically promotes the oldest waitlisted member, records a generic private notification, and preserves the seat count. Waitlist departures do not release confirmed places. Duplicate join/cancel requests are idempotent. A signed-in member can read only their own RSVP state from `GET /api/v1/events/registration?eventId=...`, and the native detail screen provides an immediate cancellation action. Public published gatherings offer an `.ics` download at `GET /api/v1/events/{id}/calendar`, labeled as informational—not an RSVP confirmation. `staff-web/scripts/test-gather.mjs` runs against the disposable CI database.

## Guest website

Open `/visit` for the public SILA experience, with published prayer schedules, approved faith notices, announcements, upcoming gatherings and learning programs. A venue picker appears if more than one venue is configured. Guests do not sign in or share location; the page displays clear missing-data states and provides public detail links. The original `/` route remains the staff sign-in portal, and `/kiosk` remains a read-only display. Public web pages do not yet support the full requested Arabic/RTL, accessibility testing or offline flows.

## Public venue selection

Guests may request `GET /api/v1/public/venues` for the active mosque's published venue metadata, without using device location. `/api/v1/public/home?venueId=...` and `/api/v1/public/prayers?venueId=...` accept only venue IDs associated with the configured mosque and return 404 for invalid IDs. In the native app the selected venue ID is stored locally, checked against the current server list and shared by Today and Salah. Network responses from a previously selected venue are ignored after a switch. The app still assumes one operational mosque; this is **not** an audited multi-tenant identity context.

## API overview

\`GET /api/v1/public/home\`, \`/prayers\`, \`/events\`, \`/announcements\`, \`/programs\`, \`/campaigns\`, \`/volunteers\`, \`/jobs\`, \`/proposals\`, \`/rentals\`; \`POST /api/v1/auth/register|login|logout|verify\`; \`GET /api/v1/auth/me\`, \`/api/v1/me\`, \`/api/v1/students\`; \`POST /api/v1/actions\`, \`/api/v1/admin\`, \`/api/v1/donations/checkout\`, \`/api/v1/webhooks/stripe\`; \`GET /api/health\`.

All protected APIs validate a database-backed session; native bearer tokens are stored in SecureStore, web uses an HttpOnly session cookie. No role is accepted from signup payloads. Staff publishing is restricted to authorized roles. Finances require Stripe environment keys and verified callbacks.

## Production warnings

Before any real use: rotate previously exposed historical credentials; reconcile database migrations and backup/recovery; configure a real verified email sender, payment provider + webhook; add distributed login/rate limiting, MFA, session rotation, per-resource scope verification, fully audited finance and schooling, receipt reconciliation, native device/accessibility QA, and consent/retention/privacy sign-off. Deployed API and mobile signing are separate systems; Vercel does not build a native app.

## Privileged sign-in (admin/finance)
Admin and finance accounts must enroll and verify time-based one-time codes before accessing privileged APIs. Configure `MFA_ENCRYPTION_KEY` as **32 random bytes encoded in 64 hexadecimal characters**, stored in the deployment secret manager; never use the CI example in production. First privileged sign-in routes to `/mfa`; re-enter your password, store the displayed secret in a TOTP authenticator, then enter a fresh six-digit code. Subsequent sign-ins require a code. Losing the encryption key makes existing authenticator secrets unrecoverable; implement documented key custody, backup and rotation before release.

## Financial integrity
Only **signed** payment provider callbacks may mark a donation or tuition invoice paid. A paid charge creates a receipt and a balanced provider-clearing/revenue journal; a verified full refund reverses that journal while retaining a marked receipt. The CI suite signs synthetic Stripe webhook payloads using an isolated test secret; this is **not** the same as end-to-end validation against a real configured Stripe account. Do not treat the current financial screens as a certified/reconciled accounting system.

## Staff roles and organization memberships
The local bootstrap creates an admin membership, and new accounts are linked to the configured mosque. An MFA-verified administrator uses `/admin/team` to grant staff/teacher/finance primary roles or time-bound staff capabilities. Privilege updates revoke active sessions; delegated staff use `/staff`. **This version assumes a single operational mosque** and is not yet a safe multi-tenant platform; do not create multiple live organizations until all API paths are tenant-scoped and backed by migration tests. Preexisting data must be backfilled into `OrganizationMembership` before enforcing the new membership gate in a nonempty environment.

## Native language support
The mobile app provides an English/Arabic language selector in Account Settings. The primary tabs, key worship and community copy, common feedback states and shared components have localized labels and directional styling. Translation coverage across deeper screens is **in progress** and requires native-device Arabic/RTL review before release.

## Transactional notifications
The server persists a private in-app notification and an `OutboxEvent` in the same transaction for selected workflows. The bounded delivery worker is `GET /api/internal/notifications`, requiring `Authorization: Bearer <CRON_SECRET>` (minimum 32 characters). Configure `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` privately before scheduling it through your deployment's authenticated scheduler. The worker delivers generic subject/body text without child or financial details. **No scheduler, sending domain, or push service is connected in this repository.** The provider integration is not production-tested.

## Database migration baseline
A generated, versioned SQL baseline lives at `staff-web/prisma/migrations/20261027000000_initial/migration.sql` (56 tables). The CI pipeline installs an **empty** PostgreSQL instance using `npx prisma migrate deploy`, verifies migration status, then runs integration tests. **Never apply this empty-database baseline directly to an existing production database containing records**. Existing databases need a separately reviewed backfill, migration-history baseline, backup and restore rehearsal before any schema deployment.

## Android and iPhone private previews

See [docs/mobile-preview-runbook.md](docs/mobile-preview-runbook.md) for a gated, manual Expo EAS path. No installable phone builds are claimed until actual EAS artifacts and staging safety checks have been verified.

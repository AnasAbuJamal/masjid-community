# Masjid Community — security, release and functionality audit
Updated: 2026-10-26. This is a **partial code audit**, not a release certification.

## Repository inventory
The default development tree contains 316 tracked files, including about 283 TypeScript/TSX files, across:
- `staff-web`: Next.js dashboard/API, Prisma/PostgreSQL, NextAuth and Stripe.
- `masjid-mobile`: Expo/React Native app and API client.

The file tree was inventoried; **not every individual file/function was executed or manually reviewed**.

## Changes on the `fix/security-functionality-apple-ui-20261026` branch
- Removed checked-in environment files and hard-coded application secrets, removed permissive wildcard CORS configuration and stopped bypassing TypeScript build errors.
- Replaced unsigned Base64 mobile login tokens with short-lived HMAC-SHA256 verified tokens that invalidate when passwords change, added mobile account endpoints and improved authentication input checks.
- Restricted access to student data and notification mutations; corrected several Prisma id conversions and proposal required fields.
- Replaced a fake 'donation received' mobile message with an actual Stripe-hosted checkout handoff; fixed validation and recurring Stripe price configuration.
- Added persisted prayer/day/week/month and public detail endpoints for mobile; aligned mobile registration policy and cached-session verification.
- Established coherent web light/dark semantic color tokens, responsive controls, keyboard focus/contrast/reduced-motion support and 44-point mobile buttons.

## CRITICAL: Compromised secrets / manual action required
Credentials were committed to the public Git history. **Deleting files from the head commit does not revoke a credential or erase historical commits**.
Immediately rotate the Neon/Postgres database credentials, NextAuth `AUTH_SECRET`, passwords for seeded administrator/teacher accounts, and any other real keys formerly present in environment files or configuration. Replace credentials in Vercel and other deployed services using the deployment secrets UI, **never commit replacements**. Review database access logs and outstanding tokens/sessions. Consider repository history rewriting only with coordinated security assistance; rotation comes first.

## Database and payment rollout
- Set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, Stripe keys and webhook secret, email-provider settings, and any other runtime requirements in hosted environment configuration.
- Run `npx prisma validate`, `npx prisma generate`, and review schema migration / `prisma db push` against a **staging** database before production. Take a backup first. A live database connection and end-to-end CRUD were **not** tested.
- Configure Stripe's signed webhook, then test successful/failed one-time and recurring payment, invoice renewal, refunds, retries/idempotency and receipt/transaction history using Stripe's test mode. Do not use real payments until reconciled.
- Do not deploy the seed script to production without strong `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` and `TEACHER_SEED_PASSWORD`.

## Remaining functional risks / known incompleteness
The mobile API client references routes not yet implemented or not aligned with current server contracts, including job applications, donation history/payment intent/campaigns, proposals voting, school data, rental booking history, gamification and application tracking. These screens require design/endpoint integration and tests; some features still use fallback/mock data.
The mobile donation campaigns display hard-coded example fundraising totals; those figures **must not be presented as real financial data**.
The existing mobile icon/splash PNGs are only 67 bytes apiece and require production-quality app artwork and real-device review. Apple App Store submission has not been performed.
TypeScript, unit tests, release builds, accessibility/manual regression tests and live deployment **have not been executed in this workspace**. The newly added GitHub Actions workflow is intended to expose existing failures, not to certify them as passed.
Remaining need: authenticate all private server routes, verify role permissions and rate limiting (including distributed rate limiting in serverless deployments), audit malformed inputs and file uploads, check all page navigation/CTA behavior, validate notification delivery and offline behavior, and complete iOS/Android build submissions.

## Recommended release gates
1. Rotate compromised keys and confirm unauthorized access has been ruled out as far as logs permit.
2. Pass both CI jobs: Prisma, unit tests, TypeScript and builds.
3. Complete missing backend/mobile contracts and remove production mock fallbacks.
4. Pass integration tests on a staging database and Stripe test-mode payments/webhooks.
5. Test iOS and Android on devices (light/dark, Dynamic Type, VoiceOver/TalkBack, localization, offline/retry, keyboard).
6. Review the draft pull request, then deploy to staging and production only after testing.

No claim of a "100% functional application" can be made until these gates are completed.

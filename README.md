# Masjid Community · Azure Sanctuary

This is a **new implementation from zero** guided by [document.md](document.md). The current repository has one branch, \`development\`.

## What's here

- \`staff-web/\`: Next.js 16 with a glass-styled administrative interface, PostgreSQL/Prisma models and versioned JSON API.
- \`masjid-mobile/\`: Expo 54 / React Native mobile app with Home, Salah, Discover, School and Profile, plus detail actions, registration/login, giving, prayer calendar and Qibla bearing.
- \`tests/\`: early repository verification. The CI workflow checks Prisma, TypeScript and app build.

**Important: this is an in-progress platform, not a completed production system.** Every real schedule and receipt comes from the database/provider; never fabricate data to fill blank screens. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) before deploying.

## Development

Node.js 22+, PostgreSQL 16+.

1. For disposable local database: \`docker compose up -d db\`.
2. \`cd staff-web && npm install && cp .env.example .env.local\`. Replace AUTH_SECRET with a strong random secret. Set local-only DATABASE_URL.
3. \`npx prisma validate && npx prisma db push\` **only against your isolated local development database**.
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

## API overview

\`GET /api/v1/public/home\`, \`/prayers\`, \`/events\`, \`/announcements\`, \`/programs\`, \`/campaigns\`, \`/volunteers\`, \`/jobs\`, \`/proposals\`, \`/rentals\`; \`POST /api/v1/auth/register|login|logout|verify\`; \`GET /api/v1/auth/me\`, \`/api/v1/me\`, \`/api/v1/students\`; \`POST /api/v1/actions\`, \`/api/v1/admin\`, \`/api/v1/donations/checkout\`, \`/api/v1/webhooks/stripe\`; \`GET /api/health\`.

All protected APIs validate a database-backed session; native bearer tokens are stored in SecureStore, web uses an HttpOnly session cookie. No role is accepted from signup payloads. Staff publishing is restricted to authorized roles. Finances require Stripe environment keys and verified callbacks.

## Production warnings

Before any real use: rotate previously exposed historical credentials; reconcile database migrations and backup/recovery; configure a real verified email sender, payment provider + webhook; add distributed login/rate limiting, MFA, session rotation, per-resource scope verification, fully audited finance and schooling, receipt reconciliation, native device/accessibility QA, and consent/retention/privacy sign-off. Deployed API and mobile signing are separate systems; Vercel does not build a native app.

## Privileged sign-in (admin/finance)
Admin and finance accounts must enroll and verify time-based one-time codes before accessing privileged APIs. Configure `MFA_ENCRYPTION_KEY` as **32 random bytes encoded in 64 hexadecimal characters**, stored in the deployment secret manager; never use the CI example in production. First privileged sign-in routes to `/mfa`; re-enter your password, store the displayed secret in a TOTP authenticator, then enter a fresh six-digit code. Subsequent sign-ins require a code. Losing the encryption key makes existing authenticator secrets unrecoverable; implement documented key custody, backup and rotation before release.

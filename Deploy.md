# Masjid Community — verified deployment procedure

This repository contains two different applications:

- `staff-web/`: Next.js + PostgreSQL/Prisma, including the APIs used by the mobile app. This is the Vercel **Next.js** project.
- `masjid-mobile/`: Expo/React Native app for iOS, iPadOS, Android and React Native Web. Vercel can optionally host its **web export**, but does **not** distribute native iOS or Android apps.

## Release state

The active repair work is in the draft pull request at https://github.com/AnasAbuJamal/masjid-community/pull/2.
Do not promote it to production until CI, staging migrations, payments, email delivery, required security checks, and real-device acceptance tests pass. CI is useful but does not prove that every feature is flawless.

## 1. Vercel project setup — staff web

1. Import the GitHub repository in Vercel, or connect to the existing Vercel project.
2. In **Project Settings → General → Root Directory**, select **`staff-web`**. This is a Vercel project setting, not a `rootDirectory` property in `vercel.json`.
3. Framework Preset: **Next.js**. Build command: **`npm run build`**. Install command: **`npm ci`**. The `staff-web/vercel.json` file contains these defaults.
4. Production Git branch: **`development`** (this repository's default). Draft pull-request commits should only build preview deployments, using a **separate staging database**.
5. Choose a supported Node.js runtime (22 recommended here). Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the actual public HTTPS origin of the web application (no trailing slash).

Required secret environment variables:

| Setting | Description |
| --- | --- |
| `DATABASE_URL` | Real PostgreSQL connection string, secured with TLS; use an appropriate connection pooler for serverless traffic |
| `AUTH_SECRET` | Random authentication signing secret, at least 32 characters |
| `NEXTAUTH_URL` | Canonical HTTPS URL for the deployment |
| `NEXT_PUBLIC_APP_URL` | Same public HTTPS URL for email links and payment redirects |

Feature-specific variables:

| Setting | Description |
| --- | --- |
| `STRIPE_SECRET_KEY` | Matching Stripe sandbox or production secret key |
| `STRIPE_WEBHOOK_SECRET` | Secret for the webhook endpoint registered for this deployment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Matching client-side Stripe key |
| `RESEND_API_KEY` and `EMAIL_FROM` | Verified sending domain and sender for real email verification |
| `EMAIL_PROVIDER` | `resend` for configured delivery |

Use Vercel's encrypted environment-variable settings. Do not paste credentials in chat, add them to Git, put them in `vercel.json`, or put preview and production traffic on the same live payment/database credentials.

**Never run `prisma db push` or `prisma db seed` from the Vercel build command.** The previous repository-root Vercel config attempted to do both; it has been removed. The demo seed also now refuses production/Vercel execution and must not be used to create real timetable information or default accounts.

## 2. Database release

The database must be prepared **before deploying code that requires new tables/columns**. Obtain a verified backup; rehearse changes on a copy of production and check row counts, permissions, payment relationships, and rollback steps.

Prisma schema is `staff-web/prisma/schema.prisma`, provider `postgresql`. The repository contains incremental SQL migrations but **not yet a verified baseline of the existing production schema**. Do not blindly apply all migrations to a fresh or historic live database. Establish an accurately reconciled migration history before using `npx prisma migrate deploy` against production. Use `npx prisma validate` and `npx prisma migrate status` as diagnostics, then a database administrator should review and apply the final validated migration plan.

For local development only, with a disposable database:

```sh
cd staff-web
npm ci
npx prisma db push
npm run dev
```

In isolated GitHub CI the test database is created with `prisma db push` and uniquely guarded fixtures. Those steps do not run on Vercel.

## 3. Deployment and smoke checks

Deploy the reviewed, tested revision through the Vercel Git integration after staging sign-off. Verify that the intended commit SHA appears in the Vercel deployment overview. Then check:

- `https://YOUR-DOMAIN/api/health` must return `{"status":"ok","database":"reachable"}`. A 503 means the app or database is not ready.
- HTTPS login and logout, verified-parent access boundaries, admin audit log, CRUD forms, published prayers/events, and notification read state.
- Staging Stripe Checkout with signed webhooks, duplicate event delivery, recurring cancellation, and refunds.
- Email verification from a real sender, and 401/403 behavior for anonymous and non-privileged requests.
- Phone / iPad / desktop layout with touch, keyboard focus, VoiceOver/TalkBack and dynamic text sizes on real devices.

The health endpoint proves the app can query the database; it does not prove payment, email, push, or every workflow.

## 4. Expo mobile

Set `EXPO_PUBLIC_API_URL` to the deployed web app's HTTPS origin before building. For native builds, use the Expo Application Services workflow (EAS credentials and signing required). Native distribution is separate from Vercel.

If you need a browser version, configure a **second Vercel project** with root directory `masjid-mobile`, build `npx expo export --platform web`, output `dist`, and the same `EXPO_PUBLIC_API_URL`. Check that React Native Web-compatible components work before publishing it. Expo web output is not a native iPhone/iPad app.

## 5. Production blockers that require the owner/infrastructure

- Previous repository history contained possible secrets. Rotate them; removing HEAD files does not remove Git history or invalidate exposed tokens.
- Vercel project connection and permissions, DNS, production environment secrets, production PostgreSQL connection, verified email sender, Stripe settings and webhook configuration require access to those services.
- Database migrations need a reviewed production baseline, backup and dry run.
- Native iOS/Android packages and accessibility require real-device QA; browser emulation is not equivalent.
- Distributed rate limiting, data retention, backups and monitoring need an operational plan.

Reference: [Release Audit](SECURITY_AND_RELEASE_AUDIT.md).

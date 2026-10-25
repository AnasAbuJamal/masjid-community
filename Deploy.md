# Deployment and database connection

## Server configuration

Set the Vercel project Root Directory to `staff-web` in project settings (not in `vercel.json`). Deploy it as the Next.js project. Builds must not run `db push` or demo seeds. Run reviewed migrations separately before promotion. Copy the variable names from `staff-web/.env.example` into your hosting provider's environment settings.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, including SSL settings required by your provider |
| `AUTH_SECRET` | Random server-side secret used for both web and mobile sessions |
| `NEXTAUTH_URL` | Public HTTPS origin of the staff portal |
| `NEXT_PUBLIC_APP_URL` | Same origin, used in reset and payment return links |
| `MASJID_TIME_ZONE` | IANA timezone used for the masjid's calendar; defaults to America/New_York |
| `STRIPE_SECRET_KEY` | Optional; required to create real donation checkouts |
| `STRIPE_WEBHOOK_SECRET` | Required to verify payment confirmation webhooks |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | Development seed account; password must be at least 12 characters |

Earlier repository versions contained credentials. Removing those files does not remove Git history or revoke credentials. Rotate the previously committed database password and authentication secret through their providers before using a deployment. Do not reuse them.

## New database

```bash
cd staff-web
npm ci
npm run db:validate
npm run db:deploy
npm run build
npm start
```

The initial migration creates the current schema. Use `prisma migrate dev` to create subsequent development migrations; deploy committed migrations with `npm run db:deploy`.

The seed includes demonstration prayer times, school records, and content. Run it only against a development database. Production seeding is blocked unless `ALLOW_DEMO_SEED=true` is explicitly set. Create the first production administrator through a controlled provisioning process; there is no default production password.

## First administrator (no demo data)

After applying migrations, supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12–72 characters) as secure environment variables to a trusted server session and run `npm run admin:create` from `staff-web`. This creates only an active administrator; it does not load sample records, reset existing passwords, or promote an existing account. Remove the temporary provisioning variables afterwards. Do not put the password in shell history, source control, or build logs. The command has not been run against a live database in this workspace.

## Existing database

Back up the database and compare its schema with `prisma/schema.prisma` before deploying this initial migration. A database previously created with `prisma db push` must be baselined, not recreated.

Only after verifying that all tables, columns, constraints, and indexes match the initial migration, mark that migration as already applied:

```bash
cd staff-web
npx prisma migrate resolve --applied 20261025000000_initial
npm run db:deploy
```

If the existing schema differs, prepare and review a reconciliation migration first. Do not run the initial create-table migration against an existing populated schema.

## Mobile configuration

Set `EXPO_PUBLIC_API_URL` to the server origin, such as `https://your-portal.example`, or its full `/api` URL. All mobile service modules now use the shared API client and token handling. This does not implement every endpoint used by the older extended service modules; consult the completion checklist.

Keep `EXPO_PUBLIC_DEMO_MODE=false` in production. Demo fallbacks in the primary API service require an explicit `true` value. Several older screens still have local sample data and are listed as unfinished.

Use `npx expo export --platform web` for a web export. Native builds need the usual Expo/EAS project and signing configuration and must be checked on real Android and iOS devices.

## Donations

The mobile donation form opens Stripe Checkout. Amounts sent to the checkout endpoint are in USD; the database stores cents. Recurring checkout supports weekly and monthly billing. The app does not report a donation received merely because the button was pressed or a return page was opened.

Configure Stripe to send signed events to `/api/webhooks/stripe`. Validate checkout completion, declined payments, cancellation, webhook retries, and recurring billing in Stripe test mode before accepting donations. The existing recurring webhook bookkeeping and donor receipt/subscription management still require the acceptance checks in the completion checklist.

The checkout return pages are `/donate/success` and `/donate/cancel`. They do not independently prove that payment succeeded.

## Release checks

- Confirm `/api/health` returns 200 and migrations are applied.
- Test admin, teacher, staff, member, and student access with separate accounts.
- Verify guardian ownership of student records and private history endpoints.
- Test mobile access over the deployed HTTPS URL, not localhost.
- Configure a real email provider and test password reset delivery.
- Use durable object storage for media on serverless hosting; the legacy local upload implementation is not durable on Vercel.
- Complete browser, accessibility, Android, and iOS review and the unfinished feature checklist before calling this a completed production release.

## Proposal voting migration prerequisite

The proposal persistence batch adds `20261026000000_proposal_votes`. Apply committed migrations using `npm run db:deploy` in a configured, reviewed environment before promoting the matching app/API revision. This migration creates a vote table with unique `(proposalId, userId)` records and foreign keys; it does not populate sample content. Back up existing data first and verify deployed proposal listing, authenticated voting, repeated votes, comments, and internal-note privacy. This workspace has only checked the schema diff, not executed the migration against a live database.

## Push token ownership migration

Apply `20261027000000_push_token_ownership` before deploying the updated registration endpoint. Existing rows have no owner or expiry and must be excluded from personalized delivery until the installation registers while signed in. New registrations expire after 30 days and require authenticated renewal. Physical device delivery and offline logout recovery remain unverified. The family endpoint also requires a verified account linked to the student parent email; confirm that through the school administrator before testing.

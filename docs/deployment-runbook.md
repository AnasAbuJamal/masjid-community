# SILA deployment gates — Vercel and PostgreSQL

This runbook follows `document.md` sections 24–28. Code passing GitHub Actions is **not** the same as a safe production release. The current Vercel project `masjid-community` has no configured `DATABASE_URL`, and its prior production deployments failed.

## Connected targets

- Repository: `AnasAbuJamal/masjid-community`
- Sole branch: `development`
- Web application root: `staff-web`
- Next.js build: `npm run build` (Prisma client generation and Next.js compilation only)
- Expo mobile app: `masjid-mobile` (not deployed to Vercel)
- Existing database schema: additive migrations in `staff-web/prisma/migrations`

## Minimum prerequisites for a private staging deploy

1. Create or connect a properly access-controlled PostgreSQL instance under the intended Vercel team. Set `DATABASE_URL` in **the selected project's staging environment** using the Vercel UI. Never put credentials in Git, PR comments, terminal output, chat, or sample data.
2. Set strong, independently generated `AUTH_SECRET`, `MFA_ENCRYPTION_KEY`, and `NEXT_PUBLIC_APP_URL` in that environment. Configure secure domain, HTTPS, access policies and a named organization administrator.
3. Verify schema history and backups. On a **new empty** database apply `npx prisma migrate deploy` and verify `npx prisma migrate status`; never run `prisma db push`, automatic seed scripts, or a destructive baseline against an existing production database.
4. Restrict staging access and use synthetic accounts. Exercise public /visit and /api/health, member sign-in and MFA, role denials, prayer draft → different reviewer → publication, and verify zero unpublished prayer/faith leakage.
5. Run the GitHub Actions workflow on the exact commit. Confirm **every** web, PostgreSQL, native TypeScript and source-inventory check passes and inspect build logs; do not deploy a known-failing commit.

## Additional production requirements

- Approved mosque legal identity, privacy policy, content charter, safeguarding officer, incident owner and data retention procedures.
- Signed finance/payment integration test and reconciliation, provider webhook signature validation, live settlement and refund duties. Never enable live checkout with placeholder or test keys.
- Two-person approval for sensitive finance, child data, and high-impact worship changes, including a tested emergency override.
- Real iOS/Android Arabic/RTL, VoiceOver/TalkBack, high contrast and reduced-motion testing.
- Verified email/sender infrastructure, privacy-safe notifications, cron authorization, queue monitoring and provider failure drills.
- Tested backups and restoration with proven RPO/RTO, alerting, service rollback and on-call ownership.
- Production-domain health verification, audit-log access policy and an authorized go/no-go decision.

## Current deployment decision

**Hold production** until the connection details and operational sign-offs above are configured and verified. An environment with no `DATABASE_URL` cannot serve authenticated or public database-backed content correctly. Publishing an empty-looking site as a functioning mosque platform would be misleading.

The GitHub repository contains no runtime secrets. Configure Vercel environment variables directly in the dashboard. Treat each migration separately from the web build and review it before applying to a nonempty database.

## Change-control policy

Work on `development` only. For each scoped implementation slice:

1. Commit the code and acceptance tests.
2. Verify the exact GitHub Actions run.
3. Confirm the target Vercel project and production/preview environment, and inspect its readiness without reading secret values.
4. Deploy only to an environment satisfying its gates. After deployment check live health, public guest journeys and errors; record exact commit and deployment URL.
5. If a gate fails, retain code on `development`, record the blocker, and do not mark it deployed.


## Deployment attempt — October 27, 2026

A scoped Vercel preview deployment was attempted for GitHub commit `f6963c8f` after all GitHub Actions jobs passed. The deployment API rejected the request with **402 payment_required**, resource code `api-deployments-free-per-day` (daily free-tier API deployment limit; 24-hour retry). No preview or production deployment was created by this request. The same Vercel project still lacks a database connection. Do not try to bypass the quota using unrelated projects or request automatic upgrades/billing changes.

After the team quota resets, only retry a preview if a working isolated database and required runtime secrets are configured; do not promote it without the production release checks above.

## Student-ownership migration gate (October 29, 2026)
The additive migration `20261029160000_student_org_ownership` introduces nullable
`Student.organizationId`. New authorized student and approved application writes
set the current organization's ID. **Existing values are left null**. For a
nonempty database, the safeguarding officer must independently review the
provenance and conflicting links of each legacy student before any backfill.
The application intentionally denies unrelated or ambiguous legacy students;
it does not grant a foreign child to a mosque by matching names or email.
Review and test nullable legacy behavior, migration history, backups,
restore and reconciliation before staging or production database changes.
CI only applies migrations to a disposable empty PostgreSQL instance.

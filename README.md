# Masjid Community

Unified development branch for the Expo mobile app (`masjid-mobile/`) and Next.js staff portal/API (`staff-web/`).

## What is included

- Community-facing prayer times, Qibla, events, jobs, proposals and notifications
- Staff administration, school management, parent/billing resources and donation workflows
- Session authorization, email verification, permission checks, and database-backed services
- Sky-blue glass components (without reproducing Apple's proprietary design), with readable contrast and responsive layouts
- Reliable add/edit/delete feedback for staff Salah schedule management
- CI coverage for staff tests/build, mobile tests/types and browser checks

**Important:** A route being present does not guarantee that every end-to-end function is production-ready. Review [SECURITY_AND_RELEASE_AUDIT.md](SECURITY_AND_RELEASE_AUDIT.md) before any production rollout.

## Local development

Node 22, npm and PostgreSQL 16 are recommended. To start an isolated **local-only** PostgreSQL server:

```bash
docker compose up -d db
```

Copy `staff-web/.env.example` to `staff-web/.env.local`. Set a distinct local `DATABASE_URL`, for example `postgresql://masjid:masjid_local@127.0.0.1:5432/masjid_community` for the provided Docker service. Replace `AUTH_SECRET` with a newly generated random value. **Do not use example database passwords on a public server.** Configure optional Stripe and email integrations separately. Never commit populated environment files.

```bash
cd staff-web
npm ci
npx prisma validate
npx prisma db push # local disposable database only; not production
npm run dev
```

For the mobile app:

```bash
cd masjid-mobile
cp .env.example .env
npm ci
npm start
```

Set `EXPO_PUBLIC_API_URL` to the local server address reachable by your device. A physical phone cannot reach your computer through `localhost`.

## Verify

```bash
cd staff-web && npm run test:run && npx tsc --noEmit && npm run build
cd ../masjid-mobile && npm run test:run && npx tsc --noEmit
```

The GitHub `Verify web and mobile` workflow also runs database-backed and browser checks. Passing tests are necessary but do not replace payment, migration, accessibility and device acceptance checks.

## Branch consolidation

The `development` branch combines the latest reviewed app/security changes with useful design work and the self-contained local database setup from the other branches. Other branch histories remain reachable through the merge commit. Details and outstanding integration decisions: [docs/BRANCH-CONSOLIDATION.md](docs/BRANCH-CONSOLIDATION.md).

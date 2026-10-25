# Masjid Community

Community mobile app (Expo / React Native) and staff portal (Next.js), using a PostgreSQL database through Prisma. The mobile app accesses the database through the staff portal API; database credentials belong only on the server.

## Start locally

Use Node.js 22 and Docker (or an existing PostgreSQL server).

```bash
docker compose up -d db
cp staff-web/.env.example staff-web/.env
cp masjid-mobile/.env.example masjid-mobile/.env
```

Set `AUTH_SECRET` in `staff-web/.env` to a random value generated with `openssl rand -base64 32`. Set `ADMIN_SEED_PASSWORD` to a new password of at least 12 characters. The example database URL matches the local Docker service.

```bash
cd staff-web
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

In another terminal:

```bash
cd masjid-mobile
npm ci
npm start
```

For a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN address, such as `http://192.168.1.10:3000`. An origin or a URL ending in `/api` is accepted. Restart Expo after changing environment variables. Never put `DATABASE_URL`, `AUTH_SECRET`, or a Stripe secret in an `EXPO_PUBLIC_*` variable.

`GET /api/health` returns 200 only when authentication configuration, database connectivity, and the User table are available. A 503 indicates setup is incomplete.

## Validation

```bash
npm --prefix staff-web run check
npm --prefix staff-web run build
npm --prefix masjid-mobile run typecheck
npm --prefix masjid-mobile run test:run
```

The GitHub readiness workflow provisions a disposable PostgreSQL database, applies migrations, seeds it, validates both apps, builds the portal, runs browser smoke tests, and exports the mobile web app. Browser screenshots are uploaded as the `browser-review` artifact.

## Project status

This is an application under active development. A passing build is not evidence that all features are complete. See [the completion checklist](docs/COMPLETION.md) for implemented changes, sample-only screens, missing integrations, and required acceptance checks.

See [deployment instructions](Deploy.md) for a new or existing database and payment configuration.

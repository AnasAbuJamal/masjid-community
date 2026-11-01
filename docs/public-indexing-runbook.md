# SILA Public — search discovery runbook (F-034)

**Status:** implementation slice; **not a launch approval**. Default mode is
closed to search crawlers. This document covers only SILA Public's guest pages;
it does not establish legal, privacy, accessibility or production readiness.

## Owner approval required before enabling

1. Name/domain/trademark clearance and organization sign-off are documented.
2. The deployed web host belongs to the approved mosque and serves the public
   `/visit` page successfully without a login.
3. An authorized editor has checked worship sources, schedule freshness, emergency
   notices, bilingual copy and public detail records for accidental disclosures.
4. The app's separate **server-side** authorization and tenant tests are green.
   `robots.txt` is advisory crawler behavior, **not an access control**.
5. Operations, privacy and legal owners approve indexing and deindexing responses.
   Do not enable indexing on a shared private staff domain or on staging.

## Configuration (server only)

- `SILA_PUBLIC_INDEXING_ENABLED=true` (defaults to false).
- `SILA_PUBLIC_SITE_URL=https://approved-mosque.example` — replace with the
  mosque's actual HTTPS origin. Do not include `/visit`, credentials, query
  parameters, or fragments. Loopback HTTP is accepted only for local tests.

Both settings are required. Missing or invalid settings yield a disallow-all
`/robots.txt` and an empty `/sitemap.xml`. Visitor pages also emit
`noindex` metadata when indexing is disabled.

## Expected public surface

- Landing page: `/visit` (English and Arabic have explicit canonical language links).
- Published, still-upcoming gatherings.
- Published official announcements whose publish time has arrived.
- Publicly published learning programs.
- Published mosque faith notices with a named approver and publish time reached.

Every entry is scoped to the configured mosque and the current live publication
state. Member profiles, students, care cases, finance records, authenticated
operations and drafts are not permitted in this feed. The initial sitemap is
bounded to 400 records per content type. Larger catalogs require reviewed
segmented index pagination before claiming exhaustive search coverage.

## Verification after a **separately authorized** deployment

1. Fetch `https://approved-mosque.example/robots.txt` and
   `https://approved-mosque.example/sitemap.xml`.
2. Confirm the exact approved origin, live content URLs and both public locales.
3. Test a newly drafted, scheduled, rejected and foreign-mosque record by
   inspecting both its detail URL and the sitemap. No private record may appear.
4. Confirm staff login, child, care and finance endpoints remain independently
   protected by the server and cannot be accessed anonymously.
5. Verify canonical URLs with a production crawler and review the rendered
   English/Arabic site in supported browsers and assistive technologies.
6. Assign an owner for search-console submissions, retraction requests and
   incident handling. Record the approval evidence and site/date.

## Rollback and urgent retraction

Set `SILA_PUBLIC_INDEXING_ENABLED=false` and redeploy only through the approved
release workflow. The app then emits disallow-all robots and empty sitemap/noindex
metadata. **This does not erase previously crawled search-engine copies.**
Immediately unpublish or remove sensitive content at the authoritative server,
purge caches where authorized, use the search provider's removal process and
follow the organization's incident/privacy procedures. Never rely on robots
alone to revoke access to confidential records.

## Evidence

GitHub Actions `Verify rebuilt apps` runs disposable PostgreSQL tests for
published-only sitemap eligibility, cross-mosque isolation, unapproved faith
notices, future publications, and Arabic/English canonical metadata. A green CI
run proves only these automated cases, not production indexing acceptance.

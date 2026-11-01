# SILA / Masjid Community — coding-agent guide

These instructions apply to the full repository. They are intended for Codex and
other coding agents working from a real checkout of this project.

## Mission and authoritative sources
- Implement `document.md` incrementally; compare each slice against the F-001
  through F-050 acceptance register before claiming completeness.
- Read `IMPLEMENTATION_STATUS.md` before choosing work, to avoid duplicate
  implementations and to understand unresolved human acceptance criteria.
- Check `README.md` and `docs/deployment-runbook.md` for environment and
  deployment safety.
- This is an **in-progress system**. Never claim it is production-ready or give
  a guessed percent-complete figure.

## Branch, deployment, and data safety
- Work on the `development` branch or a feature branch targeting `development`.
- **Do not deploy, promote, configure production, merge to a release branch,
  or run migrations against staging/production** unless explicitly instructed
  in that task and all documented approval gates have been satisfied.
- No real member, child, guardian, donor, patient, care-request, financial,
  secret, location or mosque records in test fixtures, prompts, logs or CI.
- Use disposable local/CI PostgreSQL only. The CI database is named
  `masjid_ci`; tests that write fixtures must fail closed outside disposable CI.
- Never fabricate published prayer times, official moon-sighting decisions,
  emergency instructions, confirmed RSVPs, donations, receipts or approvals.
- Preserve membership/organization scoping, separation-of-duties, explicit
  approvals, fail-closed security, and audit history on sensitive features.
- Financial reconciliation, refunds, childcare, care intake and emergency
  notices require especially cautious review; automated tests are not a
  substitute for authorized independent acceptance.

## Engineering workflow
1. Select one coherent unfinished acceptance slice from `document.md`.
2. Inspect the current implementation and related tests; use a failing
   regression test when reproducing a defect.
3. Make a minimal, reviewable patch. Keep user-facing copy available in both
   English and Arabic; maintain RTL, accessible labels and locale-safe dates.
4. Never substitute phone-local time for a verified mosque/venue timezone
   without a clearly labeled fallback. Publication and authorization remain
   server-authoritative.
5. Run focused tests, repository tests, both TypeScript checks, and the
   relevant disposable-PostgreSQL integration smoke where available.
6. Document the implemented slice, test evidence and **remaining** acceptance
   work in `IMPLEMENTATION_STATUS.md`; do not mark incomplete features done.
7. Commit meaningful changes with descriptive messages and inspect CI. Resolve
   failing jobs before declaring verification complete. Do not deploy.

## Commands
From repository root:
```sh
npm test
```

From `staff-web/`:
```sh
npm install --no-audit --no-fund
npx prisma validate
npx prisma generate
npm run check
npm run build
```

From `masjid-mobile/`:
```sh
npm install --no-audit --no-fund
npm run check
npx expo install --check
```

Database tests and migrations may run **only** against a freshly prepared
disposable local CI database. Do not point `DATABASE_URL` at an existing
remote database to make a test pass. `.github/workflows/verify.yml` is the
reference for disposable CI integration and smoke tests.

## Change and verification reporting
- Say exactly which files, feature IDs, commits and tests changed.
- Distinguish tests **passed** from checks still queued or running.
- Never treat synthetic screenshots, browser smoke or simulator tests as
  physical-device, accessibility, financial or safeguarding sign-off.
- Report blockers and missing credentials without bypassing privacy or
  deployment controls.

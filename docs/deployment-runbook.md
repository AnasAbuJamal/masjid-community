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

## Automatic Vercel production-deployment hold — October 29, 2026

The linked Vercel project `masjid-community` was generating **production-targeted**
deployments on ordinary pushes to the sole `development` branch, before
safeguarding/database prerequisites were met. Unapproved queued deployments
from this implementation pass were canceled individually. The project
configuration API accepted a reversible **Ignored Build Step** setting of
`exit 0` to skip subsequent Git-triggered builds while the release is held.
**Re-check this setting in the Vercel dashboard before relying on it:**
a configuration API acknowledgement is not a verified release control.
Existing previously built READY artifacts must not be called production ready.

Only an authorized release owner may remove this hold after:
- The exact commit passes all GitHub Actions jobs and independent staging tests.
- PostgreSQL credentials, server-side secrets, migration reconciliation,
  backups/restore and incident response are proven in the target environment.
- Child safeguarding, guardian custody, accessibility, payment and deployment
  sign-offs are complete and a no-go rollback plan is rehearsed.
- Promotion or production-domain aliasing is deliberately approved.

Do not infer runtime readiness from Vercel's READY build status.

## Guardian application acknowledgement migration gate
The additive `20261029170000_guardian_review_acknowledgement` migration
adds optional server-captured acknowledgement time and wording version to
school applications. Existing requests remain NULL and cannot be **approved**
without an applicant resubmission; staff may decline them. This is intended
fail-closed behavior and requires operator communication and a legal/safeguarding
review before any pilot. The text is a review acknowledgement, **not legal
consent** and **not a guardian-identity verification**. Do not backfill missing
timestamps or treat a user-set checkbox as proof of custody.


## Mosque-scoped privacy data-review migration gate (October 29, 2026)

`20261029190000_privacy_request_org_scope` adds nullable
`DeletionRequest.organizationId`, an index and a foreign key.
`20261029191000_privacy_review_uniqueness` adds a **partial unique index**
over `(organizationId,userId)` for active (`pending` or `in_review`)
requests. CI applies these against a disposable **empty** PostgreSQL database.

Older privacy/deletion requests remain `organizationId=NULL`. They are
deliberately omitted from the standard steward queue; do not silently assign
them to a mosque from an email, names, dates or the current membership list.
A named privacy officer must reconcile historical requests offline under an
approved, documented policy with legal retention and identity verification.
Before running on a nonempty database, reconcile any already-tenanted
duplicate active requests (the uniqueness index will otherwise refuse to
apply), rehearse the changes on a restored backup, review rollback and gain
privacy-owner signoff.

The account export endpoint now represents **only the current mosque's
activity**, capped at 200 rows per category, with no student/custody data.
This is not an end-to-end portability or erasure service: additional sources,
multi-organization record requests, provider archives, notification retention
and legal/safeguarding obligations require manual review. Nothing in this
migration or the review queue deletes account or transactional data.

Do not apply either migration to a live environment as part of an ordinary
source push. This work is development and synthetic CI verification only.


## Circles and school attendance migration gates (October 29, 2026)

`20261029224500_private_circles` adds separate organization-bound
Circle, CircleMember and CircleUpdate tables. No historical groups, personal
contact lists or social-media membership tables are imported. Public records
must remain safe to publish; circle names, meeting descriptions, community
host assignments and moderation guidelines need their own safeguarding
and content review. Membership lists and updates are private, and archived
circles must never be presented as currently active.

`20261029231000_versioned_attendance_corrections` adds revision and nullable
attendance provenance fields. Existing attendance rows receive revision 1
but **not an invented `markedAt` instant**. Future marks and corrections
follow a provisional 15-minute-before/4-hour-after initial-mark window and
24-hour correction window. The organization must approve actual class
duration, exception, safeguarding, retention and appeal policies before any
real student is enrolled or historical register changed.

For a nonempty target database, separately rehearse migrations against a
restored isolated snapshot, inspect all existing class enrollment/attendance
relationships, confirm backup and rollback procedures, then obtain written
school/safeguarding and privacy-owner sign-offs. The current CI evidence is
limited to an ephemeral synthetic PostgreSQL database and local HTTP tests.
No environment deployment or live-data migration was requested or performed.


## Private school waitlist migration gate (October 29, 2026)

`20261029234500_school_class_waitlist` adds a new `SchoolWaitlist`
table, PostgreSQL enum, unique key, FIFO index and class/student
foreign keys. It does **not** rewrite old enrollments, approve guardianship,
or automatically enroll a child. CI applies the migration only to synthetic
empty PostgreSQL.

On a real school database, verify student ownership, active/withdrawn
enrollment history, guardian custody/revocation evidence, program capacity,
and the organization's signed queue, eligibility, notification and fairness
policies in a restored isolated test environment. A written safeguarding
owner must approve queue creation and review who may withdraw or promote.
Withdrawal retains history; staff explicitly promote one waiting student
only after checking current custody and an available seat. No automated
promotion, billing or contact to a minor is implied.

The family's waiting status is visible only through a current approved
guardian link. Review family-language wording, screen-reader usability,
retention and migration rollback before use outside disposable CI tests.
**No deployment or live migration was requested or performed.**

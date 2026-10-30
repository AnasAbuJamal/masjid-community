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


## Confidential care intake: disabled-by-default operational gate

The additive migration `20261030000000_private_care_intake` creates
`CareRequest`, `CareCaseAccess`, the care-case/access enums and
`care_manage` capability. It migrates **no old contact messages**. Case
narratives are AES-256-GCM ciphertext, authenticated with
`organizationId:caseId` associated data. Database backups contain only
encrypted narratives, not the runtime encryption key.

All of the following are required before *even staging* support intake:
- Named mosque leadership and trained care/safeguarding officers approve hours,
  turnaround expectations, limits of confidentiality and the emergency route.
  The product is NOT an emergency, mental-health or legal response service.
- Establish and test an independent, access-controlled, separately backed-up
  `SILA_CARE_ENCRYPTION_KEY` (64 hex characters, 32 bytes). Key loss makes
  existing case text unrecoverable; careless rotation also makes it unreadable.
  Key escrow, rotation, restoration drills and incident response are mandatory.
- Set `SILA_CARE_INTAKE_ENABLED=true`, `SILA_CARE_POLICY_HOURS`,
  `SILA_CARE_POLICY_RESPONSE`, `SILA_CARE_POLICY_LIMITS` and
  `SILA_CARE_POLICY_EMERGENCY` with legal/operations-reviewed texts, and
  rehearse disabled-state and provider-outage behavior.
- Approve training and due process for creating `care_manage` grants (MFA and
  maximum 30-day expiry), assigning an individual case via two separately
  authorized people, expiring access, documenting outcomes, and retaining or
  securely disposing of case data after the approved period.
- Test organizational isolation, access-log review, verified identity and
  revocation in a restored staging environment. Never store case narratives
  or personally identifying details in audit reasons, routine email, logs,
  search, aggregate reports or analytics.

CI enables the endpoint **only for synthetic fixtures**, with a disposable
test key and fictional policy text. This does NOT constitute organizational
approval or permit production enablement. No deployment or live migration
was authorized by the user.


## Single-organization staff invitation acceptance gate (October 30, 2026)

`20261030120000_staff_invitations` adds `StaffInvitation` only; it
does not change existing staff roles, automatically issue invitations,
backfill memberships or grant capabilities. A staff invitation does
**not** grant privilege until the named person verifies their exact
email, proves fresh authenticator access and accepts.

Configure a trusted `RESEND_API_KEY`, verified `EMAIL_FROM` and
HTTPS `NEXT_PUBLIC_APP_URL` before delivering real invitations.
The link uses a URL fragment to avoid automatically transmitting the
one-time secret in the GET request. Email is still a sensitive delivery
channel; recipients must use their own device and should not forward
the link. If provider delivery fails, the invitation is revoked and
the client sees a retryable delivery failure instead of success.

For disposable integration tests only, `SILA_INVITE_CI_CAPTURE=test-only`
can return a raw test token **only** within GitHub Actions when
`DATABASE_URL` points to `/masjid_ci` and the frontend is
`http://localhost:3000`. Do not enable this exception in staging or
production and never reuse CI tokens, sender keys or security data.

Authorization guards: administrative issue/revoke needs current,
active admin membership and session MFA; invitee is email-verified,
MFA-enrolled with a challenge less than 10 minutes old, and actively
accepts. The previous direct member-to-staff role editor is blocked.
Capabilities exclude confidential care, default to an explicit
14-day expiration, and require an active matching membership on every
privileged request. Reissued/revoked/expired invitations cannot be
accepted, and a demoted issuer can no longer confer new privilege.

**Single-org limit:** `User.role` remains an account-global field.
An invited user with *any other active organization membership*
is explicitly denied, rather than accidentally inheriting staff
authority across multiple mosques. True multi-organization role
separation, context switching and adversarial end-to-end tests are
still an unresolved launch gate. Existing legacy staff without
authenticator enrollment also need a separately governed migration.

Before any non-CI migration or staff invitation rollout: restore
an isolated snapshot, rehearse email delivery, recovery and link
revocation, review the invitation and staff exit policy, approve audit
retention and rate limits, verify full screen-reader/device flows,
and secure written security/organization owner signoff. No deployment,
provider configuration, app-store publication or live migration was
requested or performed.


## Private account export step-up gate (October 30, 2026)

`POST /api/v1/account/export` requires password reauthentication,
explicit confirmation, a currently verified active membership and fresh
session MFA for enrolled users. The historic GET endpoint is disabled.
The response and failures use `Cache-Control: no-store`. Completed
exports are audited without recording exported data; no raw passwords
are retained. The mobile app clears its password input before sharing.
External OS share destinations are controlled by the user and may
retain a copy; never imply end-to-end encrypted archive delivery.

The export intentionally excludes child records, sensitive care
narratives and data from other mosques; 200-record truncation is
explicit. This is not a complete statutory data-subject access package.
Approve data retention, access rights, dependent rights, secure-file
delivery/expiry and multi-organization scoping before real use.

## Signed provider payouts: evidence, NOT bank reconciliation

The additive `20261030140000_provider_payout_register` migration
creates a signed-event payout register and append-only human notes.
Stripe webhook signature and provider event idempotency are enforced.
The payout ID/amount/currency are immutable; a delayed event cannot
silently reverse a paid/failed report. The finance UI marks every
provider payout **NOT MATCHED**. A provider-reported paid status
is NOT a bank credit, fee reconciliation or proof of source payment.

One global `STRIPE_SECRET_KEY` cannot safely map incoming payout
events when more than one organization exists; the current handler
rejects that state until verified provider-account ownership is
implemented. Do not assign another organization's payout to the
default mosque. Notes do not write accounting entries or certify
settlement. Payout amount/fees/disputes and bank credits require
provider balance-transaction retrieval, bank statements, explicit
journal lines, independent financial review and reconciliation
exception controls.

Before real-money rollout, test the full signed provider event suite,
independent charge/refund/provider fee/adjustment/dispute matching,
payout reversal, late/duplicate events, full refunds, two-person
approval and bank statement ties in isolated Stripe test mode,
then in a separately approved controlled pilot. This increment
deliberately stops short of F-031 completion and of live deployment.


## Notification organization-ownership migration gate (October 30, 2026)

`20261030150000_notification_org_ownership` adds a nullable
`Notification.organizationId` with tenant/recipient indexes and a
foreign key. Existing records are deliberately left NULL because the
recipient's identity alone cannot establish which mosque owns the
message. **Never** run a blanket backfill to the oldest organization.
Historic unowned messages are hidden from member inboxes, denied by
the mark-read API and ineligible for outgoing email. A designated
privacy officer must decide whether a specific old message can
safely be reattributed or retained, with provenance and audit.

All new workflow notices must pass the verified organization ID,
not a client-supplied tenant hint. The helper must recheck active
recipient membership and account verification; noneligible recipients
are skipped without reversing a valid staff/business decision.
Outbox delivery separately rechecks original ownership, recipient
identity, active account and membership at dispatch, and must never
include school, child, case or payment details in external email.

Before actual mail rollout, approve opt-in and mandatory-service
notification categories, per-channel and quiet-hours policies,
provider idempotency, worker retry/lease recovery, tenant-specific
service ownership, unsubscribe/revocation handling and a tested
multi-organization account switcher. Review old NULL messages with
legal/privacy staff and run fixture-backed migration and restoring
tests against a nonproduction copy first. Real provider credentials
and production delivery remain unconfigured under this work; no
deployment or production data migration was performed.


## Email delivery consent and quiet-hour rollout (October 30, 2026)

The additive migration `20261030180000_org_delivery_consent`
introduces `OrganizationDeliveryPreference`, `DeliveryPurpose`,
`DeliveryChannel` and `Notification.purpose`. Old notifications
are classified as operational `service` records solely for schema
compatibility; historic `Notification.organizationId IS NULL` records
**remain permanently held** until manually assessed. A global
`UserPreference.newsletterOptIn` or `eventEmailOptIn` is NOT
permission from any particular mosque. No legacy flag is migrated or
accepted as effective consent.

Only an active verified user within the request's authorized
organization may set purpose-specific optional email choices. The
server audits changes, not private notification text. Opting out
must stop **pending as well as future** optional email. The worker
checks organization, active membership, consent and valid quiet hours
again at dispatch. User-selected quiet windows use the mosque's
IANA timezone and defer optional email to a next permitted time
without increasing the provider error budget. Operational service
notices are distinct; an optional unsubscribe never suppresses
a genuine booking/school/registration decision message.

`SILA_DELIVERY_CI_CAPTURE=test-only` is a disposable **synthetic
worker** setting that ONLY works when `GITHUB_ACTIONS=true`,
`DATABASE_URL` ends in `/masjid_ci`, and
`NEXT_PUBLIC_APP_URL=http://localhost:3000`. It never contacts
an email provider and must **not** be configured in staging or
production. The CI worker uses a CI-only `CRON_SECRET`. It proves
application gating/queue transitions, not external inbox arrival,
real bounce behavior or production email deliverability. Ordinary
deployment requires a distinct protected worker secret and
configured verified email provider, and no actual sending is
authorized by this implementation pass.

Before enabling real optional delivery, approve opt-in copy and
recipient purposes, explicit user notice and unsubscribe/withdrawal,
double-opt-in needs, quiet-hours policy, list-limiting/rate controls,
maker/checker publication, provider receipt and bounce handling,
idempotent worker recovery, tenant-specific sender credentials,
support routes and end-to-end assistive-tech tests. All changes
in this pass remain code and CI-only synthetic tests; no deployment,
production migration or real email has been initiated.


## F-045 recovery and incident readiness (disposable verification only)

**Health probe semantics.** `/api/health` tests process liveness only.
`/api/ready` tests whether the database is currently reachable; its
response is intentionally generic. Load balancers should use readiness
to avoid sending DB-backed traffic to an unavailable instance. Neither
endpoint exposes tenancy, credentials, queues, financial details or
versioned infrastructure. Liveness returning 200 **does not** prove
that a customer workflow or payment provider is operational.

**Restricted operational counters.** `GET /api/internal/operations`
requires a dedicated `Authorization: Bearer $SILA_OPERATIONS_SECRET`
of at least 32 characters and not equal to worker `CRON_SECRET` or
`AUTH_SECRET`. Store it only in approved secret management, not in
client builds or the repository. Rotate and monitor access separately
from the delivery worker; restrict at network level in deployed
infrastructure. Its counters include queue backlog/leases, provider-
reported failed payouts, refund exceptions and outstanding privacy
reviews; no personal records or message bodies. `attention` is a
provisional alert signal, **not** measured SLA/SLO compliance,
provider delivery proof, bank reconciliation or privacy-case closure.

**What CI actually rehearses.** Against its ephemeral PostgreSQL 16
service and fictional fixtures only, the GitHub Actions verification
workflow:
1. Applies migrations and inserts representative synthetic people,
   guardian links, attendance, invoices, email outbox and content.
2. Captures a **logical** PostgreSQL custom-format snapshot to an
   ephemeral `/tmp` file; restores into a **distinct** fresh DB using
   transactional `pg_restore` and no ACL/owner restoration.
3. Compares applied migration checksums, seeded model counts and
   specific private relationships/financial amounts and queued state;
   proves restored FK and provider-event unique keys still enforce
   integrity; proves restored-only writes never appear in source.
4. Checks Prisma migration status against the restored DB and
   destroys both temporary dump and restored database via shell trap.
   No backup archive is uploaded, committed or made externally
   accessible by the workflow.

The shell and `scripts/test-restore.mjs` explicitly require
`GITHUB_ACTIONS=true`, localhost CI credentials and exact
`/masjid_ci` and `/masjid_ci_restore` database paths. **Never use
the CI restore script against a real organization or production
database**, including a cloned production-data snapshot. Only the
synthetic fixture is allowed.

**Non-CI release blockers:** obtain written approval for RPO/RTO,
encrypted automated offsite backup frequency/retention, independent
credential custody, full backups including object storage and
external provider recovery state, restricted support access,
tested key restoration, a monthly sampled restore schedule, and
full prelaunch multi-tenant staging restoration. Rehearse provider
webhook backlog replay and deduplication, accidental guardian
access revocation, sensitive school-content exposure response,
stale prayer schedule correction and Stripe payout/refund incident
handling with the real responsible teams. Establish quantitative
service monitoring, paging, on-call runbooks and signed evidence.
This code change performs no deployment or production migration.


## F-044 integrity-audit pilot: keyed chains and limits (October 30, 2026)

The additive `20261030210000_integrity_audit_chain` migration adds a
separate `IntegrityAuditEvent` table. It does **not** backfill the
historical mutable `AuditEvent` records: old audit entries have no
authentic per-event organization and cannot be retroactively certified.
The new trail is organization-specific and protects only the
explicitly instrumented privilege, invitation and privacy-export
operations. Every sealed event includes actor reference, request
correlation ID, object scope, bounded transition evidence, server time
and a unique sequence. Its HMAC-SHA256 incorporates the previous
hash; normal application UPDATE/DELETE/TRUNCATE is blocked by database
triggers. Hashes are verified server-side against an independent
runtime key and never presented as a substitute for signed external
evidence.

High-risk instrumented operations require `SILA_AUDIT_HMAC_KEY`
exactly 64 hexadecimal characters (32 bytes), generated and held in
approved secure secret management independently of `AUTH_SECRET`,
`MFA_ENCRYPTION_KEY`, `SILA_CARE_ENCRYPTION_KEY` and delivery
credentials. **Never configure the CI example key in a real
environment.** Missing/invalid key fails those actions with 503.
Losing or replacing the key without a versioned rotation plan makes
the existing chain unverifiable. A rollback to code that does not
understand the integrity trail is not an approved security rollback.

`GET /api/v1/admin/integrity-audit` is currently restricted to
MFA-verified home-mosque administrators, not a full auditor role.
It checks up to 10,000 records and reports an explicit `incomplete`
result above that limit. Masked review metadata may support incident
triage, but no child/case/payment content or raw invitation tokens
should be recorded in the chain. The HMAC protects against casual
database row edits without the key, not against a database
administrator who can disable triggers or against an attacker who
obtains the application HMAC key. A complete deployment needs
independent, append-only **offsite chain-head anchoring**, dedicated
auditor identity, explicit denied-action trace policy, key rotation/
escrow and custody, monitoring and separation of duties.

CI uses a disposable HMAC key and synthetic PostgreSQL, proving
concurrent writes/links, isolation, mutation rejection, authentic
verification and read-only access. It neither provisions nor
publishes a production key and does not deploy anything. Before any
real privilege administration rollout, rehearse independent key
custody, old-key verification after rotation, external head
notarization and recovery/incident exercises with approved owners.


## Session-bound second-mosque member context (October 30, 2026)

`20261030220000_session_tenant_context` adds nullable
`AuthSession.selectedOrganizationId`. NULL denotes the original
pilot home mosque. No existing session is switched or assigned a
tenant by a guessed role/membership; the account's global `User.role`
remains unsuitable for multi-mosque staff authority.

`GET /api/v1/organizations/context` is authenticated and lists
only currently **active** membership organizations. `POST` accepts
only `{organizationId}` and requires origin verification and a
present, currently active verified membership; selected organization
is updated on just that authenticated session, with audit evidence.
No `X-Organization-Id`, client query string, cached display name
or submitted organization ID on business endpoints is trusted.
A lost membership causes immediate denial on private requests;
the context endpoint remains usable to select an active alternative.
Revoking a session still revokes its context.

**Strictly supported on a second mosque:** verified member
`/api/v1/me` dashboard, `/api/v1/me/preferences`,
`PATCH /api/v1/notifications/[id]` and the global account profile
with private deletion-request status scoped to active selected mosque.
All other privileged/private workflows using `requireVerified`
return `409 TENANT_CONTEXT_UNSUPPORTED` if a second mosque is
selected. Staff invitation preview/acceptance also denies that
selection. Global administrator/staff/teacher/finance roles cannot
switch to another mosque because they are not per-membership roles.
Do **not** use these limited flows to claim full multi-organization
support, and do not remove the fail-closed guard until each endpoint
is migrated with adversarial object-scope tests.

The mobile membership picker labels its limitations in English and
Arabic. Changing mosque increments a session context generation and
invalidates every mounted `useResource` response; stale or in-flight
private data must not remain visible while the new mosque loads.
The mobile client does not persist selected mosque IDs separately
from the credential and does not supply untrusted tenant headers.
Public discovery content may still use pilot defaults and must not
be assumed scoped to the selected mosque.

Before expanding beyond the pilot, design and migrate per-membership
roles, a single verified request-tenant middleware/service, active
organization directories, school/care/finance resource authorization,
checkout and webhook provider-account mapping, tenant-bound
invitations and role grants, multi-venue content, and full native/
web cache invalidation. Carry out cross-tenant E2E, privacy,
safeguarding, finance, accessibility and device tests with
synthetic records; obtain owner approvals. This pass performs no
deployment, production database migration, credential provisioning
or public release.

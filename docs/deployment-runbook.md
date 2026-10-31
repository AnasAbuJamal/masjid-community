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


## Read-only audit reviewer migration gate (October 30, 2026)

`20261030230000_audit_review_capability` adds one PostgreSQL enum value without backfilling or granting anyone access. Review existing enum dependencies and migration history on a restored isolated snapshot before applying to a nonempty environment. The new capability can be granted only by an MFA-verified home-mosque administrator to verified staff with an enrolled authenticator, expires within 30 days, and remains read-only. Governance must approve reviewer independence, HMAC-key custody, audit retention, and external head anchoring before treating it as a production assurance control. CI tests are synthetic only; no live grant or deployment is authorized by this change.


## Git-triggered deployment hold (October 30, 2026)

Three linked Vercel projects (masjid-community, masjid-community1, and
masjid-community-url3) previously attempted **production-targeted** builds on
development pushes despite missing environment secrets, database migration
approvals and safeguarding/finance gates.

A reversible Vercel project-level **Ignored Build Step** command (exit 0) was
configured on all three projects to skip builds during active development.
For commit c3cc3a5e231462b4c9d1044816205e4a32b6db79, all three
Git-triggered deployment records ended **CANCELED**, not READY. This confirms
the hold for that commit, not a permanent guarantee against config drift.

This hold is in Vercel project settings, not in Git. Check its continued
enforcement before additional pushes and never remove it just because
GitHub Actions passes. The exact release commit, deployment environment,
secure secrets, independently rehearsed production-like backup/restore,
approved safeguarding/privacy/finance policies, and written release signoff
are required before a production deployment. If auto-release protection
cannot be verified, stop unsafe pushes. No production deployment or live
database migration was authorized or performed in this increment.


## Optional gathering policy migration gate (October 30, 2026)

The additive migration `20261030233000_event_reservation_policy` introduces nullable
RSVP deadline, cancellation deadline and cancellation-terms columns on Event.
For existing gatherings, all three values remain NULL, preserving the prior
registration and cancellation cutoff at gathering start. No backfill or
destructive change is included. Newly configured cutoffs must be no later
than start and are enforced by the existing serialized RSVP/cancellation APIs;
the public and mobile details state the exact configured policy.

**Do not apply this migration to production** until backup/restore rehearsal,
migration-diff review, separate organizer policy approval, rollback plan,
safeguarding/accessibility review, and written deployment sign-off are
complete. This branch change only permits disposable CI database verification.


## Gathering discovery metadata migration (October 30, 2026)

The additive migration `20261030234000_gathering_discovery_metadata`
adds nullable event venue ownership, category, intended audience and staff-authored
accessibility notes plus an initially empty accessibility-feature list.
It adds a venue foreign key, strict ownership triggers preventing an event
from linking another mosque's venue or an assigned venue from being transferred
across mosques, and bounded read indexes. **Existing gatherings are not
backfilled, categorized, assigned venues, or marked accessible**.

Apply only to a disposable CI database before completing organizer review
of audience labels, verified venue selection, actual accommodations, migration
diff, backup/restore rehearsal, accessibility/Arabic review and production
change sign-off. Do not deploy this migration or switch production endpoints
until all rollout, data governance and safeguarding gates are met.


## Venue emergency notice release gate — F-006

The additive migration `20261031002000_venue_emergency_notice`
introduces one revisable, expiring public-safety notice per venue. Venue ownership
is derived directly from its foreign key; no notice has a separately writable
organization ID. It stores publisher identity for internal accountability,
a revision number and audited publication/clear actions. **No existing
announcements or venue records are transformed.**

Production requires review of backup/restore and migration rollback, written
mosque emergency contact and publishing policy, an authorized on-duty publisher
who has completed MFA, an independent verification of factual venue
instructions, a trained coverage/clearance process, and mobile/kiosk
accessibility and Arabic translation review. The system does not replace local
emergency response, staffed phone lines, building safety controls, or emergency
broadcast integrations. Native client views poll approximately every minute while mounted, and
the read-only kiosk revalidates its server-rendered view every 45 seconds;
no guaranteed instant push notification delivery is implemented.

If an emergency notice is incorrect, the designated publisher must issue a
new audited revision immediately or explicitly clear it. Publication has a
maximum seven-day lifetime and automatic expiry from all current views.
Stopping emergency notice publication is not the same as disabling the
application or migration. No live tenant, provider or database change is
authorized by this development commit.


## Published gathering continuation and cross-tenant cursor rules (F-007/F-048)

Guest pilot and selected-mosque member catalogs now use a shared, bounded 25-item
keyset continuation. The cursor is an event ID used only as a lookup **within**
the active organization, published/upcoming predicate, and all the request's
original validated filters. The event's persisted `startAt` and `id` form
the strict tuple comparison; the cursor is never a user-controlled mosque ID,
security grant, database offset, or permission to view unpublished content.

A continuation may become invalid if the pivot event is removed, unpublished,
moves into the past, or ceases to match its filters. Return a bounded
`CURSOR_UNAVAILABLE` response to JSON clients or a safe restart link to
public website visitors. Do not silently drop the cursor and return a first
page, since that would misrepresent results and could confuse a selected
mosque's context. A member switching mosque must discard all previously
loaded pages, including in-flight page responses.

The server-rendered public /visit page exposes Next Page and Restart controls
without JavaScript. Native event list pages use an explicit Load More action
rather than claiming to provide infinite scrolling. Neither API promises
a historical snapshot if event publication changes between requests.
Operations may use these behaviors in synthetic CI, but production tenant
rollout still requires real-device accessibility, Arabic/RTL,
independent authorization, and response/caching verification.


## F-010 event host revalidation gate

A historical host assignment is NOT a standing entitlement to private attendee
names. On every roster request, assigned-event list and check-in mutation,
the host must still be verified, active, non-student, an active member of
the event's original mosque, and assigned to the exact published gathering.
Administrator eligibility rechecks run inside the serializable grant
transaction, before writing the assignment and audit record.

The `student` role exclusion is a technical fail-closed control, **not**
age verification or safeguarding certification. Real safeguarding review,
staff training, shift supervision and independent roster-disclosure approval
remain production release requirements.


## F-010 host attendance paging and privacy

The private host roster returns at most 50 confirmed and currently eligible
registrations per page. Each page resolves its cursor only **after**
authenticating the same active, non-student host, checking current active
membership in the event mosque, verifying an unrevoked assignment and
confirming the event remains published and within the permitted roster
window. Cursors are RSVP IDs bound to the exact event and eligibility
predicate, not bearer tokens or tenant IDs. A revoked/removed/unconfirmed
cursor invalidates the page and requires refreshing the roster.

The host UI never downloads a bulk complete roster or exposes contact
details. It rejects stale responses after event switches, and hides
unconfirmed or ineligible rows. Host devices must be locked, attended,
training-approved and assessed for accessibility before real-world use.
No browser caching of attendee data is authorized after a shift; actual
staff operations and child-safeguarding review remain production gates.


## Private host roster on-screen lifetime and authorization probes

The host-only check-in screen performs an access-only authorization request
approximately every 45 seconds while visible. It returns no attendee data;
the server still verifies the currently eligible active host, original mosque,
exact event publication and unrevoked assignment. Denial or a lost connection
clears displayed private rosters and requires reloading before continuing.
Hidden/browser pagehide states also clear names and stale write state; on
return the client re-requests only a newly authorized roster. This limits
casual exposure on shared devices but **cannot retract screenshots or copied
names**, nor provide instant revocation between polling intervals.

Independent checks of actual browser visibility behavior, device lock
policies, trained staff supervision and safeguarding escalation are still
required before real attendees are shown.


## F-011/F-012 circle account reclassification and host creation

A private Circle approval is not perpetual authorization. The original pilot's
adult-only circle policy requires an active, verified, non-student account
and currently active mosque membership on private reads. A historical
`approved` member row must not allow a subsequently student-reclassified
account to read private circle updates. Administrative circle creation must
verify its proposed moderator within the transaction that creates the circle
and its audit event; preflight UI choices have no authorization authority.

Role exclusion is not proof of legal adulthood, independent safeguarding
clearance, or certified moderator training. These require separate human
approval and recorded operational policy before production usage.


## F-012 private circle moderator roster pagination

A circle host receives at most 25 private current eligible member names per
server-owned page. The only valid cursor is the ID of a requested or approved
member of the **same** published, assigned circle who remains active,
verified, non-student and a current member of the original mosque. The
server rechecks host scope before any cursor lookup or person-name read.
Removing, denying or suspending the cursor member invalidates the page;
the staff screen must restart from the first authorized page. Exact
`requestedAt,id` ordering is stable for simultaneous queue requests but
is not a point-in-time snapshot across concurrent review changes.

No moderator roster export, public directory, or external notification of
circle member identities is allowed. Screens clear on circle change or
visibility loss. A production sign-off still requires trained hosts,
documented safeguarding and privacy review, real browser screen-reader
testing, and appropriate Arabic/RTL copy.


## F-012 private circle host screen lifetime

The on-duty Circle host's private roster performs a name-free current access
check approximately every 45 seconds when the host screen is visible. The
server checks current verified non-student host eligibility, active membership,
original mosque scope, assignment and published status; it never selects
or returns private member data in the probe. Denials or connectivity failure
clear the displayed roster and decision reasons until the host refreshes.
Hiding the tab, pagehide, or selecting another Circle also clears cached names,
and old responses must not repopulate the view.

This is a best-effort exposure reduction, not guaranteed instant revocation:
it cannot undo a copied record, photograph or offline screenshot. Production
requires supervised host devices, documented data-retention policy and
independent safeguarding/accessibility authorization.


## Current role overrides historical guardian and teacher associations

For school-facing read APIs, the account's **current authenticated role**
must be used alongside an independently scoped, approved, nonrevoked
guardian link or current class assignment. Student-role identities may
access only their own positive StudentAccount record; an old guardian
approval alone must never expose a different child's schoolwork, reports,
tuition invoice, attendance or identity. Teacher rosters must require
a current teacher/admin role in addition to the assigned class and same
organization. A role downgrade must prevent reads immediately without
deleting historical reviews or changing evidence.

This rule cannot prove actual age or custody, and is not a substitute for
independent school safeguarding approvals, guardian revocation procedures,
and real-device privacy testing. Production remains blocked.


## F-014 concurrent guardian application submission

An acknowledged guardian application is a **request for review**, never an
automatic enrollment, guardian link or certification of legal custody.
Applicant account eligibility, current mosque membership and published
local program scope are rechecked inside the serializable transaction
that also checks for an identical pending application. A concurrent
submission may receive a 409 and the applicant must refresh their own
application history. Do not automatically merge two different children
whose names happen to match; school staff must review such cases.

The technical non-student role check is not proof of legal adulthood or
guardianship. Real-world independent evidence and safeguarding workflows
remain production release blockers.


## F-015 direct guardian-link evidence recording (pilot only)

The pilot's direct `admin/school` guardian-link command requires a
confirmed external relationship check and one of three controlled evidence
categories, rather than treating a selected email/account as proof of
custody. The API rechecks student and guardian ownership and eligibility
inside the serializable transaction that creates or approves a link and
records an internal audit event with only IDs and evidence category.
A previously revoked link remains denied and cannot be restored through
this single-admin form. Repeated approval of the same active link is
idempotent and does not forge another review event.

**This is not independent safeguarding verification.** One admin's checkbox
and evidence-category choice cannot establish legal guardianship, and
evidence documents are not collected, verified or stored through this
feature. Designated safeguarding officers and legal/compliance reviewers
must sign off on an independent evidence/appeal/revocation workflow
before live child-data access is enabled.


## F-022 current volunteer eligibility on shift operations

Scheduling must recheck, in the serializable transaction, a published service
opportunity, an approved volunteer application, an active verified volunteer
account and active original mosque membership. A previous approved status
alone cannot authorize a new shift after deactivation. The same checks
apply to recording a NEW check-in, including when an old scheduled row
remains. Existing historical attendance and completion records are not
silently deleted when the person's eligibility changes.

Coordinator views exclude ineligible approved applications from new-shift
selection; operationally authorized schedulers should handle remaining
historical shift records under reviewed cancellation/correction policy.
All real-world youth eligibility, staff supervision, device assurance,
volunteer training and evidence retention require separate approvals.

## F-022 volunteer attendance correction pilot — October 31, 2026
- **Scope:** staff with `volunteers_manage` may adjust an existing arrival time or remove an erroneous check-in for a still-scheduled shift in their configured mosque. A completed shift's recorded arrival cannot be removed by this workflow. No user can self-correct a shift.
- **Record:** operators must enter an explanatory reason (12–500 characters). The API constrains the corrected timestamp to the shift's original check-in interval, closes corrections 72 hours after the recorded end time, and retains the before/after timestamps in an attributed audit event. The member receives a non-sensitive in-app notification. A failed or conflicting correction must be refreshed and reviewed, not assumed saved.
- **Review procedure:** verify the attendee against the organization's identity and attendance policy outside the public screen; correct only factual arrival records; inspect the volunteer's own updated history. Escalate completed false check-ins, older disputes, sensitive misconduct, custody/minor issues, or contested evidence to an authorized safeguarding/operations owner. Do **not** use database edits as an appeal workaround.
- **Release gate:** disposable CI integration and TypeScript/build checks are required but not enough. Obtain written attendance correction/appeal policy, independent reviewer assignment and operational training, confirm check-in hardware and accessibility/Arabic UX on devices, test tenant permissions independently, and rehearse migrations/backup in isolated staging. **No real deployment or production readiness is asserted by this code.**

## F-022 volunteer role reclassification and on-screen privacy — October 31, 2026
- New volunteer scheduling and arrival are denied for the current `student` account role, even if the member historically held a verified adult role and an approved application. This protects against a stale approval being reused after reclassification. **It is not an age-verification system:** supervised youth service must remain disabled until the organization approves age/guardian/training rules and implements explicit eligibility evidence.
- Privileged volunteer coordinator data is intentionally temporary on screen. The browser clears roster and correction details on tab hiding/pagehide and permission/read failures, revalidates visible work roughly every 45 seconds, and ignores late responses from an old screen generation. A correction write that returns unauthorized/forbidden also drops cached names. Staff must not use screenshots, browser extensions or unattended displays as persistent rosters.
- API minimization removes volunteer email addresses from the approved scheduling list. Operate shift check-in only on trusted devices; test reclassification, permission revocation, offline/network failure, hidden/resumed tabs and real-language/accessibility controls in isolated staging before any live use. Manual independent staff/custody/child-safeguarding and privacy acceptance remains required.

## F-021/F-022 volunteer application and approval role gate — October 31, 2026
- The currently supported volunteer workflow is adult-member-only in the role sense: `student` accounts may not newly apply, receive staff approval, be newly scheduled, or be checked in, even if they have a historical submitted/approved application. The server rechecks active, verified, same-mosque account and organization membership inside its application/approval transaction. A previously displayed form or eligible past session is not a permission grant.
- Review operators must not approve a request after a membership suspension, role change, verification loss, or opportunity unpublication. Approval checks current published status and live capacity inside the same transaction; it must not count a denied applicant toward filled capacity. An existing submitted request is retained for historical review, not automatically deleted or approved. Test the positive adult route and the failing student/suspension/foreign-mosque routes on disposable or isolated staging data.
- **Release hold:** written child/youth service safeguarding policy, identity and age evidence, controlled mentor/guardian permissions, staff training, audited appeal process and tested authorized student-to-volunteer transition are required before supervised youth volunteering is implemented. CI success cannot substitute for independent operational/legal signoff or production deployment gates.

## F-035 public kiosk freshness and venue selection — October 31, 2026
- **Only published public data.** The public `/kiosk` display selects the configured pilot mosque's first venue. For a known venue, use `/kiosk?venueId=VENUE_ID`; each ID must belong to that mosque. Unknown, empty, repeated or foreign venue IDs return 404 instead of switching silently. Do not treat public kiosk URLs as device credentials, authentication or multi-tenant provisioning.
- **Freshness interlock.** Server-rendered prayer and emergency data stay obscured until a no-store guest `/api/v1/public/home?venueId=...` response confirms the exact venue, venue-local civil day, prayer publication revision/update timestamp and active emergency revision. On network failure, 12-second verification timeout, daily rollover or any version mismatch the client masks the potentially stale content including the accessibility tree, retries on the next poll and requests a Next.js server refresh. Periodic verification is every ~45 seconds; it is **not** immediate push or a guaranteed emergency propagation deadline.
- **Manual safety action.** A device operator may select **Blank this display locally**. Resuming requires re-verification. This only changes the current browser view and is lost on page reload/device restart; it does not clear official venue notices or blank other displays. To publish or withdraw a real emergency notice, use the distinct MFA-protected steward venue-emergency workflow and confirmed organizational policy.
- **Operational drill required before live display:** use synthetic venue records in isolated staging, deliberately unpublish a prayer, change its revision, publish/revise/expire a venue alert, switch to the next civil day, sever the network, and confirm that previously rendered times or safety instructions are hidden (including assistive-tech read order). Verify recovery after reconnection, low-end kiosk network/power behavior, front-desk escalation, physical device hardening, persistent management policy, and local Arabic/English content. Treat tested code as a pilot safety layer, not production release evidence.

## F-022 native volunteer timezone and bilingual history — October 31, 2026
- The private shift API now exposes the operational mosque name and IANA `timeZone` with the requesting member's own shifts only. The mobile shift screen formats absolute timestamps for that timezone and labels it in English/Arabic, including a distinct recorded-arrival state. It never infers attendance from having an approved shift or from device-local time.
- Test that changing the phone timezone does not change the mosque clock time, and that US fall-back displays distinguish the repeated hour with an offset abbreviation. Validate the Arabic glyph shaping, mixed-direction timestamp ordering, focus/read order and screen-reader announcements on real iOS/Android builds. The source and simulated timezone tests are not a device acceptance certificate.
- **Hold:** the steward's current `datetime-local` scheduling inputs are still interpreted as the coordinator device's timezone, and real device/venue scheduling policy needs explicit product and operational review before live use. Do not label the entire shift scheduling workflow timezone-safe.

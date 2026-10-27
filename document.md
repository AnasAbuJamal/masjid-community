# Masjid Community / SILA — Complete App Plan

**Edition:** 2.1 · 27 October 2026  
**Repository:** AnasAbuJamal/masjid-community  
**Baseline reviewed:** development at `27e428a067ce9ea8d31e660c465d7baadeaa5d94`  
**Status:** Proposed product and engineering plan. Features below are requirements, not claims of implementation or production readiness.  
**Name:** Keep Masjid Community as the repository identity; SILA / صِلَة remains an optional working brand.

> Give the community one dependable place to find prayer times, participate, learn, give and get help—and give mosque staff the tools to run those services responsibly.

This edition replaces the previous build-from-zero blueprint with a practical plan to complete and improve the existing application. Preserve useful code, data and tests. Do not start another rewrite merely to adopt a different framework. The previous specification remains available in [Git history](https://github.com/AnasAbuJamal/masjid-community/blob/27e428a067ce9ea8d31e660c465d7baadeaa5d94/document.md).

## Contents

1. [Product decisions and launch scope](#1-product-decisions-and-launch-scope)
2. [Current application and gaps](#2-current-application-and-gaps)
3. [Navigation and primary experiences](#3-navigation-and-primary-experiences)
4. [Roles, permissions and account lifecycle](#4-roles-permissions-and-account-lifecycle)
5. [Worship and mosque information](#5-worship-and-mosque-information)
6. [Events, circles and volunteering](#6-events-circles-and-volunteering)
7. [School, families and learning](#7-school-families-and-learning)
8. [Giving, tuition and finance](#8-giving-tuition-and-finance)
9. [Care, appointments and mosque services](#9-care-appointments-and-mosque-services)
10. [Facilities and community extensions](#10-facilities-and-community-extensions)
11. [Communication, content and operational tools](#11-communication-content-and-operational-tools)
12. [Interface, accessibility and Arabic](#12-interface-accessibility-and-arabic)
13. [Architecture and engineering tools](#13-architecture-and-engineering-tools)
14. [Data model and API contracts](#14-data-model-and-api-contracts)
15. [Security, privacy and reliability](#15-security-privacy-and-reliability)
16. [Vercel, GitHub and release operations](#16-vercel-github-and-release-operations)
17. [Delivery roadmap and implementation tickets](#17-delivery-roadmap-and-implementation-tickets)
18. [Acceptance tests and definition of done](#18-acceptance-tests-and-definition-of-done)
19. [Owners, decisions and success measures](#19-owners-decisions-and-success-measures)
20. [Evidence and technical references](#20-evidence-and-technical-references)
21. [System connections and canonical ownership](#21-system-connections-and-canonical-ownership)
22. [Screen and form implementation contracts](#22-screen-and-form-implementation-contracts)
23. [Detailed command and transaction contracts](#23-detailed-command-and-transaction-contracts)
24. [Data invariants, migration and information lifecycle](#24-data-invariants-migration-and-information-lifecycle)
25. [Failure handling and operational handoffs](#25-failure-handling-and-operational-handoffs)
26. [Delivery sizing, cost and decision register](#26-delivery-sizing-cost-and-decision-register)
27. [Traceability and completeness coverage](#27-traceability-and-completeness-coverage)
28. [Build-ready handoff and change control](#28-build-ready-handoff-and-change-control)

## 1. Product decisions and launch scope

### 1.1 What the product includes

| Surface | Main users | Purpose |
| --- | --- | --- |
| Public website | Visitors and members | Prayer times, visiting information, events, programs, donation entry, contact |
| Mobile app | Members, families, volunteers | Daily mosque information, registrations, school, giving, personal commitments |
| Staff console | Authorized staff | Work queues, publishing, enrollment, attendance, finance and operations |
| Mosque display | People in the building | Read-only prayer timetable, Jummah, closures and approved announcements |
| Shared API and delivery jobs | All surfaces | One source of truth, permissions, transactions, notifications and audit |

The public website must remain useful without downloading an app. Public information must remain useful without registering. Account creation is required only when identity is needed for an action. Staff operations use a clearly separated workspace.

### 1.2 Product rules

- Every module has a named operator, an understandable lifecycle, a recovery path and measurable acceptance criteria.
- Show real statuses: submitted, waiting for review, confirmed, canceled, processing, paid or refunded.
- Never fabricate prayer times, donor totals, attendees, receipts or reports.
- Keep English and Arabic, accessibility, truthful errors and private-data protection in the definition of a complete feature.
- One identity can hold multiple responsibilities. Permissions depend on organization, action, resource and relationship.
- Pilot with one mosque organization; support multiple venues inside it. Multi-organization hosting is a separate release gate.
- Prefer complete everyday services over a large menu of unfinished tools.
- No open stranger-to-child messaging, religious scoring, automatic fatwas or automated care/financial eligibility decisions.

### 1.3 Release boundaries

**R0 — Stabilize:** inventory, reproducible builds, deployment safety, authorization, migration strategy, design primitives and observability.

**R1 — Community pilot:** public information, worship, announcements, events with cancellation/waitlist/check-in, volunteering, accounts, staff permissions, support inbox, notification delivery and read-only display.

**R2 — Family and finance:** verified guardianship, school operations, tuition, one-time giving, verified receipts, refund approval, partial-refund accounting and settlement reconciliation. No real-money or private school launch before these domain gates pass.

**R3 — Managed services:** circles, recurring giving, appointments, care intake, rooms and maintenance. Enable each only when its operating team and full workflow are ready.

**R4 — Optional growth:** jobs, proposals, construction updates, resource library, additional integrations and additional organizations.

In R1, school catalogs and giving information may be public, but private enrollment and live checkout remain unavailable until R2 gates pass. Shared resource allocation is an R1 dependency for events and later classes/appointments; the full facilities management and rental product remains R3. One-time giving in the pilot requires a verified member account; guest checkout is a separately reviewed extension.

These are release groups, not calendar promises. A feature can be implemented earlier in test environments; production enablement follows its gate. Existing optional features remain available for engineering evaluation, but are not automatically included in the pilot.

## 2. Current application and gaps

Reviewed the existing specification, README, implementation log, repository tree, package manifests, Prisma schema, authentication, team administration, action route and CI workflow. This was a planning review, not a full security audit or execution of the application.

| Area | Evidence in the repository | Required direction |
| --- | --- | --- |
| Web/API | Next.js 16 declarations in `staff-web/package.json`; versioned routes under `/api/v1` | Keep; extract reusable domain services from large command routes |
| Mobile | Expo 54, React Native 0.81.5, Expo Router declarations; five existing tabs | Keep; reorganize journeys gradually with compatible deep links |
| Database | PostgreSQL/Prisma 5 declarations; 56-model schema and initial SQL migration | Retain; review additive migrations and existing-data backfills |
| Identity | Database sessions, secure cookie, native SecureStore, TOTP and throttling foundations | Complete privileged recovery, fresh step-up, session lifecycle and abuse controls |
| Authorization | Global `User.role`, memberships and four capability kinds; `organization.findFirst()` in auth | Replace implicit organization and global-role authority with explicit scoped policy |
| School | Programs, students, guardian links, enrollment, attendance, assignments, reports and invoices | Finish complete administration, relationship revocation and field-level access |
| Finance | Checkout, signed webhook, receipts/journals and full-refund workflow reported in implementation log | Verify end to end; complete partial refunds, disputes and reconciliation |
| Operations | Events, volunteers, facilities, jobs, proposals, articles and construction records | Complete lifecycle and operator UI before enabling each |
| Notifications | In-app records and leased email outbox foundations | Configure safe delivery; enforce preferences; monitor retries and outcomes |
| Quality | Node tests, disposable PostgreSQL checks, API scripts, types/build and Expo compatibility workflow | Add PR checks, concurrency coverage, browser/native journeys and evidence |
| Documentation | Implementation log contains early gaps followed by later implementation passes | Treat it as history; reconcile feature status against code and test evidence |

**Concrete gaps observed:** the auth helper selects the first organization, privileged capability checks contain an admin bypass, team updates replace one global primary role, and the action route mixes multiple business domains. These are refactoring targets; having a membership table does not establish complete tenant isolation.

**Deployment observation:** Vercel project `masjid-community` reported its latest deployment `dpl_3krJxqb5NT9jUyqsGstgmfTYb4Yj` as ERROR. It references older commit `a1b8d49685b049808010573d3b79c07b6ff0800d`, with failed command `npx prisma db push && npx prisma db seed && npm run build`. This is a historical deployment observation, not a diagnosis of the current commit. Inspect logs and settings during R0; remove schema push/seeding from the deployment build path before a future production build.

## 3. Navigation and primary experiences

### 3.1 Mobile and member web

| Destination | First screen | Deeper tools |
| --- | --- | --- |
| Today | Next published prayer, iqamah, venue, urgent notice | Full timetable, Jummah, directions, Ramadan/Eid, Qibla, upcoming commitments |
| Community | Upcoming events and opportunities | Event registration, circles, volunteer shifts, approved community resources |
| Learn | Programs and family learning overview | Apply, child profiles, class schedule, attendance, assignments, progress, tuition |
| Give & Help | Approved causes and service options | One-time/recurring giving when enabled, receipts, volunteer entry, service request |
| Account | My upcoming actions and account settings | Family relationships, registrations, invoices, notifications, language, security, privacy |

Tab names are proposed bilingual product copy; validate Arabic labels and small-screen fit before implementation. Keep all five main destinations stable. Do not duplicate a module's data because it has more than one entry point.

### 3.2 Staff console

Use a task-oriented home page: overdue approvals, today's classes/events, schedule warnings, reconciliation exceptions and failed delivery jobs. Each item shows owner, next action, age and status.

Authorized navigation: Overview; Worship; Events & Circles; School; Volunteers; Services; Facilities; Finance; Communications; People & Access; Reports; Settings. A user sees only relevant workspaces, but the server always enforces permissions independently.

The teacher sees assigned classes and attendance. The finance officer sees invoices and reconciliation. The worship editor sees schedules and publication drafts. The organization owner sees configuration and access reviews, without automatic access to counseling notes or child records.

### 3.3 Core journeys

| Journey | Complete outcome |
| --- | --- |
| Visitor checks Friday prayers | Correct venue-local sessions and directions, without sign-in |
| Member reserves an event | Confirmed or waitlisted server result, personal history, cancellation and check-in |
| Guardian applies for school | Request tracked through verification, placement, enrollment and invoicing |
| Teacher records attendance | Assigned session only, saved mark, correction reason and guardian visibility policy |
| Donor contributes | Provider-confirmed transaction, private receipt and reconciled accounting |
| Volunteer joins | Application, eligibility review, shift assignment, check-in and completed record |
| Person requests a service | Private acknowledgment, assigned human owner, next step and closure |
| Staff publishes a correction | Reviewed revision, updated public surfaces, notification and audit |
| Staff leaves the mosque | Grants revoked, sessions invalidated, responsibilities reassigned |
| User requests deletion | Identity verified, retention decisions explained, eligible data removed and request closed |

## 4. Roles, permissions and account lifecycle

### 4.1 Role catalog

Roles are editable **permission templates**, not global superuser labels. Specialized roles appear only when the module is enabled. Small teams can assign several templates to one person, except where separation of duties forbids it.

| Role | Scope and working tools | Explicit restrictions |
| --- | --- | --- |
| Guest | Published worship, programs, events and visiting information | No private rosters or account actions |
| Member | Own profile, registrations, volunteering, giving and requests | No other member's records |
| Guardian | Verified linked child's authorized school records and designated billing | A parent label or shared email never establishes a relationship |
| Student | Own enrolled classes, assignments and published feedback | Age/consent policy; no classmates' private records |
| Teacher | Assigned cohorts, attendance, assignments and reports | No unrelated children, custody evidence or donor records |
| School administrator | Assigned programs, class placement, schedules and teacher assignments | Relationship approval requires a separate safeguarding grant |
| Safeguarding officer | Guardian verification, pickup permissions and restricted incident review | No finance or public publishing by default |
| Imam / religious lead | Approved worship/faith content, assigned appointments and learning programs | No automatic finance, custody or care-case access |
| Worship editor | Assigned venue timetable drafts and import preview | High-impact publication requires a separate reviewer |
| Worship reviewer | Review and publish assigned venue revisions | Cannot approve own change when two-person review applies |
| Event / circle coordinator | Assigned activities, registrations, waitlist, check-in and moderation | No organization-wide contact export |
| Volunteer coordinator | Assigned programs, eligibility, shifts and hours | No unrelated care notes or child records |
| Facilities manager | Assigned venues, room allocations, maintenance and equipment | No private appointment narrative |
| Communications editor | Public pages, announcements, translations and approved audience campaigns | Cannot freely export recipients or approve sensitive content alone |
| Care / service coordinator | Explicitly assigned requests or case team | Case access does not come from ordinary staff status |
| Finance preparer | Assigned funds, invoices, reconciliation preparation, refund/expense requests | Cannot approve own request or change provider credentials |
| Finance approver | Assigned financial approvals, limits and exception review | Different actor from preparer; no silent alteration of request amount |
| Organization owner / access administrator | Organization setup, invitations, approved role grants and access reviews | No automatic domain-record access or unilateral self-escalation |
| Board / auditor | Approved aggregate reports and time-limited read-only audit scope | No routine individual donor, child or care-case access |
| Support / privacy officer | Scoped support, identity verification and privacy-request tracking | No impersonation or unrestricted exports by default |
| Platform operator | Infrastructure health and deployment | Business data only through exceptional time-bound, independently approved access |

### 4.2 Permission contract

Represent each assignment with membership, role template, capabilities, scope type, scope ID, issuer, approval reference, effective dates and revocation. Scope types include organization, venue, program, cohort, event, fund and case. Guardianship and enrollment are relationships, not grantable shortcuts.

Example capabilities: `worship.draft`, `worship.publish`, `event.manage`, `event.checkin`, `school.enroll`, `guardian.verify`, `attendance.write`, `invoice.issue`, `refund.request`, `refund.approve`, `care.read`, `roles.assign`, `audit.read`, `privacy.export`.

A private action requires all of: active identity/session, active organization membership, sufficient authentication assurance, applicable capability, matching resource scope, valid relationship where required, allowed workflow transition and no separation-of-duty conflict.

Multiple grants can add allowed actions, but never override suspension, revoked relationships, confidentiality boundaries or self-approval prohibitions. Perform policy checks on reads, lists, searches, exports, files, background jobs and mutations.

### 4.3 High-risk action matrix

| Action | Required authority | Additional guard |
| --- | --- | --- |
| Assign privileged role | Access administrator plus independent privileged reviewer | Fresh MFA; cannot self-approve or delegate beyond approved authority |
| Transfer organization ownership | Existing owner and independent authorized reviewer | Verified new owner, fresh MFA, audit; keep a recoverable owner |
| Approve guardian relationship | Safeguarding verification grant | Evidence reference, reason, effective dates; not the applicant |
| Read child progress | Linked guardian, enrolled student or assigned teacher | Correct organization/cohort and allowed fields |
| Publish prayer change | Venue publication grant | Independent review for material changes; controlled urgent override |
| Refund / reimburse expense | Finance approver in fund/organization scope | Actor differs from requester; amount/limit check; fresh MFA |
| Read care narrative | Assigned case grant | Purpose recorded; owner role alone is insufficient |
| Export people or finance | Explicit export capability | Field minimization, fresh MFA, expiry and audit |
| Emergency support access | Independently approved break-glass grant | Time limit, reason, operator notification and retrospective review |

Urgent closure publication may use a designated emergency grant when a second reviewer is unavailable. Record reason, notify reviewers immediately and require later review. This exception does not authorize self-approved money movement or unrestricted care access.

### 4.4 Account and staff lifecycle

Invitation → verified recipient acceptance → required MFA → approved grants become active → periodic access review → expiration/suspension/revocation. Invitations are single-use, expiring and organization-bound; signup cannot choose a staff role.

Revocation blocks fresh requests immediately, invalidates cached authorization/session state, disables device delivery where appropriate and reassigns pending work. Avoid deleting historical actors from audit records. Recovery must not bypass MFA through ordinary email alone. Define a two-person privileged recovery procedure and test the lost-device scenario.

## 5. Worship and mosque information

**Owner:** religious lead and designated venue editor. **Release:** R1.

Tools: mosque/venue profile, address and accessibility notes, timetable editor, CSV import dry run, missing-day warnings, adhan/iqamah, multiple Jummah sessions, Ramadan timetable, human-approved Eid/moon-sighting notices, emergency closure, print/calendar export, display preview and version history.

Schedule lifecycle: draft → reviewed → scheduled/published → superseded/archived. Keep author, source, local date, timezone, reviewer, revision and publication time. Import/calculation creates drafts; a calculation is not an official mosque decision.

Publication is atomic. Invalidate public caches and display projections, keep previous revisions for audit, and notify affected subscribers after commit. If a schedule is unavailable, show that clearly. Offline data shows its venue, date, revision and freshness; never use yesterday's time as today's.

Qibla is optional and permission-based. Offer manual location selection, distinguish bearing from a live compass heading, handle unavailable sensors and avoid storing location history.

**Acceptance:** a guest sees the correct venue-local day while traveling; a DST change does not shift Jummah incorrectly; missing schedules remain visibly missing; draft data never appears publicly; a corrected timetable propagates to app, website and display.

## 6. Events, circles and volunteering

### 6.1 Events — R1

Tools: event series and sessions, room/time allocation, audience/language/accessibility fields, capacity, registration windows, household attendee selection, waitlist, reminders, cancellation, roster, check-in, attendance correction and exports limited to the organizer's scope.

Event lifecycle: draft → published → registration closed → completed; cancellation is possible with reason and affected-person notification. Each occurrence of a recurring event has its own capacity and attendance.

Reservation lifecycle: requested → confirmed or waitlisted → checked in/completed; cancellation, no-show and offer expiry are explicit. A household registration identifies actual authorized attendees and consumes the correct number of seats without publicly exposing minors.

Reserve the final seat atomically. Repeated taps return the same reservation. Cancellation releases capacity once. Waitlist offers follow a documented order, hold a seat for a configured duration, and expire without overbooking. Changing date, venue or capacity creates a reviewed update; reducing capacity below reservations requires an explicit resolution.

Check-in can use an opaque event-specific QR token or a manual lookup. Do not encode names, birthdays or bearer sessions in QR codes. Staff can correct mistaken check-ins with a reason. Paid events remain disabled until the full payment/refund lifecycle is ready.

### 6.2 Circles — R3

Tools: public summary, joining rules, host approval, membership requests, moderated updates, meeting calendar, report-content action and member removal. States: requested → approved → left/removed; circle: draft → active → paused → archived.

Private membership and rosters are never publicly searchable. No unrestricted private messaging at launch. Youth circles require supervision and guardian policy. Host departure must trigger reassignment or suspension, not an unattended group.

### 6.3 Volunteering — R1

Tools: opportunities, skills and availability, eligibility evidence status, shift capacity, recurring slots, assignment, swap request, check-in/out, hours correction, cancellation and participation letter where supported.

Application: submitted → reviewing → approved/declined/withdrawn. Shift: offered → accepted → checked in → completed, with canceled/no-show alternatives. Eligibility expiration blocks newly assigned protected duties. Reject conflicting shifts; coordinator override requires a documented reason.

**Acceptance:** concurrent registrations cannot exceed capacity; canceled events release rooms and stop reminders; an unassigned coordinator cannot read rosters; a volunteer sees accurate shift status and can withdraw; expired eligibility is enforced server-side.

## 7. School, families and learning

**Owners:** school administrator, teachers and safeguarding officer. **Release:** R2.

### 7.1 Required school tools

- Program catalog with age bands, language, curriculum, term dates, fees, prerequisites and enrollment windows.
- Academic terms, cohorts, session calendar, rooms, teachers, substitute assignments and capacity/waitlists.
- Guardian verification queue; evidence references, relationship dates, consent versions and immediate revocation.
- Child profile with minimum necessary fields; emergency contact and authorized pickup recorded separately from guardianship.
- Enrollment applications, duplicate review, class placement, transfers, withdrawals and term completion.
- Teacher attendance, absence corrections, approved guardian notifications and attendance reports.
- Assignments, private submissions, Quran memorization/recitation progress and teacher feedback; no public rankings.
- Draft/published progress reports with defined guardian/student audiences.
- Tuition issuance, designated payer, discounts/scholarship decisions, invoice history and private receipts.
- Class announcements through moderated, scoped channels; no unmonitored adult-to-child DMs.

### 7.2 Enrollment lifecycle

Draft → submitted → needs information → relationship verified → approved/waitlisted/declined → enrolled → transferred/withdrawn/completed.

Application approval, guardian verification and actual class enrollment are separate decisions. Approval does not automatically activate a student account or charge tuition. An atomic class placement checks capacity, prerequisites and active relationships. Fee generation is idempotent.

Provide age-appropriate student access only after the organization sets consent and account policies. Guardians see only approved child records; being the invoice payer does not automatically grant academic access, and being a guardian does not expose another payer's transaction.

### 7.3 Revocation and classroom operations

A custody or safeguarding concern can temporarily freeze a relationship pending human review. Revoke access across APIs, search, cached private data, exports and pending notifications. Already downloaded copies cannot be remotely guaranteed erased; minimize exports and explain this limitation.

Teachers see only currently assigned cohorts and relevant fields. Substitute grants expire. Attendance corrections keep old/new values and reason. Session cancellation stops reminders and marks attendance not required.

**Acceptance:** two guardians with different authorizations see only their permitted data; revocation takes effect on the next request; a teacher cannot guess another student's ID; duplicate approval does not duplicate enrollment or invoices; private submissions and drafts stay private.

## 8. Giving, tuition and finance

**Owner:** finance lead. **Release:** R2; recurring giving in R3.

### 8.1 Required finance tools

| Tool | Required behavior |
| --- | --- |
| Campaigns and funds | Purpose, restriction, currency, publication approval, optional truthful goal |
| Hosted checkout | Server validates amount/currency/campaign; provider handles payment details |
| Donor account | Own payment history, receipts, privacy preference and recurring management |
| Tuition | Authorized payer, due dates, approved adjustments, payment allocation and balance |
| Receipts | Unique number, verified transaction, organization identity, refund history |
| Refund desk | Request, independent approval, provider submission, pending/failed/confirmed states |
| Reconciliation | Charges, fees, refunds, disputes, payouts, bank confirmation and exception queue |
| Budgets and expenses | Allocation versus actual expense, evidence, maker/checker and payment status |
| Reports | Restricted/unrestricted fund activity, outstanding invoices, reconciliation and export |
| Offline contributions | Authorized recording of cash/check, counted by distinct people, deposit match |

Do not equate a donation goal, budget allocation, payment total, processor balance and bank cash. Public transparency shows approved aggregates with period and definitions, never individual donor or beneficiary details.

### 8.2 Money lifecycle and invariants

Checkout intent → provider pending → paid/failed/expired. Only verified provider events confirm online payment. A checkout redirect remains processing until the server confirms the transaction.

Persist a verified webhook inbox before acknowledging durable acceptance. Deduplicate provider event IDs and business transaction IDs. Verify organization/provider account, source, exact amount and currency. Handle delayed, repeated and out-of-order events through state guards and provider reconciliation.

A confirmed payment creates the payment record, immutable receipt, balanced journal and notification outbox once. Every journal balances within one currency; corrections are new entries, never edits to posted history. Tuition receivable/revenue recognition and payment allocation follow the approved finance policy; the existing donation posting pattern is not automatically correct for all school invoices.

Refund: requested → approved/rejected → submitting → provider pending → confirmed/failed. The approver differs from requester. Partial refunds cannot exceed remaining refundable value. Record each confirmed refund delta once; do not turn a partial refund into a full reversal. Track chargebacks and payout fees independently.

Tuition: draft → issued → partially paid/paid/overdue → adjusted/voided as appropriate. Use credits and approved adjustments after posting; never overwrite a paid invoice to hide a correction. Installments require separate allocation rules and receipts.

### 8.3 Recurring and offline giving

Recurring giving requires explicit amount/frequency/terms, provider-confirmed subscription, cancellation, failed-renewal handling, payment-method update and a separate receipt for each paid installment. Canceling a subscription does not refund past installments.

Cash/check entries are distinct from Stripe payments. Use numbered acknowledgment, dual count/verification, deposit batch and reconciliation. Do not label an unbanked check as a provider-verified online payment.

**Acceptance:** duplicate or reordered webhooks never double-post; amount mismatch is quarantined; preparers cannot approve their own refund; partial/full refund and fee totals reconcile; another member cannot download a receipt; pending payment is never labeled paid. Finance signs off account definitions and receipt wording before real-money enablement.

## 9. Care, appointments and mosque services

**Release:** R3, enabled per service. **Owner:** named service coordinator.

| Service | Member tools | Operator tools and limits |
| --- | --- | --- |
| Imam appointment | Choose service, request slot, reschedule/cancel | Availability, buffers, private assignment, minimal appointment notes |
| New Muslim support | Request contact, preferred language, opt-in follow-up | Mentor assignment, supervised meetings, consent and closure |
| General assistance / zakat request | Minimal private intake, document request, status | Named case team, eligibility review, separate award/payment approval |
| Nikah inquiry | Requirements checklist, appointment request | Human eligibility/document review and coordination; no automatic legal certification |
| Janazah / bereavement coordination | Clear contact route and availability, request tracking | Urgent task checklist, assigned coordinator and verified service contacts |
| Counseling / family support | Confidential request with service limits | Restricted practitioner scope, safe follow-up; not a public support inbox |

Request lifecycle: submitted → triaged → assigned → appointment/action scheduled → awaiting requester/provider → resolved → closed, with declined, withdrawn and escalated alternatives.

Each enabled service needs operating hours, realistic response expectation, backup owner, confidentiality notice and retention rule. Do not imply round-the-clock emergency coverage. A service-request tool is not an automated clinical, religious or legal decision-maker.

Appointment reservations lock a slot atomically, account for buffers and venue timezones, and prevent staff/room conflicts. Notifications say only that an update is available. Exclude narrative text from general search, logs, analytics, board reporting and ordinary email.

Assistance eligibility is a human decision. Finance receives only the minimum approved disbursement instruction; it does not receive the full case file. Care staff do not gain donor access.

**Acceptance:** a general admin cannot open a case without a case grant; canceled appointments free the slot once; unstaffed service intake is unavailable with a clear contact alternative; every accepted request has an owner and visible next step.

## 10. Facilities and community extensions

These modules preserve useful existing concepts while giving each a complete operating model.

| Module | Release | Functional tools | Enablement gate |
| --- | --- | --- | --- |
| Rooms and facilities | R3 | Availability, resource capacity, setup/cleanup buffers, request, approval, cancellation, calendar | Shared event/class/appointment conflict checks; assigned manager |
| Paid rentals | R3 optional | Terms, quote, deposit, payment, refund, handover and damage review | Finance gate plus approved rental policy; no payment before slot policy is satisfied |
| Maintenance / inventory | R3 | Issue reporting, work orders, priority, assignee, equipment and completion evidence | Clear urgent hazard escalation and private attachments |
| Community proposals | R4 | Submit, moderate, discuss through reviewed updates, vote, publish decision | Duplicate/eligibility control; votes are advisory unless a formal policy says otherwise |
| Jobs / opportunities | R4 | Reviewed employer listing, application, private status, withdrawal and closure | Employer verification, consent, resume scanning and retention |
| Construction / projects | R4 | Approved milestone updates, funding links, status and documents | Verified progress and finance-reviewed numbers |
| Resource / sermon library | R4 | Reviewed recordings, transcripts, category search and downloads | Consent, rights, moderation, translation review and storage budget |
| Member directory | R4 optional | Explicit opt-in, selected fields, withdrawal | No children, no default contact exposure, no bulk extraction |
| Multi-organization hosting | R4 separate gate | Organization switch, isolated configuration and tenant administration | Cross-tenant tests, scoped jobs/files/cache, provider-account isolation and audit |

All shared room allocations use one canonical reservation model; a class must not collide with a rental because they use separate tables. Pending requests do not imply a confirmed reservation. Approvals and expiring holds enforce conflicts in database transactions.

## 11. Communication, content and operational tools

### 11.1 Content and notifications

Content tools: drafts, preview, scheduled publication/expiry, revision history, EN/AR translation review, media provenance and audience rules. Authoring and publishing permissions are distinct for material changes. Unpublishing removes the item from public search and caches.

Notification channels: in-app first; transactional email for enabled workflows; push after device registration and receipt handling; SMS only for an explicitly approved need and budget. Keep marketing opt-ins separate from operational messages and respect quiet hours where appropriate.

Commit business change and outbox record in one transaction. A bounded worker leases work, retries with backoff, reclaims expired leases and quarantines exhausted items. Use stable provider idempotency where supported; reconcile uncertain sends before retry. Do not promise exactly-once email delivery across network failures.

Distinguish queued, provider accepted, delivered where provider receipts exist, bounced, suppressed and failed. Recheck active recipient relationship and preferences at delivery time. Deep links always reauthorize.

### 11.2 Staff operational toolkit

| Tool | Required functionality |
| --- | --- |
| Work queues | Owner, due date, priority, status, filters, reassignment and escalation |
| Search | Published public search; permission-filtered staff search; no case/child snippets globally |
| Forms and approvals | Versioned form schemas, required fields, saved drafts, reviewer reason and conflict handling |
| Member management | Verified contacts, membership history, duplicate review, consent and access requests |
| Imports | CSV template, validation, preview/dry run, duplicate mapping, batch audit and rollback strategy |
| Exports | Explicit scope, field selection, row limit, CSV formula protection, expiry and download audit |
| Support inbox | Ticket reference, category, assignee, safe correspondence and closure |
| Integration health | Configured/not configured, last successful check, retry backlog and safe error codes |
| Audit explorer | Actor, scope, target, action, result, time and redacted changes |
| Reports | Defined denominators/date ranges, aggregate permissions, no misleading default zeroes |
| Feature controls | Server-enforced module flags; disabling also blocks writes and scheduled jobs |
| Training / help | Role-specific guidance, contact owner, operational runbooks and searchable help |

Assisted registration for people without a smartphone must record staff actor, member consent and identity verification. Never ask staff to reuse a member's password.

## 12. Interface, accessibility and Arabic

Keep the earlier calm SILA design intent: readable opaque surfaces, restrained accents, clear typography and original assets. Use semantic tokens shared by web and mobile. Avoid a new visual redesign that delays working services.

- One prominent primary action per task; tables for staff work, straightforward cards/lists for members.
- Reusable states: loading, empty, unavailable, offline/stale, unauthorized, invalid, conflict, pending and saved.
- Accessible labels and error summaries; keyboard focus, screen-reader announcements and logical reading order.
- Target WCAG 2.2 AA for web and equivalent practical native accessibility; verify on actual devices.
- At least 44-point iOS and 48-dp Android target areas as project baselines; large text must reflow.
- Light/dark themes, reduced motion, adequate contrast and no essential meaning conveyed only through color.
- Full English/Arabic UI, dates, validation messages and notification templates; human review of authoritative content.
- RTL uses semantic direction. Do not mirror logos, maps, Qibla bearings, photos or digit order.
- Staff can manage translations separately; missing translation is labeled rather than silently invented.
- Respect safe areas, keyboards, back navigation and interrupted forms. Payment/approval success follows server state.
- Public pages have descriptive titles, canonical URLs, accessible visit information and useful error pages.

Before UI implementation, produce validated flows for guest prayer, event RSVP, enrollment, teacher attendance, donation/receipt, refund review and access revocation. Check small phones, desktop, Arabic, large text and slow networks.

## 13. Architecture and engineering tools

### 13.1 Architecture decision

Retain a **modular Next.js backend with PostgreSQL/Prisma and an Expo client**. Keep public, staff and display routes in one web deployment. Domain services implement business rules and authorization; route handlers validate input and translate responses. Jobs call the same domain services.

This explicitly supersedes the prior mandatory NestJS/Fastify, Drizzle and pg-boss rewrite. Those remain possible future decisions only if a measured limitation justifies migration. Neither security nor a clean domain model requires changing frameworks.

### 13.2 Tool decisions

| Need | Selected direction | Status / reason |
| --- | --- | --- |
| Native app | Existing Expo, React Native, Expo Router, SecureStore | Retain; pin compatible versions and test signed builds |
| Public/staff web and API | Existing Next.js App Router + TypeScript | Retain; one server-side business implementation |
| Database/migrations | PostgreSQL + existing Prisma; reviewed SQL where needed | Retain; no ORM migration without an ADR and data rehearsal |
| Validation/contracts | Existing Zod; typed request/response contracts | Retain; generate OpenAPI/client artifacts after compatibility proof |
| Server state | TanStack Query proposed for interactive mobile/web screens | Add when replacing ad hoc fetch behavior; scope keys by actor/org |
| Forms | React Hook Form + Zod proposed for complex forms | Add selectively; server validation remains authoritative |
| Design system | Shared semantic tokens; separate native/web components | Improve existing primitives; no blanket component-library rewrite |
| Identity | Harden existing session/MFA flow behind an auth adapter | Evaluate maintained auth library/provider in R0; do not invent new crypto |
| Payments | Existing Stripe hosted Checkout and server SDK | Complete ledger/reconciliation before live activation |
| Email | Existing Resend delivery adapter | Verify sender, preferences, bounce handling and test delivery |
| Push | Expo Notifications / platform delivery proposed | Device-token lifecycle and native permission tests required |
| Background work | Existing PostgreSQL outbox + authenticated bounded scheduled worker | Keep initially; prove leases, retries and throughput |
| Larger durable workflows | Vercel Workflow or Queues evaluation if required | Optional; verify current availability, pricing and delivery semantics |
| Files | Private object storage adapter; evaluate Vercel Blob or compatible store | Scanning/quarantine and authorized downloads required |
| Testing | Existing Node tests/API scripts; Playwright and Maestro proposed | Add behavioral coverage instead of replacing working tests |
| Monitoring | Structured redacted logs, request IDs, error monitoring and operational metrics | Select provider after cost/privacy review |
| Delivery | GitHub Actions, Vercel web/API, Expo EAS native builds | Independent web and mobile release pipelines |

Version numbers in section 2 describe manifests, not verified installed versions. The inspected tree has no committed dependency lockfiles. R0 must resolve and commit compatible locks, align CI/runtime versions, check advisories and use reproducible installs. Current upstream documentation may describe newer major versions; do not apply its migration commands blindly to the existing Prisma/Expo baseline.

Avoid introducing Redis, a search cluster, separate API framework or a workflow service before the current workload requires it. Public content can begin with bounded PostgreSQL search. Standard calendar export and map deep links need no complex integration.

### 13.3 Repository organization

Keep `staff-web/` and `masjid-mobile/` during delivery. Introduce `staff-web/src/modules/<domain>/` with policy, service, validation and repository boundaries. Introduce shared contracts/tokens/i18n packages only once multiple consumers need them. Preserve `/api/v1` compatibility; retain old action routes as adapters while moving their implementation into modules.

Create ADRs for identity provider choice, file store, background execution and major dependency upgrades. Record alternatives, operational owner, cost drivers, migration impact and proof-of-concept results.

## 14. Data model and API contracts

### 14.1 Existing-to-target model changes

| Existing entities | Target additions / corrections |
| --- | --- |
| User, AuthSession, OrganizationMembership, RoleGrant | Multi-role assignments, resource scope, assurance expiry, invitations and approved delegation |
| Organization, Venue | Explicit organization resolution, venue timezone and module settings |
| PrayerDay, JummahSession, FaithNotice | Publication revisions, reviewer/source and urgent-change history |
| Event, EventRSVP | Occurrences, reservation state/party members, waitlist offers and check-in history |
| SchoolProgram, ClassSection, Student, GuardianLink | Terms, org-owned student scope, relationship evidence/revocation, pickup consent |
| Enrollment, Attendance, SchoolAssignment, StudentReport | Explicit lifecycle, capacity locks, correction versions and publication audiences |
| Donation, SchoolInvoice, RefundRequest | Payment allocations, multiple partial refunds, recurring subscriptions and credit adjustments |
| PaymentEvent, PaymentReceipt, JournalEntry/Line | Durable webhook inbox, reconciliation/settlement/dispute records and posting invariants |
| VolunteerApplication, VolunteerShift | Slots, acceptance, eligibility expiry, conflicts and correction history |
| RentalResource, RentalBooking | Shared resource reservations, hold expiry, buffers and conflict constraints |
| Notification, OutboxEvent, UserPreference | Organization/source scope, purpose/channel consent, device tokens and delivery receipts |
| AuditEvent, DeletionRequest | Scope, redacted diff, outcome, lifecycle completion, retention decisions |
| New optional modules | Circles, service requests/case access, appointment slots, maintenance and media quarantine |

Use existing naming where it avoids unnecessary migrations. This table specifies relationships and invariants, not a command to generate all tables immediately.

### 14.2 Database invariants

- Explicit organization ownership and compatible parent/child relationships; compound constraints where practical.
- Unique active membership/registration/enrollment rules, with history rather than silent overwriting.
- Integer minor-unit money plus currency; balanced posted journals and immutable payment source references.
- Atomic capacity reservation; bounded retries for serialization conflicts; database-enforced room overlap protection where suitable.
- UTC instants for events, separate venue-local civil dates/clock times for prayer schedules.
- Version fields for edits; reject stale approval or update with a conflict response.
- Idempotency records keyed by actor, organization, operation and key; store payload hash and original result. Same key with different payload is a conflict.
- Audit and outbox committed with the business change; external side effects occur after commit.
- Sensitive files are private, scanned and released only after authorization; no permanent public child-document URLs.

### 14.3 API direction

Keep `/api/v1`. Add resource-specific endpoints behind shared domain services; these are planned route families, not an inventory of existing routes.

| Family | Examples | Required policy |
| --- | --- | --- |
| Public | GET /public/home, /public/prayers, /public/events, /public/programs | Published projection, explicit organization/venue |
| Account | GET/PATCH /me; /me/sessions; /me/preferences; /me/privacy-requests | Own account; fresh reauth for sensitive operations |
| Membership/access | /organizations/:id/invitations; /role-assignments | Access-admin scope, delegation rules, audit |
| Worship | /venues/:id/schedules; /publications/:id/approve | Venue editor/reviewer and revision check |
| Events | /events/:id/reservations; /waitlist-offers; /checkins | Own reservation or assigned coordinator |
| School | /enrollments; /guardian-links; /classes/:id/attendance | Relationship, class and field scope |
| Giving | /donations/checkout; /invoices/:id/checkout; /receipts/:id | Donor/payer ownership; validated server amount |
| Finance | /refunds; /settlements; /expenses; /reconciliation | Fund capability, maker/checker and MFA |
| Services | /service-requests; /appointments | Requester ownership or explicit case assignment |
| Facilities | /resources/:id/reservations; /work-orders | Venue capability and conflict enforcement |
| Delivery | /notifications; /devices; internal worker endpoints | Recipient ownership or authenticated service identity |

Use bounded cursor pagination, allowlisted sorting/filtering and stable localized error codes. Typical results: 401 for authentication, 403 for denied action, policy-safe 404 for private objects, 409 for stale/capacity conflict, 422 for invalid input and 429 for throttling. Include request ID and actual durable status. Never leak sensitive payloads into error messages.

Document request/response examples, scope, state transitions, retries and errors for every endpoint. Support released mobile clients during route migration; a web deploy does not update all phones.

## 15. Security, privacy and reliability

### 15.1 Data classification

| Class | Examples | Default treatment |
| --- | --- | --- |
| Public | Published schedule and public event | Cacheable with revision and expiry |
| Personal | Own RSVP and preferences | Owner access; private cache discipline |
| School restricted | Child records and relationship evidence | Verified relationship plus scoped staff access |
| Care confidential | Assistance narrative and counseling request | Named case team; excluded from generic search/analytics |
| Finance sensitive | Donor identity, invoice, refund | Donor/payer or explicit finance permission |
| Secret | Session, MFA, provider credentials | Hash/encrypt as appropriate; never log or expose to client |
| Operational | Audit and security events | Restricted access, redaction and retention |

Configure retention per field/category with an accountable owner; do not invent universal legal retention periods. Deletion workflows distinguish removable data, retained records, anonymization and legal holds, with an actual completed status. Analytics must not infer religiosity or rank worship.

### 15.2 Security implementation

Centralize server policy checks; deny by default. Require fresh MFA for privileged actions. Improve token rotation/session expiry, account enumeration protection, rate limiting and privileged recovery. Protect cookie writes with CSRF/origin controls and restrict CORS. Validate upload content, size and type, quarantine for scanning, and authorize every download.

Private cache identity includes actor, organization and applicable scope; clear it on logout/context change. Permit offline public schedules with freshness labels. Do not queue financial approvals, role grants or care decisions offline. Avoid persistent child/care data on devices by default.

### 15.3 Reliability operations

Track request errors, p95 latency, publication freshness, outbox age, provider failure rate, reconciliation exceptions and crash-free sessions. Use request IDs for support without copying sensitive narratives.

Set provisional targets, validate during the pilot and record actual measurement conditions: public schedule availability 99.9%; critical schedule correction visible within 60 seconds; healthy ordinary API reads p95 under 750 ms; transactional notification queued immediately and provider submission within five minutes at pilot load. These are design targets, not current measurements or guaranteed external delivery.

Agree recovery targets in R0; starting proposals are database RPO 24 hours and RTO four hours, tightened if school/finance operations require it. Restore a backup to an isolated environment and reconcile external provider transactions after recovery. Test key custody/rotation, worker crash recovery and incident communications. Assign primary and backup incident owners.

## 16. Vercel, GitHub and release operations

### 16.1 Deployment plan

Use the existing repository and one selected Vercel project for web/API. The account contains similarly named projects; record the canonical project's ID, repository binding, domain and owner before settings changes. Do not delete duplicate projects without a separate decision.

For the current layout, the proposed root is `staff-web`; the repository build script is `prisma generate && next build`. Verify actual project settings and logs first. Do not run `db push`, destructive reset or seed during deployment builds.

Separate development, preview/staging and production database credentials, payment modes, email recipients, storage and secrets. Preview must never send to real community lists or mutate production. Use synthetic records and test payment accounts.

The current CI uses Node 22 while the inspected Vercel project reports Node 24.x. Choose a supported version compatible with the pinned dependencies and align it across environments after a clean-build test.

### 16.2 Migration and release order

1. Inventory existing databases and migration history; identify whether any data is live.
2. Back up and prove isolated restoration.
3. Rehearse migrations/backfills against a representative sanitized copy.
4. Apply additive changes through a separately controlled migration job using the pinned toolchain.
5. Deploy compatible application code; verify health, authorization and critical flows.
6. Enable the module for the pilot organization; monitor outcomes.
7. Remove obsolete fields/routes only after old mobile-client compatibility and retention requirements are resolved.

The existing initial migration is for empty databases. An existing database needs a reviewed baseline/backfill plan; never replay the empty baseline blindly. Application rollback must remain compatible with the new schema; destructive database rollback is not the routine fallback.

### 16.3 GitHub quality gates

The inspected workflow runs on pushes to development and manual dispatch, not PR events. Add pull-request checks in R0, then protect the agreed release branch with required checks after owner review. Commit lockfiles and use reproducible installs.

Required gates: lint/types, schema/migration checks on disposable PostgreSQL, policy and transaction tests, web build, mobile package compatibility, browser critical journeys, native smoke evidence, dependency/secret scanning and changed-contract review. Treat inventory regex tests as smoke checks, not proof of behavior.

### 16.4 External services and native distribution

Configure production secrets through appropriate environment storage. Audit secret **names and presence**, not their values in logs. Verify public API reachability for mobile, signed payment callbacks and authenticated scheduled workers; deployment protection must not accidentally block intended public endpoints.

Vercel hosts web/API; native builds and signing follow the Expo EAS pipeline with organization-owned Apple/Google accounts. Verify API origin, deep links, bundle identifiers, privacy disclosures, notification permissions and release-channel compatibility separately.

Schedule the bounded outbox worker with authenticated invocations. Validate frequency/limits against the selected Vercel plan; cron invocation alone is not a durable retry system. Add alerting and recovery for missed or overlapping runs.

No project settings, secrets, database records, deployments or app-store releases are changed by this planning document.

## 17. Delivery roadmap and implementation tickets

### 17.1 Work packages

| Package | Release | Deliverable | Dependencies | Exit evidence |
| --- | --- | --- | --- | --- |
| WP-01 | R0 | Reconciled inventory, lockfiles, CI and Vercel build diagnosis | None | Clean install/build evidence; no DB mutation in build |
| WP-02 | R0 | Explicit org context, multi-role grants and central policy | WP-01 | Two-org negative tests and immediate revocation |
| WP-03 | R0 | Session/MFA recovery, privacy foundations and design primitives | WP-01/02 | Lost-device, reauth, EN/AR and accessible form evidence |
| WP-04 | R1 | Worship/public site/display and publication workflow | WP-02/03 | Missing/DST/correction/published-only tests |
| WP-05 | R1 | Events, waitlist, check-in and room allocation | WP-02/03 | Concurrency, cancellation and organizer-scope tests |
| WP-06 | R1 | Volunteer lifecycle and staff queues | WP-02/05 | Eligibility, overlapping shift and completion tests |
| WP-07 | R1 | Delivery preferences, outbox operations and support | WP-02/03 | Retry, consent, delivery and alert drills |
| WP-08 | R1 | Community pilot and operational training | WP-04–07 | Staff/member UAT; restore and rollback drill |
| WP-09 | R2 | Guardian verification and complete school lifecycle | WP-02/03/07 | Child privacy, placement, withdrawal and teacher tests |
| WP-10 | R2 | Finance, partial refunds, reconciliation and tuition | WP-02/03/07; WP-09 for tuition | Provider sandbox reconciliation and finance approval |
| WP-11 | R2 | Family/finance pilot and controlled enablement | WP-09/10 | Approved data migration, limited live reconciliation |
| WP-12 | R3 | Circles, appointments, facilities and optional care | Relevant domain gates | Per-module operator readiness and complete lifecycle |
| WP-13 | R3 | Recurring giving and advanced operations | WP-10/11 | Cancellation, renewal failure and receipt reconciliation |
| WP-14 | R4 | Validated extensions and multi-org readiness | Pilot evidence | Separate business case and isolation acceptance |

Estimate tickets after WP-01 inventory. Report progress by accepted workflow, not screen count or number of endpoints. Parallel implementation is possible only after shared contracts and policies are agreed.

### 17.2 First implementation tickets

| Ticket | Concrete work | Acceptance |
| --- | --- | --- |
| MC-001 | Replace contradictory implementation-history summary with current feature evidence matrix | Each module has state, source files, test evidence and remaining blocker |
| MC-002 | Diagnose failed Vercel deployment and reconcile build/root/runtime settings | Preview build uses no production schema push or seed |
| MC-003 | Resolve dependency compatibility, commit locks and add PR CI | Fresh checkout produces repeatable checks |
| MC-004 | Introduce trusted active organization context and remove first-org lookups from auth | Cross-org ID/header cannot change access |
| MC-005 | Add scoped multi-role assignment model and approved migration from legacy roles | No privilege expansion; dual-role user works; revoke blocks next request |
| MC-006 | Centralize authorization with actor/action/resource policy and negative-test fixtures | Admin label cannot bypass school/care/fund restrictions |
| MC-007 | Complete privileged recovery and fresh MFA/session assurance | Stale assurance, replay, lost-device and suspended user handled |
| MC-008 | Add transaction-safe audit/outbox helper and operator retry queue | Rollback emits no notification; crash/retry has no duplicate business effect |
| MC-009 | Build EN/AR accessible navigation and shared feedback/form primitives | Small-screen, keyboard, large-text and RTL review |
| MC-010 | Add prayer revision/approval/import dry-run and correction propagation | DST/missing/published-only and invalid-import tests |
| MC-011 | Complete event occurrence, waitlist, cancellation and check-in lifecycle | Last-seat concurrency and duplicate cancellation pass |
| MC-012 | Add scoped staff overview, support ownership and notification preference enforcement | Every queue item has owner; ungranted staff see no restricted data |

These are proposed backlog records, not GitHub issues created by this document. Later tickets must include data migration, role policy, API, UI, failure paths, tests and operational owner together.

## 18. Acceptance tests and definition of done

### 18.1 Release-blocking scenarios

| ID | Scenario | Expected result |
| --- | --- | --- |
| AT-01 | Guest opens prayer page on wrong device timezone | Correct venue-local date and source; no login required |
| AT-02 | Schedule missing or expired offline | Honest unavailable/stale state; no invented time |
| AT-03 | Member guesses another org's event/student/receipt ID | No private access or mutation |
| AT-04 | Role expires or membership is suspended mid-session | Next protected request denied; private cache invalidated |
| AT-05 | Admin without school/care grant requests records | Denied despite admin title |
| AT-06 | Two clients reserve last seat concurrently | One confirmation; other waitlisted/full; no overbooking |
| AT-07 | Retry RSVP/cancel/approve after timeout | Same durable result; no duplicate seat, invoice or side effect |
| AT-08 | Teacher requests unassigned class or revoked guardian opens child | Denied in API, export, file and notification paths |
| AT-09 | Duplicate school acceptance or full class | Single enrollment/invoice; no capacity violation |
| AT-10 | Payment redirect arrives before webhook | Processing until verified; no premature receipt |
| AT-11 | Forged/replayed/reordered webhook, amount mismatch | Reject/quarantine or safe replay; no duplicate posting |
| AT-12 | Refund maker approves own request | Denied; valid independent approval still awaits provider outcome |
| AT-13 | Partial refund, dispute, fee and payout | Correct new journal entries and reconciliation exception handling |
| AT-14 | Worker stops after send or before acknowledgment | Recover lease; reconcile uncertain send; business state remains correct |
| AT-15 | Preferences or child relationship revoked before delivery | Ineligible message suppressed; no sensitive payload |
| AT-16 | Simultaneous event/class/rental room booking | Conflict enforced consistently across modules |
| AT-17 | Care request accessed via search/log/export | No unauthorized narrative disclosure |
| AT-18 | Arabic, screen reader, large text, offline and expired login | Core journey remains understandable and recoverable |
| AT-19 | Restore backup and replay provider events | No double posting; missing external events reconciled |
| AT-20 | Old supported mobile client uses updated API | Compatible result or deliberate supported upgrade path |
| AT-21 | Privacy request completes with retention exceptions | Eligible data removed; retained categories and reason explained |
| AT-22 | Preview deployment runs tests | No production data access, real recipients or live charge |

### 18.2 Definition of done

A feature is accepted only when it has: named owner; complete user/operator journey; approved capability/scope rules; reviewed schema/migration; positive and negative tests; concurrency/retry tests where applicable; EN/AR and accessibility evidence; truthful failure states; private-data controls; logs/alerts; recovery runbook; staging UAT; and a controlled rollout/rollback path.

Track status as **planned**, **in progress**, **implemented unverified**, **verified in staging**, **pilot accepted**, or **production enabled**. Do not collapse these into “done.” Compile success is not functional acceptance. Synthetic payment tests are not provider sandbox reconciliation or live settlement proof.

## 19. Owners, decisions and success measures

### 19.1 Decisions to settle during delivery

| Decision | Working assumption | Accountable owner / deadline |
| --- | --- | --- |
| Pilot organization and venues | One mosque; multiple configured venues | Product owner before R1 |
| Public name | Existing mosque identity primary; SILA provisional | Leadership before public brand change |
| Prayer source and emergency authority | Mosque-approved timetable and designated reviewers | Religious lead before worship publication |
| Member enrollment policy | Guest browsing, verified account for personal actions | Community operations before R1 |
| Guardian evidence and student access | Manual verified relationships; no automatic child account | Safeguarding/school leads before R2 |
| Country, currency and payment eligibility | Configure explicitly; do not infer from developer/user location | Finance/leadership before real payments |
| Donations, receipts and accounting | Named finance owner approves restrictions and reconciliation | Finance before R2 |
| Care services and response hours | Disabled until staffed with policy and backup owner | Service lead before R3 |
| Email/push/SMS policy | In-app + verified transactional email first | Communications before R1 |
| Hosting region, retention and recovery | Match actual organization obligations and budget | Operations/privacy owner in R0 |
| Staff approval staffing | At least two eligible people for separated high-risk actions | Leadership before finance/access delegation |
| App store and domain ownership | Organization-owned accounts and recovery contacts | Operations before distribution |

Unresolved decisions block only the affected module; they do not stop implementation of independent public/community features.

### 19.2 Measure outcomes

Measure successful prayer lookup, schedule freshness, registration completion, waitlist resolution, volunteer attendance, enrollment turnaround, unresolved support requests, notification backlog and reconciliation exceptions. Segment only where privacy permits; suppress small-group reporting.

Launch targets: all enabled release-blocking scenarios pass; no unresolved critical/high security defects; every production service has primary/backup owners; every money movement is reconciled or in a reviewed exception queue; no dead primary action; and all critical EN/AR journeys pass human review.

Track operating cost by hosting/database/storage, email/push/SMS, monitoring, payment processing and native builds. Establish monthly budget alerts and per-module cost ownership. No provider price or delivery guarantee is assumed in this plan.

## 20. Evidence and technical references

Repository evidence at the reviewed baseline:

- [README.md](README.md) — current setup and operating caveats.
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — historical passes; not independent proof of completion.
- [Web package manifest](staff-web/package.json), [mobile manifest](masjid-mobile/package.json) and [schema](staff-web/prisma/schema.prisma).
- [Authorization helper](staff-web/src/lib/auth.ts), [team administration](staff-web/src/app/api/v1/admin/team/route.ts) and [shared actions route](staff-web/src/app/api/v1/actions/route.ts).
- [GitHub verification workflow](.github/workflows/verify.yml) and [inventory smoke tests](tests/inventory.test.mjs).
- [Original blueprint at reviewed commit](https://github.com/AnasAbuJamal/masjid-community/blob/27e428a067ce9ea8d31e660c465d7baadeaa5d94/document.md).

Live account evidence: Vercel project and deployment metadata inspected on 27 October 2026; project ID `prj_pZXOEhlv8sCH13f5XLIpMMRhqHae`, deployment ID recorded in section 2. Other similarly named projects were listed but their bindings and runtime state were not fully audited.

Primary technical references checked for this planning revision:

- [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — authenticated scheduling, overlap and reliability considerations.
- [Expo EAS Build](https://docs.expo.dev/build/introduction/) — separate native binary build pipeline.
- [Stripe webhook documentation](https://docs.stripe.com/webhooks) — signed callbacks, retries and event processing.
- [Prisma migration documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) — current documentation redirects to a newer migration workflow; use version-matched guidance for this repository's existing Prisma major.

The plan's product choices, role templates, milestones and service targets are recommendations for this project. They are not certifications, legal conclusions, measured performance claims or evidence that unimplemented features already work.

## 21. System connections and canonical ownership

This section makes the feature catalog operational. A module must not create its own competing person, room, payment, consent or notification record. The owner below controls the record; other modules call its service or consume a versioned event.

### 21.1 Shared records and boundaries

| Canonical owner | Record / responsibility | Consumers | Boundary |
| --- | --- | --- | --- |
| Identity and access | Account, membership, assignment, session assurance | Every private module | Domain modules never grant access by editing a role string |
| People and safeguarding | Person, guardian link, approved pickup contact | School, eligible household registration | Household membership is not proof of guardianship |
| Venue and facilities | Venue, room, availability and resource reservation | Events, school, appointments, rentals, maintenance | One conflict engine; no separate departmental booking truth |
| Worship | Schedule revision and official faith notice | Public, mobile, display, communications | Only published revision is authoritative |
| Events | Occurrence, reservation, waitlist, attendance | Account, communications, facilities, reporting | Attendance is a factual record, not a payment or eligibility decision |
| School | Application, class placement, enrollment and progress | Guardian/student views, finance, communications | School supplies an approved billing obligation; finance owns collection |
| Finance | Invoice, payment, allocation, refund, journal and reconciliation | Giving, tuition, paid events/rentals, reports | No other module can declare money paid or refunded |
| Service/care | Request, appointment purpose and case assignment | Private requester view, facilities, permitted finance instruction | Room calendar receives busy time, not confidential narrative |
| Content and communication | Published content, consent, outbox and delivery | All domain workflows | Notification failure never rolls back a confirmed enrollment/payment |
| Operations and privacy | Support assignment, retention, audit and incident | All modules | Operational access remains scoped; reports are projections |

**Person and household model:** one account can act for itself and for verified relationships. A household groups convenient contacts and participants, but grants no automatic access to another adult, child, invoice or receipt. Invitations require each adult's consent. Suspected duplicates go to a review queue; never merge accounts automatically because names, emails or addresses resemble each other.

**Initial organization context:** during the single-mosque pilot, resolve a configured organization ID and validate it. Reject a different submitted context. Future switching must reauthorize membership and reset private client state. A venue change within an organization must still enforce venue-specific permissions.

### 21.2 Cross-module effects

| Trigger | Atomic authoritative change | Required follow-up | Failure / recovery |
| --- | --- | --- | --- |
| Publish worship correction | New published revision + audit + outbox | Invalidate projections; refresh display; notify affected subscriptions | Refresh rechecks revision; failed fan-out retries without duplicate publication |
| Publish event | Event/occurrence state and confirmed resource allocation | Catalog/search projection and opted-in announcement | Conflict prevents publication; no notice for failed publication |
| Cancel event occurrence | Canceled occurrence, reservation transitions and resource release | Stop reminders; inform attendees; create eligible refund review items | Retry per recipient/payment; cancellation stays true even if notification/refund is pending |
| Change event time/venue | Versioned change and new resource allocation | Cancel stale reminders; notify participants; offer cancellation per policy | If new room conflicts, retain old allocation; never leave half-moved event |
| Accept enrollment application | Decision and relationship evidence reference | Class placement queue | Acceptance is not a seat, invoice, charge or login |
| Place student in class | Enrollment + capacity claim + allocation reference | Generate approved invoice obligation and class notice once | Invoice failure goes to billing exception queue; enrollment status does not lie about payment |
| Withdraw or transfer student | Enrollment end/transfer, seat release and revised class authorization | Cancel future reminders; review tuition credit/refund under policy | Never delete attendance/history or automatically refund all tuition |
| Revoke guardian relationship | Effective revocation + authorization version + audit | Suppress ineligible future delivery; expire grants/downloads; review payer continuity | Outstanding invoices remain; staff assigns lawful payer access separately |
| Approve volunteer shift | Eligibility and capacity checks + assignment | Reserve resources if needed; enqueue reminders | Expired eligibility prevents protected duty; coordinator gets action item |
| Disable staff membership | Grants/session access revoked; ownership-transfer tasks | Reassign teaching, cases, approvals and delivery exceptions | Service-owned reconciliation continues; revoked actor cannot execute a queued privileged command |
| Approve refund | Versioned decision tied to amount/source + audit/outbox | Provider submission and reconciliation | Worker acts on still-valid organizational approval, not a reusable staff session |
| Receive confirmed payment | Verified inbox processed + payment/allocation/journal/receipt | Notify payer; update invoice balance and approved aggregates | Projection failure retries; ledger is not duplicated |
| Cancel appointment | Appointment state + resource release | Stop reminders; private acknowledgment | No care narrative in general calendar |
| Disable a module | Block new intake/writes except approved wind-down commands | Resolve existing obligations; notify operators | Never strand refunds, active enrollments, case follow-up or retention obligations |
| Complete privacy request | Approved erasure/anonymization with retained references | Expire exports; apply deletion manifest to restored backups | Preserve required accounting/audit continuity; explain exceptions |

**Dependency rule:** a module cannot be enabled until its required connections pass integration tests. “Screen works” does not satisfy a workflow whose billing, room allocation, access revocation or cancellation effects are incomplete.

### 21.3 Event and job contract

An internal event contains `eventId`, `eventType`, `schemaVersion`, `organizationId`, `aggregateType`, `aggregateId`, `aggregateVersion`, `occurredAt`, `correlationId`, and a minimal payload or protected reference. Do not put raw child/care narratives in job payloads.

Consumers keep a unique processed key of consumer plus event ID, record attempts/outcome, and tolerate out-of-order delivery. A projection ignores older versions; commands re-read the authoritative state. Transactions use the same database for authoritative changes and outbox insertion. No network call is held inside a long database transaction.

Distinguish two job classes:

1. **Acting for a person:** exports, privileged commands and audience sends recheck current authority and consent before execution.
2. **Completing an organizational obligation:** payment reconciliation, already-authorized provider operations and retention tasks use a restricted service identity. Staff departure does not cancel the obligation; canceled/revoked approvals still prevent unsubmitted execution.

An operator can inspect, retry, suppress or resolve a failed job only with the appropriate domain permission. Replaying a job never bypasses current invariants.

## 22. Screen and form implementation contracts

These screen families cover the required routes without duplicating the same form for every entry point. Each actual route must be registered under one family with a named owner and acceptance test before its ticket is accepted.

### 22.1 Shared screen contract

Every form defines required/optional fields, data type, permitted values, validation, maximum input/file size, source of defaults, sensitivity and retention. Every action defines capability, target record, expected state/version, idempotency, visible outcome and recovery.

Shared behavior:

- Show current organization/venue where relevant and the record's real status.
- Preserve valid input after validation/network failure; prevent accidental double submission without treating a disabled button as server idempotency.
- On stale version, show a comparison and require a fresh decision; never silently overwrite a review.
- Public screens may cache published projections; private screens use authorization-aware queries and no shared public cache.
- Provide an accessible empty state, retry, back/cancel, field-level errors, loading and confirmation.
- A timeout means outcome unknown until status lookup succeeds; it does not mean payment/registration failed.
- For sensitive forms, server-side drafts are preferred. Local drafts require explicit sensitivity review, encryption where necessary and expiry.
- Display money with currency, dates with venue timezone, and publication timestamps with source context.
- Sensitive access denial does not reveal another person's identity or whether a guessed record exists.

### 22.2 Screen registry

| ID | Screen / actors | Required content and inputs | Actions and functional result |
| --- | --- | --- | --- |
| SC-01 | Public home / guest | Venue, local date, published next prayer, urgent notice, visit information | Change venue, view prayers, directions; no compulsory account |
| SC-02 | Prayer/day calendar / guest | Date, venue, adhan/iqamah/Jummah, source/revision, freshness | Browse dates, accessible print/export, report incorrect information |
| SC-03 | Catalog / guest/member | Type, date range, venue, language, audience, accessibility, publication state | Filter/search and open actual record; no private roster snippets |
| SC-04 | Event detail/reservation / member | Occurrence, capacity status, permitted participants, terms version, optional accommodation request | Reserve, join/leave waitlist, accept offer, cancel; show confirmation ID and actual state |
| SC-05 | Personal commitments / member | Events, shifts, classes and appointments as permission-filtered projections | Open source record, cancel/reschedule when permitted; no duplicate editable calendar copy |
| SC-06 | Sign-in/recovery/MFA / account holder | Verified contact, password or selected provider, challenge/recovery flow | Register, verify, authenticate, recover, challenge; generic account-existence responses |
| SC-07 | Account/security/preferences / member | Profile, language, own devices, channel/purpose consent and policy versions | Save, revoke session, change verified contact, request export/deletion |
| SC-08 | Staff dashboard / scoped staff | Assigned queues, due times, blocked items, domain health | Claim/reassign within scope, open source record; no all-data dashboard shortcut |
| SC-09 | Staff invitation/grant / access administrator | Verified recipient, template, scope, capability list, effective/expiry dates, reason | Submit approval, accept invite, approve/revoke assignment; show effective permissions |
| SC-10 | Worship editor/reviewer | Venue/local dates, times, source, revision diff, reason and import row errors | Save draft, preview, request review, publish/urgent override; audit final revision |
| SC-11 | Event editor/check-in / coordinator | Series/occurrence, duration, venue/resources, audience, capacity, registration cutoff, cancellation policy | Publish/change/cancel, review waitlist, scan opaque token/manual lookup, correct attendance |
| SC-12 | Volunteer application/shift / member/coordinator | Opportunity, availability, minimal eligibility fields, slot and status | Apply, review, assign/accept/swap/withdraw, check in/out, correct hours |
| SC-13 | School catalog/application / guardian | Program, term, child minimum profile, relationship request, consent, optional approved accommodation fields | Save/submit application, provide requested evidence, withdraw; no automatic enrollment |
| SC-14 | Guardian verification / safeguarding officer | Applicant, child, evidence reference, permitted access, effective dates and reason | Verify/decline/freeze/revoke; require another authorized reviewer for own family |
| SC-15 | School management / school administrator | Terms, cohorts, teachers/substitutes, room/calendar, capacity and placement requests | Create sessions, assign teacher, place/waitlist/transfer/withdraw; reject conflicts |
| SC-16 | Teacher classroom / assigned teacher | Current session, roster field subset, attendance states, assignments and drafts | Mark/correct attendance, publish task/report, review private submissions |
| SC-17 | Family/student learning / guardian/student | Authorized timetable, attendance, published reports/tasks and own submissions | Submit work, read feedback, open authorized invoice; no other payer transaction exposure |
| SC-18 | Giving/checkout / verified member in pilot | Campaign/fund, exact amount/currency, one-time/recurring if enabled, terms, optional public anonymity | Start hosted checkout, poll status, open receipt; never accept arbitrary client fund totals |
| SC-19 | Invoice/receipt / authorized payer | Number, obligation/allocations, amounts, currency, due date, credits, payment/refund history | Pay outstanding amount, download authorized receipt, request correction |
| SC-20 | Finance workbench / finance staff | Funds, invoices, expenses, refund amount/source, evidence, journal and exceptions | Prepare/approve within limits, reconcile, export; lock approved request against mutation |
| SC-21 | Service request/appointment / requester | Service scope/hours, safe contact preference, minimal description, consent and requested slot | Submit, track, supply requested information, reschedule/withdraw; generic notifications |
| SC-22 | Care/service desk / assigned coordinator | Named owner, permitted case details, appointment and follow-up dates, decision reasons | Assign/restrict/review/escalate/close; no automatic clinical/religious/eligibility decision |
| SC-23 | Resource/maintenance / facilities staff | Resource, time/buffer, availability, maintenance priority and safe evidence | Approve/cancel booking, block resource, assign/complete work order |
| SC-24 | Content/campaign / communications editor | Locale, title/body, audience, consent purpose, publish/expiry times, revision, approved media | Preview, request review, publish/unpublish, send approved campaign; recipient count preview |
| SC-25 | Delivery/support/audit / authorized operator | Source reference, status, attempts, request ID, responsible owner, redacted history | Retry/resolve under domain policy; no raw secrets or private payload dumps |
| SC-26 | Circle/community extension / authorized actor | Module-specific published summary, submission/request status and moderation rules | Join, review, report, withdraw/archive; audited eligibility and visibility |
| SC-27 | Reports/import/export / scoped staff | Dataset, scope, period, fields, purpose, batch checksum and preview errors | Dry run, apply reviewed batch, generate expiring export, reconcile totals |
| SC-28 | Setup/health/feature settings / owner/operator | Verified organization/venue, locale, timezone, policy versions, integration state and module gates | Configure/review, test safely, enable or wind down; never show raw secret values |
| SC-29 | Read-only display / public | Venue, current published schedule, approved notices, source and last refresh | Automatic bounded refresh, stale/unavailable state; no privileged controls or private records |

Detailed copy and visual layout may evolve through testing. Fields that change ownership, scope, money, consent or state are contract changes and need domain review.

### 22.3 Form policy defaults

Implementation starting limits, subject to explicit module review: public search 2–100 characters; standard title 1–160; ordinary description up to 5,000; page size 20 with maximum 100; timezone from a validated IANA list. Do not apply arbitrary free-text limits to uploaded evidence without an approved upload policy.

Email change requires verification of the new address, current-session reauthentication and notification to the old address. Prevent role or guardian changes through profile editing. Account deletion, financial approval and relationship revocation require a review screen with consequences and an explicit action label.

Avoid collecting date of birth when an age band is enough. Emergency contacts, accessibility needs and pickup permissions have separate purpose and access rules. Attachments are optional unless a documented service policy requires them.

## 23. Detailed command and transaction contracts

Section 14 lists route families. This section specifies the common command semantics and critical operations. The paths are proposed additions under `/api/v1`; existing clients use compatibility adapters until migration is verified.

### 23.1 Common wire contract

Authentication comes from the verified web session or native token, never a submitted actor ID. An explicit organization route/header is a requested context that the server validates, not proof of authority.

Mutations accept `Idempotency-Key` for retryable create/transition operations and `expectedVersion` for edits/decisions. The server stores the key, request hash and result in the same transaction as the change. A duplicate key with changed intent returns `IDEMPOTENCY_CONFLICT`. Reads by operation ID let a client resolve a timeout.

Success envelope: `{ data, meta: { requestId, operationId?, version? } }`. Error envelope: `{ error: { code, fieldErrors?, retryable, requestId } }`. Stable codes are translated by clients; sensitive evidence is never echoed. Codes include `AUTH_REQUIRED`, `ASSURANCE_REQUIRED`, `SCOPE_DENIED`, `STALE_VERSION`, `CAPACITY_FULL`, `RESOURCE_CONFLICT`, `POLICY_NOT_CONFIGURED`, `DEPENDENCY_UNAVAILABLE` and `OPERATION_PENDING`.

A committed command returns its actual state. External work can return accepted/pending with an operation ID. All private operation-status lookups enforce ownership or domain permission.

### 23.2 Critical command catalog

| ID / command | Required input beyond authenticated context | Transaction and result | Conflict / failure rule |
| --- | --- | --- | --- |
| CMD-01 POST /events/:id/reservations | occurrenceId, authorized participant IDs, termsVersion | Lock occurrence; validate audience and window; create confirmed or waitlisted reservation; audit/outbox | Full without waitlist returns CAPACITY_FULL; no partial party booking unless user explicitly chose it |
| CMD-02 POST /reservations/:id/cancel | expectedVersion, optional reasonCode | Own reservation; release occupied seat once; cancel reminder version; emit waitlist job | Already canceled returns existing result; deadline/policy can require review |
| CMD-03 POST /waitlist-offers/:id/accept | expectedVersion | Validate owner and unexpired held capacity; convert hold to confirmed reservation | Expired offer never steals another reservation; return current waitlist state |
| CMD-04 POST /events/:id/change | expectedVersion, permitted field patch, reason | Validate policy and new resource allocation; update revision atomically | Stale edit/conflict leaves previous event and room intact |
| CMD-05 POST /publications/:id/approve | expectedVersion, decision, reason | Compare immutable draft hash, reviewer scope and distinct author where required | Any later edit invalidates approval |
| CMD-06 POST /enrollment-applications | programId, child/new profile reference, relationship request, consentVersion | Minimal application and acknowledgment; dedupe repeated submission | Does not create active guardian, class placement, invoice or student login |
| CMD-07 POST /guardian-links/:id/decision | expectedVersion, decision, evidenceRef, permittedAccess, effectiveDates, reason | Authorized independent verifier; relationship state + policy version + audit | Own-family approval denied; conflicting custody information goes to manual review |
| CMD-08 POST /classes/:id/enrollments | applicationId, studentId, expectedClassVersion, effectiveDate, feePolicyVersion | Validate verified relationship, capacity and eligibility; enrollment and unique billing obligation | Duplicate placement returns existing enrollment; invoice issuance handled idempotently from obligation |
| CMD-09 PUT /sessions/:id/attendance/:studentId | expectedVersion if updating, status, correctionReason if changed | Assigned teacher/session/enrollment check; mark with append-only correction history | Closed session or stale mark needs authorized correction workflow |
| CMD-10 POST /invoices/:id/checkout | expectedVersion, selected allowed payment amount | Check payer, balance and active payment attempt; create immutable intent | Concurrent/replayed attempts cannot intentionally collect more than outstanding balance; overpayment goes to reconciliation |
| CMD-11 POST /donations/checkout | campaignId, amountMinor, currency, frequency, termsVersion, anonymousPublicly | Validate published cause, org/provider account and limits; persist intent; submit to provider idempotently | Provider timeout returns pending, not permission to charge again |
| CMD-12 POST /refunds | paymentId, amountMinor, reason, evidenceRef if required | Validate refundable amount; create immutable review request | Reserve pending refund amount so concurrent requests cannot exceed balance |
| CMD-13 POST /refunds/:id/approve | expectedVersion, decision, reason | Distinct authorized checker, amount limits, fresh MFA; freeze reviewed payload and create submission job | Edited request requires new approval; unclear provider result enters reconciliation |
| CMD-14 POST /role-assignments | recipientMembershipId, template/capabilities, scope, validity, reason | Validate delegation ceiling and independent approval policy; pending assignment | Creator cannot approve own elevation; no implicit administrator bypass |
| CMD-15 POST /service-requests | enabledServiceId, consentVersion, safeContactPreference, minimal intake | Restricted request and owner queue reference; generic acknowledgment | Unstaffed/disabled service returns unavailable without accepting sensitive narrative |
| CMD-16 POST /appointments | serviceRequestId, slotId, expectedSlotVersion | Check requester/case access and capacity; reserve slot and room in transaction | Conflict preserves request and offers safe alternatives |
| CMD-17 POST /privacy-requests/:id/complete | expectedVersion, reviewed action manifest, retention exceptions, reason | Validate identity and approved scope; apply erasure/anonymization; retain completion evidence | Incomplete downstream deletion remains in progress; no false completion |
| CMD-18 POST /imports/:id/apply | reviewedChecksum, mappingVersion, expectedVersion | Apply validated batch with stable source keys and audit; bounded chunks if large | Changed file/mapping invalidates approval; resume from recorded checkpoint |
| CMD-19 POST /events/:id/cancel | expectedVersion, occurrence scope, reason, policyVersion | Cancel selected occurrence(s), release resources/capacity, invalidate reminders, create refund-review obligations | Pending refund is visible separately; cancellation is not rolled back by provider outage |
| CMD-20 POST /memberships/:id/suspend | expectedVersion, reason, reassignment plan | Suspend access, revoke sessions/grants, record handover work | Organizational obligations keep service-owned processing; unexecuted actor commands reauthorize |

### 23.3 Transaction examples

**Last-seat reservation:** lock occurrence capacity and participant constraints → check idempotency result → validate current state/window → allocate entire requested party or waitlist → insert reservation/audit/outbox → commit. Use bounded retries for serialization conflicts. Do not count a pending payment as a paid event booking; paid event holds have an explicit expiry and verified-payment transition.

**Enrollment and billing:** placement transaction creates enrollment and a uniquely keyed billing obligation. Finance consumes it to issue at most one invoice for enrollment, term and fee-policy version. School can display enrolled/awaiting payment only if that is an approved policy; “payment required before attendance” requires an explicit conditional enrollment state and grace period.

**Provider callback:** verify signature and configured account → durably store inbox row → process under payment lock → validate amount/currency/source → apply permitted transition and unique journal/receipt → commit → acknowledge or schedule durable processing. Out-of-order unknown sources enter an exception queue. A duplicate event is safe; a conflicting event is not silently ignored.

### 23.4 Approval records

Every review binds to target ID, target version/hash, request amount/scope where relevant, requester, reviewer, assurance level/time, decision, reason and timestamp. A role revocation prevents new approvals; an already committed organizational decision remains attributable to its historical actor.

For a pending approval edited by its author, invalidate the decision and request review again. For a queued provider submission, cancellation is allowed only before an irreversible provider request; later reversal follows the financial lifecycle. There is no “undo” that merely changes a local paid/refunded flag.

## 24. Data invariants, migration and information lifecycle

### 24.1 Logical relationship contract

This is the target relationship model. Physical schema changes must be generated from the pinned toolchain and reviewed against real data; a planning document cannot safely invent production migration SQL.

| Record | Required key/relationship | Integrity rule |
| --- | --- | --- |
| Membership | organization + account unique | Suspension denies grants without deleting history |
| Role assignment | membership + template + resource scope + validity | Scope belongs to the same organization; approval references immutable |
| Household participant | household + person + consent/relationship reference | Grouping alone grants no private data access |
| Student | organization + local student number | Shared account identity never silently merges two organizations' school records |
| Guardian relationship | guardian + student + access category + effective interval | Explicit evidence/decision; revocation supersedes otherwise valid dates |
| Occurrence | parent event/class/service + start/end + timezone | Explicit canceled/version state; recurrence expands to bounded instances |
| Resource reservation | resource + half-open interval + state + source reference | Active holds/confirmed intervals cannot overlap; cleanup buffers included |
| Event reservation | occurrence + participant + status/history | No duplicate active participant; party seat count matches child rows |
| Waitlist offer | waitlist entry + seat hold + expiry | Held capacity counted once; promotion has stable order and idempotency |
| Enrollment | student + class + term + effective interval | One active placement where policy requires; capacity claim atomic |
| Billing obligation | source enrollment/booking + period + policy version | Unique issuance key; approved adjustments create new obligations/credits |
| Invoice allocation | invoice + payment/credit + amount/currency | Sum cannot silently exceed collectible balance; overpayment is explicit |
| Provider inbox | configured account + provider event ID | Immutable received event/hash; processed outcome recorded separately |
| Payment | provider account + transaction ID | One canonical money movement, independent of notification replay |
| Refund | payment + request ID + provider refund ID when known | Confirmed plus reserved pending amount bounded by refundable balance |
| Journal | source transaction/event + posting purpose | Unique posting; debit equals credit per currency; no delete/update of posted lines |
| Resource attachment | org + owner record + storage key + scan state | Only clean released object can be downloaded; purpose/scope rechecked |
| Delivery | source event + recipient + channel + template version | Stable retry identity; suppression and uncertain-send state explicit |
| Work item | source record + action type + workflow version | One active operational task per source/action, linked to authoritative state |
| Privacy action | request + category/source + decision + result | Completion requires all required actions done or documented retained exception |

### 24.2 Time, money and state edge cases

Resource intervals use [start, end): back-to-back bookings are permitted only after setup/cleanup buffers. Recurring schedules retain the intended local time and timezone, with explicit handling of ambiguous/nonexistent DST instants. Changing one occurrence does not rewrite past occurrences or all future dates silently.

For money, use the currency's actual minor-unit exponent; do not assume every currency has two decimals. Pilot supports one configured operating currency. No foreign-exchange conversion until separately designed. Validate safe integer bounds or use a suitable database/serialization type for larger sums.

Invoice state is calculated from issued amount, credits, allocations and refunds under an approved accounting policy. Payment refund is not automatically an invoice void, enrollment withdrawal or event cancellation. Revenue/receivable recognition and scholarship treatment require finance review; the existing clearing/revenue example is not a complete tuition accounting policy.

Use explicit enums/transitions for new workflows. Historical corrections preserve source, reason and actor. Deleted/archived parents cannot leave active children, future reminders or orphaned permissions.

### 24.3 Migration sequence from the current code

1. Inventory all global-role checks and first-organization lookups; record route, policy, data scope and corresponding test.
2. Add organization ownership and scoped assignments without removing legacy columns. Produce a reviewed mapping from each current user to approved memberships/grants; ambiguous ownership is quarantined.
3. Backfill in bounded, restartable batches with source checksum and before/after counts. Compare old and new authorization decisions in a non-authorizing shadow check.
4. Switch reads/writes per module only after negative tests pass. Prevent dual-write drift; one service owns both compatibility mapping and authoritative policy.
5. Reconcile counts, balances, foreign keys, session revocation and membership coverage. Do not grant broad access merely to make a backfill pass.
6. Cut over with a rollback-compatible application release. Remove legacy authority only after all consumers and supported mobile clients no longer depend on it.
7. Preserve the old schema/history as required, then retire with an explicit migration and recovery plan.

R0 deliverables include database inventory, backup evidence, migration ownership, rollout order and a go/no-go report. The current empty-database baseline must not be treated as a migration for populated deployments.

### 24.4 Files, exports, retention and restoration

Uploads require allowlisted content, verified type rather than extension alone, per-file/account quotas, quarantine, malware scan, encrypted storage and a named owning record. Disable active content where feasible; sanitize displayed content; never render untrusted HTML as trusted mosque content. Failed/abandoned uploads expire.

Private download URLs are short-lived and are not a substitute for authorization at issuance. Extremely sensitive files can require authenticated streaming rather than reusable links. Revocation cannot erase copies someone has already saved.

Exports record scope, requester, reauthentication, purpose, fields, expiry and download audit. Sanitize spreadsheet formula prefixes. Search indexes, analytics, outboxes, storage objects and backup restoration are included in privacy decisions.

Restore procedures replay a separately retained deletion/suppression manifest before restored data becomes user-accessible. Financial provider reconciliation can recover some external transactions, but cannot recover lost guardian changes, consent or internal records. Therefore the provisional 24-hour RPO in section 15 is acceptable only for an approved low-risk pilot; R2 requires tighter recovery targets appropriate to those records, demonstrated by the selected database backup/PITR capability. A backup is not evidence of recoverability until restoration has been tested.

## 25. Failure handling and operational handoffs

### 25.1 Failure matrix

| Failure | User experience | Operator action and durable recovery |
| --- | --- | --- |
| Database unavailable | Public last-known approved schedule marked stale; private writes unavailable | Alert; restore service; never queue unverified financial/role approvals locally |
| Identity/email provider unavailable | Generic retry; existing valid sessions follow policy | Monitor backlog; do not bypass verification or privileged recovery |
| Payment provider timeout | Processing/unknown outcome with operation reference | Lookup original idempotent operation; reconcile before retrying charge/refund |
| Duplicate/out-of-order webhook | No duplicate receipt or status regression | Inbox replay under state guards; exception queue for unexplained transitions |
| Worker crash after sending | Generic notification may be pending | Reconcile provider message if possible; track uncertainty and duplicate risk |
| Display loses connectivity | Last update/source/date visible; outdated-day warning | Remote health signal when available; on-site fallback timetable |
| Resource becomes unusable | Affected event/class/appointment marked needs review | Facilities blocks new bookings; domain owners relocate/cancel and notify |
| Teacher/host/case owner leaves | Relevant activity shows reassignment needed | Access revoked immediately; backup operator receives handover queue |
| Guardian relationship contested | Restricted data temporarily unavailable with safe explanation | Safeguarding human review; no automated restoration from old cache |
| Incorrect prayer publication | Clear corrected revision | Urgent publishing procedure, propagation verification and incident record |
| Email bounce/push token invalid | In-app record remains accessible | Suppress invalid channel, request contact update; do not claim user read message |
| Import partially completes | Batch shows partial/checkpointed status | Resume idempotently or apply approved compensating changes; never reimport blindly |
| Capacity or finance imbalance | Action paused, truthful pending/review state | Reconcile source records; correction with audit, not direct silent edits |
| Suspected account compromise | Sessions restricted/revoked; verified recovery path | Incident triage, evidence preservation, scoped notification and key/token actions |
| Module retirement | New intake closed; existing status/history still available where required | Finish obligations, exports and retention; deactivate integrations last |

### 25.2 Escalation rules

Each work item has source reference, owner/team, due time, sensitivity, status and escalation path. Suggested operational targets are planning defaults, not promises: critical schedule/service outage immediately alerts the on-call owner; finance exceptions reviewed each operating day; enrollment/support queues reviewed on published business days. Care response targets are set only by the actual staffed program.

If an owner is absent, assign the named backup. If no safe operator exists, stop accepting that service. An organization cannot enable a module solely by setting a feature flag; its checklist must include policy version, primary/backup owners, required integration health and acceptance evidence.

High-risk actions require independent people, not merely two roles on the same account. If two eligible people are unavailable, the action stays blocked and escalates; do not add a generic bypass.

### 25.3 Initial setup and ownership recovery

The initial organization owner is established through a controlled bootstrap with verified organizational authority and recorded handover. This one-time setup is distinct from ordinary in-app role delegation, which follows independent approval. Remove or disable bootstrap capability in production.

Ownership transfer verifies the incoming owner, preserves at least one recoverable responsible owner and requires an independent approved reviewer. Loss of all owners uses documented exceptional recovery with organizational proof and two-person operational review, not a self-service “become admin” endpoint.

## 26. Delivery sizing, cost and decision register

### 26.1 Staffing and planning envelope

These are rough effort estimates for planning, not delivery commitments. They assume the existing code is reusable, one mosque, English/Arabic, no payroll/full enterprise accounting, no custom payment processor and timely operator decisions. WP-01 must replace them with ticket-level estimates based on actual defects.

| Release group | Indicative engineering/QA effort | Required expertise |
| --- | --- | --- |
| R0 foundations | 6–10 person-weeks | Backend/security, frontend/native, infrastructure and QA |
| R1 complete community pilot | 10–16 person-weeks | Product engineering, design/localization, QA and mosque operations |
| R2 school and finance | 14–24 person-weeks | Backend transactions, native/web, safeguarding/finance SMEs and QA |
| R3 managed services | 8–16 person-weeks | Scheduling, workflow/privacy and relevant service operators |
| R4 optional extensions | Estimate individually after demand validation | Depends on selected module; multi-org is a separate substantial effort |

Person-weeks are work effort, not calendar weeks. For example, two engineers do not automatically halve delivery time because integration, reviews and staff acceptance are sequential constraints. Add explicit contingency after the inventory; do not advertise these ranges as a launch date.

A practical delivery team needs a named product/operations owner, backend lead, web/mobile lead, QA owner and part-time design/localization support; security, finance and safeguarding reviewers participate at gates. One person may perform several jobs, but reviewer independence for high-risk decisions must remain.

### 26.2 Cost model without invented provider prices

Before selecting a paid plan, obtain current vendor quotes for the target region and usage. Track monthly base hosting/database/backup, compute/egress, private file storage/scanning, email/SMS volume, monitoring, native builds, domain/app-store charges and payment processing. Record one-time implementation/training and ongoing support separately.

Budget calculation: fixed subscriptions + measured usage units × verified unit prices + external transaction fees + support allowance. Build a pilot and 10× load case using actual expected members, peak Friday/Ramadan reads, registrations, file size/retention and message frequency. Set alerts at agreed fractions of the approved budget; alerts must not unexpectedly disable essential worship information or reconciliation.

No purchase, vendor subscription or infrastructure change is authorized merely by inclusion in this plan.

### 26.3 Decision register

The following unknowns are tracked as explicit delivery work. “Not decided” is a visible state, not permission to invent a policy.

| ID | Decision / default recommendation | Owner | Blocks | Evidence to close |
| --- | --- | --- | --- | --- |
| DEC-01 | Pilot org/venues, contacts, timezone, legal identity | Leadership | R1 setup | Verified configuration and named owners |
| DEC-02 | Prayer authority, publication and emergency policy | Religious lead | Worship publication | Approved source/reviewer/correction procedure |
| DEC-03 | Membership, household and participant eligibility | Community lead | Registrations | Versioned terms and actor rules |
| DEC-04 | Guardian evidence, pickup, student age/consent policy | Safeguarding/school | Private school | Approved relationship and revocation procedure |
| DEC-05 | Fee policy, attendance conditional on payment, scholarships | School/finance | Tuition/enrollment coupling | Versioned fee and placement rules |
| DEC-06 | Funds, receipts, recognition, refunds, chargebacks, limits | Finance | Real money | Accounting map and reconciled sandbox cases |
| DEC-07 | Service staffing, scope, response and case retention | Service/privacy leads | Care/appointments | Named primary/backup and reviewed intake |
| DEC-08 | Role delegation, initial owner and emergency recovery | Leadership/security | Privileged access | Bootstrap/recovery test and approval map |
| DEC-09 | Auth provider/library versus hardened existing adapter | Engineering/security | R0 security exit | Threat review and native/web/recovery proof |
| DEC-10 | Data geography, per-category retention, RPO/RTO | Privacy/operations | Production and R2 | Approved policy, provider capability and restore evidence |
| DEC-11 | File store, scanning, quotas, private delivery | Engineering/privacy | Attachments | Scan/revocation/failure tests and cost estimate |
| DEC-12 | Canonical Vercel project, runtime and isolated environments | Operations | Preview/production delivery | Verified binding/settings, clean build, isolation tests |
| DEC-13 | Notification categories, consent and critical exceptions | Communications/privacy | Outbound delivery | Approved templates/preferences and delivery tests |
| DEC-14 | Native signing, domains, deep links and supported clients | Operations/mobile lead | Native distribution | Ownership proof and signed device acceptance |
| DEC-15 | Schedule, staffing and operating budget | Product/leadership | Release commitment | Ticket estimates, availability, quote-based budget |
| DEC-16 | Optional module demand and wind-down policy | Relevant domain owner | R3/R4 enablement | Operator checklist and measurable need |

Every decision record stores owner, status, due milestone, chosen option, rationale, evidence and affected requirements. Revisit affected tests when a policy changes. A required unresolved decision blocks its module's readiness assessment.

## 27. Traceability and completeness coverage

### 27.1 Requirement coverage register

Each requirement connects a journey to screens, server contracts or domain rules, canonical records, owner, release and tests. Existing AT-01–AT-22 remain in force; AT-23–AT-40 below cover the added connections.

| Requirement | Scope / release | Screens | Contract or rule | Owner | Acceptance |
| --- | --- | --- | --- | --- | --- |
| REQ-01 | Public worship / R1 | SC-01, SC-02, SC-10, SC-29 | CMD-05; publication revision | Religious lead | AT-01, AT-02, AT-23 |
| REQ-02 | Identity/access / R0 | SC-06, SC-07, SC-09, SC-28 | CMD-14, CMD-20; section 4 | Access/security lead | AT-03, AT-04, AT-05, AT-32 |
| REQ-03 | Events / R1 | SC-03, SC-04, SC-05, SC-11 | CMD-01–04, CMD-19 | Community lead | AT-06, AT-07, AT-24, AT-25 |
| REQ-04 | Volunteer service / R1 | SC-05, SC-08, SC-12 | Section 6.3; shift capacity/eligibility | Volunteer lead | AT-04, AT-26 |
| REQ-05 | School/families / R2 | SC-13–17 | CMD-06–09; student/relationship scope | School/safeguarding leads | AT-08, AT-09, AT-27, AT-28 |
| REQ-06 | Giving/tuition / R2 | SC-18–20 | CMD-10–13; finance invariants | Finance lead | AT-10–13, AT-29 |
| REQ-07 | Recurring/offline giving / R3 | SC-18–20 | Section 8.3; separate subscription/deposit lifecycle | Finance lead | AT-30 |
| REQ-08 | Care/services / R3 | SC-21, SC-22 | CMD-15, CMD-16; restricted case access | Service lead | AT-17, AT-31 |
| REQ-09 | Facilities / core R1, full R3 | SC-11, SC-15, SC-21, SC-23 | Shared resource reservation, section 24 | Facilities lead | AT-16, AT-25, AT-31 |
| REQ-10 | Content/communications / R1 | SC-03, SC-24, SC-25 | Section 11; event/delivery contract | Communications lead | AT-14, AT-15, AT-23, AT-33 |
| REQ-11 | Account/privacy / R1, expanded with modules | SC-07, SC-25, SC-27 | CMD-17; deletion/retention manifest | Privacy lead | AT-21, AT-28, AT-34 |
| REQ-12 | Support/audit/operations / R1 | SC-08, SC-25, SC-28 | Work-item ownership and section 25 | Operations lead | AT-19, AT-32, AT-35 |
| REQ-13 | Imports/exports/files / as needed by release | SC-13, SC-20, SC-23, SC-27 | CMD-18; section 24.4 | Data/privacy owner | AT-34, AT-36 |
| REQ-14 | EN/AR and accessible design / all releases | SC-01–29 | Section 12 and shared screen contract | Design/localization/QA | AT-18 |
| REQ-15 | Delivery/migration/API compatibility / R0 onward | SC-28 | Sections 16, 23 and 24.3 | Engineering/operations | AT-19, AT-20, AT-22, AT-37 |
| REQ-16 | Circles / R3 | SC-03, SC-05, SC-26 | Section 6.2; moderated membership | Community lead | AT-38 |
| REQ-17 | Jobs/proposals/resources/projects / R4 | SC-03, SC-24, SC-26 | Section 10; separate moderation/lifecycle | Respective module owner | AT-39 |
| REQ-18 | Multi-organization / R4 gate | SC-07, SC-09, SC-28 | Tenant isolation across all canonical owners | Security/platform lead | AT-03, AT-40 |
| REQ-19 | Feature retirement and obligations / every enabled module | SC-08, SC-25, SC-28 | Section 21.2 wind-down rules | Product/domain owner | AT-35 |

### 27.2 Additional release-blocking scenarios

| ID | Scenario | Required result |
| --- | --- | --- |
| AT-23 | Approved content changes, expires or is unpublished | Public/search/display projections converge to correct revision; old scheduled sends suppressed |
| AT-24 | Event canceled after RSVPs, room hold and reminders exist | Seats/resources released exactly once; future reminders stopped; eligible refund-review obligations tracked |
| AT-25 | Event moved while a class claims the target room; DST recurring occurrence | One valid allocation wins; old room retained on failed move; local time and buffers correct |
| AT-26 | Volunteer eligibility expires; coordinator leaves; shift overlaps | Protected assignment blocked/reviewed, backup assigned, overlap rejected and history preserved |
| AT-27 | Application accepted but placement/billing not finished | UI distinguishes all stages; no premature seat, invoice, charge or student login |
| AT-28 | Guardian revoked while export/delivery is pending, invoice outstanding | Private access and ineligible work stop; payer continuity reviewed without child-data shortcut |
| AT-29 | Concurrent refunds, invoice payments, stale financial approval | No intentional excess allocation/refund; edited approval invalidated; unknown provider outcome reconciled |
| AT-30 | Recurring cancellation races renewal; check not yet banked | Past/new provider-confirmed movements recorded accurately; no invented refund/settlement |
| AT-31 | Private appointment uses public room calendar; service unstaffed | Busy interval only exposed; conflict enforced; new confidential intake unavailable |
| AT-32 | Owner bootstrap, privilege recovery, reassignment and expired MFA | Controlled initial authority; independent recovery; no self-elevation or stale assurance bypass |
| AT-33 | Marketing opt-out, transactional need, invalid device and worker retry | Category policy respected; in-app fallback; stale/private content absent from notifications |
| AT-34 | Export URL reused after expiry; malicious file; deleted record restored | Download denied, upload quarantined, deletion manifest reapplied before user access |
| AT-35 | Module disabled with active cases, pending refund and failed delivery | New intake stops; existing obligations retain responsible service processing and owner |
| AT-36 | Changed import after approval, partial run, duplicate source row | Checksum rejects stale approval; safe resume; no duplicate person/enrollment/payment |
| AT-37 | Legacy-role migration produces ambiguous scope or old-client mismatch | Ambiguous records quarantined; no broad grant; backward compatibility or gated upgrade |
| AT-38 | Circle host departs, member removed, youth content reported | Reassign/pause, revoke private view, audited moderation and safeguarding escalation |
| AT-39 | Optional job/proposal/directory/project content closes or is withdrawn | Private applicant/opt-in data removed from discovery; audit/history and lawful retention preserved |
| AT-40 | Same IDs/roles across two orgs in API, jobs, files and caches | No cross-tenant access, grant inheritance, delivery or provider-account mix-up |

These scenarios specify required behavior; they are not statements that tests currently exist or pass. Each implementation ticket links concrete test files/results before its requirement is accepted.

### 27.3 Completeness review method

At each release review, start with a user action and follow it through screen → authorization → command → database → external side effect → notification → report → support/recovery. Check happy path, denied access, timeout, duplicate, concurrency, cancellation, correction, staff departure and retention.

A requirement is incomplete if it lacks an owner, source record, policy, failure recovery, acceptance evidence or operating procedure. A screen without a requirement is an orphan. A requirement without a route/command or an explicit manual operating step is not build-ready. A pending decision must appear in DEC-01–DEC-16 or a newly registered decision.

Do not use a percentage that averages away child privacy, financial integrity or access-control blockers. Report readiness by requirement and release, with links to evidence.

## 28. Build-ready handoff and change control

### 28.1 Required implementation packet per module

Before coding a module, its ticket packet contains:

1. Requirement IDs and release, named product/engineering/operating owners.
2. Screen-family mapping, exact route list, field dictionary and bilingual copy.
3. Actor/action/resource policy and negative-test matrix.
4. State transition table including forbidden transitions, expiry and correction.
5. Request/response schemas, examples, errors, idempotency and version rules.
6. Physical schema diff, constraints/indexes, existing-data migration and rollback compatibility.
7. Internal events and consumer effects, retry/reconciliation, sensitive-data exclusions.
8. Provider configuration and sandbox validation if relevant; approved policy/version references.
9. Automated tests, manual device/accessibility/operator checks and evidence location.
10. Monitoring, backup/recovery implications, support runbook, rollout and wind-down plan.

Sections 21–27 supply shared contracts and core examples. Exact migration SQL, exhaustive OpenAPI schemas and final screen copy must be produced against the implemented version in those packets. They must not be guessed or silently skipped. This plan is the integrated specification and gate system, not a claim that those engineering artifacts already exist.

### 28.2 Change control

Every change to a capability, shared record, policy, financial amount, state transition or release boundary lists affected requirements, screens, API clients, jobs, tests and documentation. Use an ADR for architectural/provider changes and a versioned policy record for operating rules.

A newly proposed feature either maps to an existing requirement and lifecycle or receives a new requirement, owner, dependencies and acceptance tests. Do not append a standalone menu item without its backend and operating model.

Breaking changes keep a supported client window, explicit deprecation and measured usage check. Do not remove an API because the current web client no longer calls it. Large data changes require rehearsal and domain sign-off before production execution.

### 28.3 Review findings resolved in this revision

- Clarified that shared room allocation is an R1 foundation, while full facilities/rentals is an R3 product.
- Separated public school/giving information from gated private enrollment and live checkout.
- Connected event cancellation/time changes to capacity, rooms, reminders and refund obligations.
- Separated application acceptance, guardian verification, class placement, billing and payment.
- Connected staff/guardian revocation to files, jobs, notifications and handover without abandoning organizational financial obligations.
- Bound approvals to immutable request versions and added explicit setup/ownership recovery.
- Added person/household boundaries, fee-policy dependencies, partial/import recovery and module retirement.
- Added screen/command contracts, canonical record ownership, decision tracking, staffing/cost model and requirement-to-test traceability.
- Tightened recovery expectations for school/finance and restoration of previously deleted data.

**Readiness statement:** this revision addresses the identified planning gaps and makes outstanding decisions and implementation artifacts trackable. No responsible plan can guarantee that discovery, real users or implementation will reveal no additional requirements. Release readiness requires the evidence above, not a promise that the document is infallible.

# Masjid Community / SILA — Complete App Plan

**Edition:** 2.0 · 27 October 2026  
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

A confirmed payment creates the payment record, immutable receipt, balanced journal and notification outbox once. Every journal balances within one currency; corrections are new entries, never edits to posted history.

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

Set provisional targets, validate during the pilot: public schedule availability 99.9%; critical schedule correction visible within 60 seconds; healthy ordinary API reads p95 under 750 ms; transactional notification queued immediately and provider submission within five minutes at pilot load. These are design targets, not current measurements or guaranteed external delivery.

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

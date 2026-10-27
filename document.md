# MASJID COMMUNITY — COMPLETE PRODUCT, ENGINEERING & DESIGN BLUEPRINT

**File:** `document.md`  
**Status:** Proposed target architecture and delivery specification — **not a statement that the current code is fully implemented or production-ready**  
**Date:** 2026-10-26 (America/New_York)  
**Canonical Git branch:** `development` (the only active branch)  
**Products:** Community mobile app (iOS/Android), staff/admin web portal, responsive public web and kiosk/TV display  
**Current technical baseline:** Expo SDK 54 / React Native / Expo Router, Next.js 16, React, TypeScript, PostgreSQL, Prisma 5, Stripe and existing provider integrations  
**Product identity:** Masjid Al-Momineen / Masjid Community (final public branding and trademark ownership subject to owner approval)

> **Primary objective:** Create one trustworthy, beautiful, fast, maintainable mosque and community operating platform, where every visible control has a real purpose, every role sees only authorized information, and every financial or private action is auditable. The mobile app must feel **modern, luxurious, calm, welcoming and original**—inspired by high-quality human-interface principles, never by copying Apple's proprietary screens or assets.
>
> **Critical rule:** This document is the specification. Nothing in it should be presented as “already working” solely because a screen or an endpoint exists. Production releases require the verification gates in Sections 24–29.

---

## 1. Executive vision and product boundaries

### 1.1 What the platform must accomplish

A member should be able to open the app and, in seconds, discover **verified** prayer and Jummah times, upcoming events, mosque announcements, relevant programs, and a clear way to participate. A parent should see only their linked children, academic progress and real invoices. A teacher should manage only classes assigned to their authenticated account. Operations staff should execute workflows with scoped access. Administrators should manage the mosque without switching between conflicting systems.

The application contains one coherent platform with these functional areas:

1. **Faith & worship:** mosque-local Salah, iqamah, Jummah, prayer calendar, Qibla, Ramadan/Eid announcements and opt-in reminders.
2. **Community:** news, announcements, events/RSVPs, volunteers, projects, proposals, voting, contact, newsletters and notifications.
3. **Education:** classes/programs, enrollment, parent–student links, teacher assignments, attendance, homework, grades/reports, resources and tuition.
4. **Giving & finance:** one-time/recurring donations, Zakat/Sadaqah campaign labeling, invoices, refunds, verified receipts, financial reports, budgets and restricted finance administration.
5. **Opportunities & facilities:** jobs, worker profiles, applications, room/equipment rental, booking approvals, construction progress and resource scheduling.
6. **Operations:** CRM, queues, tasks, assignments, staff approval workflows, media/content publishing, audit logs, health/observability and kiosk operations.
7. **Identity & safety:** registration, verified ownership, permissions, multi-factor authentication for privileged users, notifications, consent, account lifecycle, secure records and deletion/export procedures.

### 1.2 Design and engineering principles

- **Truth over decoration:** No demo prayer times presented as real; no fabricated balances, grades, attendance, registrations, or completed payments.
- **A single source of truth:** PostgreSQL holds authoritative records. The server computes authorization and financial state; clients render them.
- **Smallest necessary permission:** A role alone is not enough for access to a child, class, donation, facility, or confidential note; verify the resource relationship.
- **One design language:** iOS, Android and web share tokens, accessibility rules, component semantics and content standards, adapted to platform conventions.
- **Fast by design:** Quick entry to Salah and announcements, progressive disclosure, cached public views, responsive navigation and background task queues.
- **Modular rather than fragmented:** Begin with a well-organized modular monolith; split services only when independently measured needs justify it.
- **Operationally safe:** Reproducible migrations, encrypted secrets, backups, observability, tested rollbacks and verified provider configurations.
- **Faithful to the community:** Respect correct prayer data, Jummah details, local scheduling, Arabic and English, RTL, diverse abilities and family privacy.

### 1.3 Explicit non-goals for the first full release

Do not build an unmoderated social network, real-time private messaging between minors and adults, speculative AI religious rulings, a bank/financial ledger replacing accounting professionals, or uncontrolled cross-mosque sharing. Quran library, guided learning, native watch apps, and advanced predictive analytics may be future optional modules **only if** content sources, safety, maintenance and user needs are established.

### 1.4 Measurable product outcomes (proposed targets)

| Measure | Goal | Measurement |
|---|---|---|
| Prayer-time trust | 100% published cards show a source and effective mosque-local date | Content/API and device tests |
| Primary mobile tasks | User reaches Salah, events and donation entry within 2 taps from main navigation | Task usability tests |
| Interaction completeness | 0 production controls without a verified action, disabled reason or intentional navigation | Screen-by-screen acceptance inventory |
| Accessibility | WCAG 2.2 AA for the web, platform accessibility testing on native mobile | Automated + VoiceOver/TalkBack |
| Auth isolation | 0 known cross-user/parent/teacher/tenant object-access defects | Negative integration tests |
| Stability | ≥99.9% measured availability target for key public reads after launch | Synthetic checks and telemetry |
| Performance | p95 key API reads <400 ms server-side under agreed staging load; mobile launch measured on low-end devices | Load and performance suite |
| Financial reconciliation | Every completed charge linked to a verified provider event and reconciled ledger entries | Daily reconciliation report |
| Release | Required CI, migration rehearsal, device QA and privacy review pass | Signed release checklist |

Targets are goals, not claims of current performance.

## 2. Audited starting point: what currently exists

The repository at `AnasAbuJamal/masjid-community` contains `masjid-mobile/`, `staff-web/`, Prisma schema/migrations, tests and deployment workflows. Its consolidated branch is `development`. The following summarizes the **observed code**, not independently confirmed production behavior.

| Area | Existing implementation | Required redesign or verification |
|---|---|---|
| Mobile | Expo Router, React Native screens, React Native Paper, gradients and custom glass components | Unified tokens, better information architecture, reusable accessibility-tested controls, full interaction QA |
| Web | Next.js staff dashboard, Radix-based controls, role-sensitive sidebar | Consistent admin workflows, scoped permissions, form feedback, responsive data tables and approval states |
| Roles | `admin`, `teacher`, `staff`, `member`, `student` in Prisma | Scoped, composable grants; explicit parent/guardian relationships; separation of duties |
| Accounts | Email/password, email verification, web sessions, signed mobile token | Native secure token storage, refresh/revocation plan, privileged MFA and session management |
| School | Class, Student, Attendance, Assignment, StudentReport, SchoolInvoice | Verified guardian and student-account links; class teacher assignment; privacy-safe histories and migrations |
| Finance | Donation, FinancialExpense, FinancialBudget, SchoolInvoice, Stripe flows | Integer minor-unit money, event idempotency, reconciliation, immutable adjustments |
| Worship | PrayerTime records, daily/public endpoints, Qibla and calendar screens | Source metadata, mosque-local date/time handling, adhan-vs-iqamah separation and reliable freshness |
| Content/operations | Events, proposals/votes, jobs, volunteers, rentals, kiosk, blog, notifications, CRM | Stable contracts, transaction-safe capacity controls, moderation, async jobs, end-to-end tests |

**Known technical risks to prioritize:** The current mobile API client stores a bearer token using `AsyncStorage`; this should be replaced with appropriate protected storage. Several existing financial fields use floating-point values; new monetary data should use integer minor units. Some parent relationships depend on email matching rather than a verified explicit foreign key. Prayer dates can be vulnerable to server timezone ambiguity. Current audit documentation also calls out historic exposed secrets, unresolved production migrations, incomplete live provider verification, placeholder areas and missing native-device QA. These must be investigated and resolved, not assumed fixed.

**Repository compatibility rule:** This blueprint does not instruct engineers to overwrite existing data or drop tables. Establish a mapped, tested migration path from today's schema.

## 3. System boundaries and platform architecture

### 3.1 Recommended top-level system

```text
                     MEMBERS / GUESTS / PARENTS / STUDENTS
                       iOS / Android / accessible web
                                      |
                            HTTPS, versioned APIs
                                      |
         +----------------------------+--------------------------+
         |            Next.js API / BFF + Domain Services       |
         | Identity | Worship | School | Community | Finance    |
         | Facilities | Volunteers | CRM | Content | Admin     |
         +----------------------------+--------------------------+
             |               |                 |             |
         PostgreSQL       Job queue      Object storage   Providers
         + Prisma         + outbox        (signed URLs)   Stripe/email/
         transactions     + worker                        push/maps
             |
      Backups / audit / retention / reconciliation
             ^
             |
      STAFF + ADMIN WEB (Next.js)              KIOSK (read-only feed)
```

**Architecture decision:** Keep `staff-web` as the server and admin host for the initial modernization. Organize it into separate *domain modules*, not many microservices. Add a properly authenticated worker for asynchronous email, reminders, search indexing, exports, image transforms and payment reconciliation. Keep the kiosk API read-only and specifically scoped to published content.

### 3.2 Suggested repository structure (target, not immediate directory rename)

```text
/
  document.md
  apps/
    mobile/              # Expo Router app, screens + mobile composition
    admin/               # Next.js App Router staff/admin UI
    worker/              # Background job consumers/schedulers
  packages/
    contracts/           # Zod schemas, OpenAPI types, error codes
    domain/              # Pure business rules and policy logic
    design-tokens/       # Semantic palette/spacing/type/motion
    ui-native/           # Native reusable primitives
    ui-web/              # Web reusable primitives
    config/              # TS, lint, tooling conventions
  infra/
    database/            # Prisma, reviewed migrations, seed fixtures
    monitoring/          # Dashboards/alerts
    deployment/          # Environment configuration templates
  docs/
    architecture/        # ADRs, sequence diagrams, runbooks
    product/             # Stories, IA, accessibility, content rules
    security/            # Threat model, data flow, incident playbooks
```

**Migration policy:** Introduce workspaces progressively. Do not move the app directories until all imports, EAS roots, Vercel roots, build commands, scripts and GitHub Actions have been updated and verified together.

### 3.3 Internal layers for every domain

1. **Transport layer:** Next.js API routes parse input, authenticate, invoke the domain, map result to HTTP.
2. **Authorization layer:** Actor, permission grants, organization, child/class/resource ownership; deny by default.
3. **Application layer:** Business use cases, validation, workflow transitions and idempotency orchestration.
4. **Domain layer:** Value objects and pure rules (time slots, capacity, enrollment, money, invoice status).
5. **Persistence layer:** Prisma transactions, safe query builders, pagination, unique constraints and tenant scope.
6. **Integration layer:** Stripe/email/push/object storage behind adapters, no direct provider calls from UI.
7. **Event layer:** Transactional outbox rows trigger eventual notifications/exports; audit events are separate.
8. **Observability layer:** Structured events, request correlation, redacted logs and service metrics.

Never call Prisma or a secret-backed provider from the native app. Only the server accepts and verifies payment webhooks. API routes should be thin; UI components should never contain permission decisions or business calculations as the source of truth.

## 4. Organizations, identities, roles, scopes and ownership

### 4.1 Identity model

**User ≠ Person ≠ Role ≠ School Student.** A single human may simultaneously be a parent, volunteer, donor, teacher and member. The future `PersonProfile` holds basic personal information. `UserAccount` holds login/security state. `OrganizationMembership` connects a person to the mosque. `RoleGrant` grants scoped privileges. `StudentProfile` represents a child/student, whether or not that child has a login. `GuardianLink` connects an adult account to a student through an explicitly approved, verifiable relationship.

**Default:** A newly registered verified adult account receives `member` only. Self-registration must never elevate to `staff`, `teacher`, `finance` or `admin`. An organization may run a single mosque today but every private data record should be prepared for an explicit `organizationId` and strict isolation.

### 4.2 Proposed roles and scopes

| Role/capability | Who grants it | Primary responsibilities | Must NOT permit |
|---|---|---|---|
| Guest | Public (no account) | View published Salah, public events, blog, approved jobs, contact | Private records, voting or privileged writing |
| Member | Verified self-signup | Own profile, RSVPs, donations, eligible opportunities, proposals, jobs | Other users' data or admin approvals |
| Guardian / Parent | Verified link approved by school | Linked child's attendance, invoices, reports and applications | Unlinked child/teacher data |
| Student | School-linked account issued/approved under age policy | Own attendance, class assignments, resources, achievements | School roster or other students' records |
| Teacher | School manager/admin, class scoped | Own classes, lesson assignments, attendance and reports | Unassigned class records or billing controls |
| Imam / Worship editor | Owner/admin, domain scoped | Review/publish worship content, mosque calendar and announcements | Finance administration unless separately granted |
| Staff / Content editor | Admin, functional scope | Publish designated content, events, permitted community tasks | Finance, role granting and protected school info by default |
| Volunteer coordinator | Admin, domain scoped | Opportunities, application review, capacity and shifts | Donor payment details |
| Facilities manager | Admin, domain scoped | Assets, rental approvals, maintenance and conflicts | Student records or finance exports |
| Finance officer | Owner/admin with privileged MFA | Payments, budgets, expense review, reconciliation | Grant admin roles; approve own high-risk adjustments |
| School administrator | Owner/admin, domain scoped | Student enrollment, guardian links, teacher assignment, invoices | Global security and payment secret management |
| Auditor (read-only) | Owner/admin | Authorized audit and reconciliation visibility | Change records or reveal unnecessary PII |
| Organization admin | Verified owner delegation | Manage staff, policies, domains, publication and operational access | Bypass immutable audit/history |
| Platform operator | Deployment-level break-glass | Infrastructure maintenance with documented access | Routine browsing of family/member records |

The **existing five Prisma enum values remain the starting migration mapping**, not an instruction to delete them immediately. Introduce composable `RoleGrant` and feature permissions while supporting existing records. Additional personas are **scoped permissions**, not necessarily a new hard-coded single-role enum.

### 4.3 Scope dimensions

- `organization:{id}` — owning mosque.
- `class:{id}` — only assigned teacher/roster.
- `student:{id}` — own account or verified guardian link.
- `resource:{id}` — donation, invoice, job application, rental booking, proposal.
- `workflow:{module}` — approve/publish/refund/export permissions.
- `time-bound` — temporary delegated roles expire automatically.

### 4.4 Canonical permission matrix

Symbols: **R** read, **C** create, **U** update, **A** approve/publish, **X** sensitive/restricted, **—** denied. Resource scope always applies.

| Capability | Guest | Member | Guardian | Student | Teacher | School admin | Finance | Mosque admin |
|---|---|---|---|---|---|---|---|---|
| Published worship/content | R | R | R | R | R | R | R | R/C/U/A |
| Personal profile/consents | — | R/U own | R/U own | R/U safe fields | R/U own | R/U own | R/U own | R/U own |
| Own donations/receipts | — | R/C own | R/C own | Policy-based | R/C own | R/C own | R/C own | R/C own |
| All payments/reconciliation | — | — | — | — | — | — | R/C/U/X | R/X with separation |
| School classes | Public approved | Public approved | Linked R | Enrolled R | Assigned R/C/U | R/C/U/A | — | R/C/U/A |
| Attendance/report cards | — | — | Linked R | Own R | Assigned R/C/U | R/C/U/A | — | Delegated R/X |
| Guardian/student links | — | — | Request only | — | — | R/C/U/A | — | Delegated R/A |
| Enrollment | Public description | Apply | Apply/track linked | Policy-based | Assigned R | R/C/U/A | Invoices only | Delegated |
| Events/RSVPs | Public R | Own C/U | Own C/U | Policy-based | Assigned manage | Scoped manage | — | All |
| Volunteers/jobs/proposals | Public R | Own C/U | Own C/U | Age-policy | Scoped review | Scoped | — | All |
| Rental bookings | Public R | Own C/U | Own C/U | Age-policy | — | — | Reconcile fees | All |
| User role assignments | — | — | — | — | — | School-only teacher link | — | Owner-delegated A |
| Audit logs / exports | — | — | — | — | — | Relevant own domain | Finance subset | Privileged R/X |

**Mandatory policy tests:** Deny a teacher changing the URL to another class; deny a guardian viewing a child linked only by a matching email address; deny an admin export unless export scope and MFA are valid; deny a staff member modifying an invoice; deny a deleted/suspended account immediately, even with a previously issued token.

### 4.5 How roles connect

```text
UserAccount -> PersonProfile -> OrganizationMembership -> RoleGrant[]
             |
             +-> GuardianLink[] --(approved)--> StudentProfile
             |
             +-> StudentAccountLink -------> StudentProfile
             |
             +-> TeacherAssignment[] -----> ClassSection[] ----> Enrollment[] --> StudentProfile
             |
             +-> Donation[] / EventRSVP[] / VolunteerApplication[]
             |
             +-> JobApplication[] / Proposal[] / RentalBooking[]
             |
             +-> AuditEvent[] / Notification[] / DeviceSession[]
```

A staff user acting as a guardian sees **separate, clearly labeled contexts** in the mobile app. Selecting a context changes the navigation and policies only after the server authorizes that context. Never imply that being an employee grants access to one's child's school records without a guardian link.

## 5. End-to-end user journeys and business rules

Each journey must specify the actor, preconditions, displayed states, server decision, persisted records, notifications and audit logs.

1. **Guest opens app:** Splash → choose language → public Home → today's *published* mosque-local prayer data → published event detail → account requested only when action truly needs identity. Failure shows “Schedule not published” rather than a hardcoded time.
2. **New member onboarding:** Register → validate input → email verification → secure mobile session → notification/privacy choices → Home. Re-verification needed after email change; do not promise successful mail delivery before provider success.
3. **Member donates:** Campaign → choose amount/frequency/anonymity → hosted Stripe confirmation → pending receipt state → verified webhook → completed Donation/Payment → immutable receipt and opt-in acknowledgment. Client redirect alone never marks it paid.
4. **Parent enrollment:** Verified guardian account → create application → school reviews → accept/decline with reason → create StudentProfile and approved GuardianLink → enroll in authorized class → issue invoice if appropriate.
5. **Teacher class management:** Admin links a verified teacher account to a class → teacher sees assigned roster only → publishes assignment → records attendance per scheduled session → submits reports → guardian and student views update after policy checks.
6. **Student learning:** Verified student login (age policy) → own assigned classes and resources → own assignments/attendance/progress only; no other child's profile in list suggestions, notifications or API responses.
7. **Event participation:** Published event → details/accessibility/location/capacity → RSVP under an approved identity → capacity transactional reservation → cancel/change before cutoff → organizers see bounded roster. RSVP is not a check-in.
8. **Volunteer participation:** Opportunity → eligibility/age/requirements → application → coordinator approval with capacity check → shift assignment/check-in → completion. No oversubscription from simultaneous approvals.
9. **Community proposal:** Submit with budget/items/attachments → validation → moderation → published eligible voting → one counted vote per authorized identity → status updates → budget/progress audit.
10. **Job opportunity:** Job application submitted by authenticated owner → private history → employer/moderator review with consent → state change. Resume files are private and expire/retain per policy.
11. **Facility booking:** Resource availability → requested start/end and timezone → quote → reservation lock → admin approval → payment as needed → conflict-safe confirmed booking → cancellation/refund.
12. **Admin publishing:** Draft → review → publish or schedule → versioned announcement/event/prayer schedule → cache invalidate → optional user-selected notifications → audit old/new state.
13. **Finance reconciliation:** Provider event received → signature/idempotency verified → ledger entries and status transaction → daily reconciliation → flagged exceptions → two-person approval for high-value manual corrections.
14. **Member deletion/export:** Authenticated verified request → explain retention exceptions → export only owned data → revoke sessions/tokens → anonymize/delete eligible records while retaining legally required financial/audit records minimally.

All of these require cancel, retry, duplicate-submission, validation, unauthorized, network-loss and delayed-provider scenarios.

## 6. Mobile product information architecture

### 6.1 Navigation

Use a maximum of **five clear bottom-level destinations** for the general app:
**Home · Salah · Discover · School (when relevant) · Profile**.

- **Home:** Personal welcome; hero next prayer *only if verified*; announcement; program shortcuts; upcoming event; one primary CTA.
- **Salah:** Prayer cards, mosque/local date, clear adhan vs iqamah distinction, Jummah sessions, source/updated timestamp, Qibla, calendar and opt-in reminders.
- **Discover:** Search and browsable tabs/categories for events, news, volunteers, donations, jobs, proposals, rentals, construction, resources; do not put all categories as separate bottom tabs.
- **School:** For eligible students/guardians/teachers. If no school access, show *Programs* discovery and a transparent enrollment CTA rather than private data.
- **Profile:** Personal settings, notification preferences, privacy, family switcher, own applications/receipts and accessible sign-out.

**Context-specific workspaces:** A privileged user sees a clearly labeled `Staff tools` entry after authorization, not an overloaded member tab bar. Admin-heavy tables and approval queues belong primarily to the web portal, with carefully chosen mobile emergency/approval functions.

**Navigation invariants:** Back always leads to the previous logical screen; deep links require policy checks; no dead-end routes; restore intended destination after login; sensitive views are removed on sign-out; kiosk screens are separated from normal session navigation.

### 6.2 Screen-by-screen requirements

| Screen group | Required content and controls | Empty/error and action requirements |
|---|---|---|
| Launch + onboarding | Brand splash, language, purpose, permissions explained contextually | Offline mode, skip public browsing, never force location for Salah |
| Login/register/reset | Email, password/password visibility, verification, recovery and MFA | Rate limit feedback, password manager, do not leak account existence |
| Home | Prayer hero, curated feed, next event, contextual quick action | Skeleton/empty/network retry, published source label |
| Salah | Six prayer entries, optional sunrise, adhan/iqamah, countdown, Jummah, monthly calendar | Source age, mosque-local time, error banner, refresh, accessibility pronunciation |
| Qibla | Direction relative to true north, bearing, optional device heading | Compass calibration, sensor unavailable, location permission alternatives, no fake precision |
| Events | Filter/date/calendar/map if useful, detail, RSVP/change/cancel, capacity | Waitlist rules, cancellation cutoff, location/open-in-maps |
| Announcements/blog | Priority, author, publish date, share/bookmark | Only published content, safe rich text, image alt text |
| Donations | Verified campaigns, amount presets + custom, recurring disclosure, history, receipts | Provider loading, pending webhook, failure/retry, refund/dispute clarity |
| Volunteers | Opportunities, role requirements, apply, status and shifts | Capacity/age policy, duplicate prevention |
| Proposals | Submit, attach, vote, statuses, comments, progress | Moderated text, fair eligibility, optimistic state only with rollback |
| Jobs/workers | Search/list/detail, save, apply, manage own application/profile | Private résumé, consent, spam/reporting, truthful pay period |
| School programs | Catalog, class schedule, application and enrollment | Eligibility, costs, accessible calendar |
| Guardian portal | Verified child picker, attendance, assignments, teacher reports, invoices | No guessed child/charges; links must be approved |
| Student portal | Current classes, work, resources, own progress and achievements | Age-appropriate language, no public leaderboard of private school data |
| Teacher portal | Assigned classes/rosters, session attendance, lesson tasks, reports | No class visible without teacher link, robust offline draft policy |
| Rentals | Item/date picker, availability, quote, request/approval/history | Conflict rejection and full fee/cancellation disclosure |
| Finances (public) | Only approved aggregate reports and published budgets | Never reveal donor identity or pending internal budget |
| Notifications | In-app inbox, read state, deep link, preferences | Paginated list, silent privacy redaction, never misroute by notification ID |
| Profile/settings | Display name, verified email, accessibility, language, privacy, sessions | Save/cancel, loading, logout, export/delete |
| Staff mobile tools | Approvals, urgent announcements, task checklists, essential stats | Explicit administrative context; mandatory reauth for sensitive actions |

### 6.3 Native screen structure

```text
app/
  _layout.tsx
  (public)/onboarding.tsx
  (auth)/login.tsx /register.tsx /verify.tsx /recover.tsx
  (tabs)/index.tsx /salah.tsx /discover.tsx /school.tsx /profile.tsx
  salah/calendar.tsx /qibla.tsx /reminders.tsx
  discover/events/...
  discover/news/...
  discover/volunteer/...
  discover/jobs/...
  discover/proposals/...
  discover/rentals/...
  giving/campaign/[id].tsx /checkout.tsx /history.tsx
  school/guardian/... /teacher/... /student/...
  (staff)/index.tsx /approvals.tsx /announcements.tsx
  settings/index.tsx /notifications.tsx /privacy.tsx
```

The tree is a **proposed restructuring**, not yet implemented. Validate route URLs and deep links with an explicit redirect map before moving current Expo Router pages.

## 7. Staff/admin portal: every workspace

Keep one responsive Next.js portal. A staff member is shown only relevant groups; administrators have an overview and a searchable command palette.

| Workspace | Pages & workflows | Required safeguards |
|---|---|---|
| Command center | Today: pending queues, metrics, incidents, drafts, audit highlights, upcoming Salah/events | Every KPI has source, date and drilldown; no synthetic stats |
| Worship | Today/weekly/yearly Salah, iqamah overrides, Jummah sessions, prayer publications | Effective dates, edit audit, preview, undo/version history |
| Content/communications | Announcements, blog, categories, media, newsletter, scheduling | Draft/review/publish, moderation, safe uploads, no private recipient leakage |
| Community/events | Events, RSVPs, check-ins, capacity, waitlists | Scope, duplicate protections, accessibility and cancellation policy |
| Volunteers | Opportunities, applications, shifts, check-ins, outcomes | Eligibility and concurrent capacity enforcement |
| School admin | Programs, terms, classes, student roster, approved guardian links, teacher assignments | Strong child privacy, explicit class/account assignments, restricted export |
| Teacher | Assigned classes, attendance sessions, assignments, grading, progress reports | Own-class row scope, conflict-safe mark changes, review history |
| Billing | Invoice creation/void/refund, payment matching, aging and reconciliation | Finance approval, provider event evidence, no arbitrary override |
| Donations | Campaigns, recurring donors, ledger, receipts, refunds, disputes, export | Anonymous donor privacy, exact money fields, least privilege |
| Budgets/expenses | Category budgets, transactions, published statements, construction funding | Maker/checker for adjustments, attachments with access control |
| Proposals | Moderation, voting windows, budget review, milestones | One-vote rule, hidden internal comments, immutable decision record |
| Jobs/workforce | Job review/publish/expire, applications, worker verification | No unnecessary PII access, expiry/retention, anti-spam |
| Rentals/facilities | Assets, availability calendar, approvals, collision view, maintenance, payments | Transactional time overlap check, damage/fee policy |
| CRM | Authorized contacts, follow-up tasks, segmentation, opt-in messaging | Consent and data minimization; no school/private donor blending |
| Kiosk/TV | Prayer board, active announcement queue, emergency overrides, themes | Read-only public projection; approval for emergency content |
| Organization | Members, staff grants, roles, invitations, contacts, audit and security settings | MFA, explicit permission scopes, dual control for owner privileges |
| Technical operations | Job status, provider health, deployment build, reconciliation exceptions | No plain secrets or personal data in logs |

**Web UX patterns:** High-density but readable tables, saved filters, bulk actions with preview and validation, keyboard shortcuts that do not steal typing focus, action confirmations for irreversible changes, sticky but not obstructive toolbars, audit side panels, responsive drawers and accessible empty/error states.

## 8. Premium design system — “Azure Sanctuary”

### 8.1 Brand feeling

**Art direction:** refined, tranquil, luminous, minimalist, quietly premium. Use generous whitespace, disciplined alignment, elegant typography, original geometric accents inspired by architecture (not copied religious iconography), frosted glass **sparingly**, beautiful touch interactions and carefully crafted empty/confirmation states. Emotional direction: **warm hospitality + clarity + trust**, not a gaming dashboard or stock finance clone.

**Design references as principles:** clear hierarchy, consistent native feedback, appropriate platform patterns, constrained color, accessible focus and restrained motion. Do not reproduce Apple screens, Dynamic Island arrangements, system assets or proprietary materials.

### 8.2 Semantic color tokens (proposed, confirm contrast through tooling)

| Token | Light | Dark | Intended use |
|---|---|---|---|
| `surface.canvas` | `#F7FBFF` | `#0B1624` | Main background |
| `surface.card` | `#FFFFFF` | `#13263A` | Core content cards |
| `surface.raised` | `#EAF6FF` | `#1B3651` | Secondary elevations |
| `brand.50` | `#F0F9FF` | `#102C46` | Light accent backgrounds |
| `brand.100` | `#DDF1FF` | `#183B5C` | Glass tint |
| `brand.300` | `#98D3F8` | `#6DB8EB` | Decorative accents |
| `brand.500` | `#287FCB` | `#79C5FA` | Interactive accent |
| `brand.700` | `#15588E` | `#B4E1FF` | Emphasis and links |
| `text.primary` | `#122B43` | `#F4FAFF` | Main reading |
| `text.secondary` | `#486174` | `#BDCFDD` | Metadata |
| `border.subtle` | `#D7EAF8` | `#2F5068` | Dividers |
| `status.success` | `#177550` | `#70D9A9` | Confirmed operations |
| `status.warning` | `#975A11` | `#F2C16F` | Caution |
| `status.danger` | `#BD3040` | `#FF8894` | Destructive actions |

**Accessibility caveat:** These hex values are candidate tokens, not certification. Every token *pair* must be contrast-audited in context, including disabled, pressed, highlighted and glass-background combinations. Use standard 4.5:1 contrast for normal text, 3:1 for large text and meaningful UI indicators under applicable WCAG criteria. Never use pale blue text on a pale glass card.

### 8.3 Typography, spatial rhythm, shape and elevation

- **Font:** Platform system sans first for excellent performance; consider licensed Arabic-compatible families only after legibility/metrics tests. Arabic UI must have Arabic font shaping, proper RTL punctuation and mixed-number handling; never force Latin letter spacing.
- **Type scale:** display 32/38, title 26/32, section 21/28, body 16/24, secondary 14/21, caption 12/18 (logical point/pixel values; dynamic type overrides). Limit 12px text to low-priority, nonessential metadata.
- **Grid:** 4pt rhythm with recommended gaps 4/8/12/16/24/32/40/48; horizontal mobile margins 20–24pt; 8 or 12 columns for desktop responsive layouts.
- **Shapes:** small 10–12, input/button 14–18, card 20–24, hero 28–32, pill fully rounded. Shapes reflect hierarchy rather than random variation.
- **Elevation:** two or three consistent levels; translucent overlays use 1px light borders and soft low-opacity shadows; do not stack blurs under heavy images.
- **Glass rule:** Apply to navigation bars, modal surfaces and special spotlight cards only. Dense tables, privacy notices, form fields and long text must sit on opaque backgrounds.
- **Gradients:** Use subtle white → ice-blue canvas and one expressive primary button/hero gradient. Reserve vivid blue for actionable elements.
- **Icons:** One consistent vector icon set and stroke weight; always pair ambiguous icons with text labels or accessible labels. Don't use emoji as core UI glyphs.

### 8.4 Component library specification

Create tested native and web variants of:

`Button` (primary/secondary/tertiary/destructive/link; busy/disabled/focus/pressed), `IconButton`, `GlassSurface`, `Card`, `StatCard`, `ListRow`, `SectionHeader`, `BottomSheet`, `Dialog`, `Toast`, `Banner`, `Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `Tag`, `Badge`, `Progress`, `Tabs`, `DatePicker`, `TimePicker`, `SearchField`, `FormField`, `Select`, `RadioGroup`, `Checkbox`, `Switch`, `Stepper`, `CurrencyField`, `PrayerCard`, `IqamahLabel`, `EventCard`, `InvoiceStatus`, `AuditDiff`, `RoleBadge` and `PrivacyNotice`.

Every component has: contract, states, keyboard/screen-reader semantics, contrast requirements, RTL snapshots, visual examples, touch target, test ID, analytics action ID and reduced-motion behavior.

### 8.5 Touch, motion, feedback and accessibility rules

1. Mobile tap targets **at least 44 × 44 logical points** for primary actions (48 preferred on Android). WCAG 2.2 SC 2.5.8 formally permits a smaller 24px web target under specified conditions; we adopt the larger target as a product rule.
2. Every tap yields immediate pressed/selected feedback. A network action also shows loading and either a confirmed success, a recoverable failure or a truthful pending state.
3. Disabled buttons explain *why* through adjacent text; do not use disabled as a silent dead end.
4. Forms have associated labels, helper/error text, correct keyboard type/autofill, logical focus movement, accessible validation summaries and non-destructive persistence of drafts.
5. Motion duration approximately 120–240ms for small transitions; important changes favor natural spring damping over exaggerated bounce. Respect Reduce Motion and low-power mode. No looping ambient shimmer over text.
6. No vital information conveyed only by color, animation, sound, shadow or position. Support VoiceOver, TalkBack, larger text, bold text, screen reader order, keyboard navigation and high contrast.
7. Use accessible semantics for navigation stacks/sheets; modal focus trapping on web, explicit close controls, Escape/back support and correct scroll restoration.
8. Confirm destructive actions in a context-specific dialog that names the item and consequence. Never confirm with vague “Are you sure?” only.
9. Show error recovery that preserves entered information. Network reconnection must not silently submit twice.
10. Provide full Arabic (`ar`) and English (`en`) support: copy, errors, semantic RTL mirroring, correct Hijri/Gregorian formatting, localized numbers when appropriate and calendar conventions.

### 8.6 Screen aesthetics guidance

**Home:** One breathing-space hero with next published Salah, a refined mini schedule, a single high-contrast primary action and a structured list of what matters today.  
**Salah:** Calm, almost ceremonial layout; distinct vertical prayer timeline; current prayer highlighted by *status* not glitter; mosque name/location and timestamp visible.  
**Discover:** Editorial cards, excellent imagery only when authentic/authorized, category chips, compelling titles, search and consistent filter sheets.  
**School:** Privacy-first practical interface; white reading panels, simple grade/attendance data visuals with clear labels, not flashy leaderboards.  
**Giving:** Trust-centric transaction screen, exact currency and total, fees clearly disclosed, real provider checkout.  
**Admin:** Quiet professional density; semantic priorities and highly functional tables, never decorative gradients behind sensitive information.

### 8.7 Design handoff requirements

Produce Figma file or equivalent with: token library, color and dark-mode variants, typography, responsive grid, icon rules, full components/states, linked prototypes, copy library, localization/RTL variants, accessibility annotations, 320–430pt phone frames, tablet frames, desktop frames, motion guidelines and acceptance IDs. Developers must map every delivered screen to a live route, API query and server-side permission.

## 9. Technology and UI library strategy

**Do not install every attractive UI library.** A sophisticated app is achieved by a coherent system, great details and reliable behavior, not sheer dependency count. Align versions using Expo compatibility checks and a controlled upgrade plan.

### Mobile — recommended stack

| Need | Preferred technology | Decision |
|---|---|---|
| Core | Expo + React Native + TypeScript + Expo Router | Retain, with future SDK upgrade rehearsal in isolation |
| Styling | **NativeWind v4** plus semantic token package | Trial on current Expo SDK; require compatibility tests before rollout |
| Accessible primitives | **React Native Reusables** concepts/components where compatible, then custom branded wrappers | One accessible pattern library, not simultaneous competing UI kits |
| Animations/gestures | React Native Reanimated + Gesture Handler | Existing dependencies; motion standards and reduced-motion handling |
| High-end glass | Expo LinearGradient, Expo BlurView **conditionally** | Blur only where performant and supported; opaque Android fallback |
| Lists | Shopify FlashList | For large events, media, invoices, students and notification lists |
| Remote server state | TanStack Query | Cache, mutation status, retries, refetch on app focus/network |
| Local view state | Zustand (existing) | Small, explicit stores; never duplicate server records unnecessarily |
| Forms | React Hook Form + Zod + resolver | Shared validation contracts, accessible field components |
| Device security | Expo SecureStore | Native secrets/tokens only; not large user data |
| Image pipeline | Expo Image + controlled asset service | Resizing, caching, alt labels, authenticated media |
| Icons | Lucide React Native or existing MaterialCommunityIcons | Select **one primary** family during migration |
| Haptics | Expo Haptics | Confirmation for genuine actions, accessibility preference respected |
| Quality | Vitest/Jest as suitable, React Native Testing Library, Maestro or Detox, EAS builds | Real device coverage is mandatory |

NativeWind and React Native Reusables are **proposed**, not already installed. If integration compatibility or accessibility tests fail for the current SDK, implement the same tokens using existing StyleSheet primitives instead of destabilizing the project.

### Web/admin — recommended stack

Retain Next.js + TypeScript + Tailwind + Radix primitives, improve with a coherent shadcn/ui-style owned component layer, React Hook Form + Zod, TanStack Table for advanced data grids, TanStack Query for interactive mutations, Recharts for accessible summary graphics, and lightweight motion only where useful. Use icon consistency, keyboard/focus standards and progressive disclosure. Avoid re-platforming to a new framework purely for aesthetics.

### Backend/data — recommended stack

PostgreSQL + Prisma, Zod/OpenAPI 3.1 contracts, a Postgres-backed durable job queue or production-managed task queue, object storage with signed upload/download URLs, Stripe Checkout/Billing with webhooks, verified email service, push notification provider, structured logs, traces and metrics. Infrastructure must be chosen according to real project requirements and maintenance capacity, not vendor fashion.

### Proven reference documentation

- Expo Router: https://docs.expo.dev/router/introduction/
- NativeWind: https://www.nativewind.dev/docs/getting-started/installation
- Expo BlurView: https://docs.expo.dev/versions/latest/sdk/blur-view/
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- TanStack Query (React Native): https://tanstack.com/query/latest/docs/framework/react/examples/react-native
- Shopify FlashList: https://shopify.github.io/flash-list/docs/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- OWASP MASVS: https://mas.owasp.org/
- Stripe webhook guidance: https://docs.stripe.com/webhooks
- Prisma 5 migration approach: https://www.prisma.io/docs/orm/prisma-migrate

**Version rule:** Repo currently uses Prisma 5 and Expo SDK 54. Do not execute commands copied from latest Prisma 8 documentation in a Prisma 5 repository. Pin tested versions with lockfiles, document any upgrades and regenerate contracts in CI.


## 10. API platform contract and engineering conventions

### 10.1 API protocol

All new endpoints use `/api/v1/...`. Keep existing `/api/...` routes temporarily as compatibility adapters until mobile app versions have migrated. Publish one OpenAPI 3.1 specification generated or verified from Zod schemas. All APIs must expose typed request/response contracts, authenticated ownership logic and tests.

**Resource pattern:** plural nouns, stable identifiers, explicit subresources; GET for read, POST create/command, PATCH for partial update, DELETE for permitted removal. Use immutable audit/event records for state transitions. Prefer cursor pagination for feeds and stable date/index ordering for financial and audit histories.

**Shared request headers:** `Authorization: Bearer ...` on native (where needed), session cookie + CSRF protection on web, `X-Request-Id` trace, `Idempotency-Key` for retriable financial/booking writes, `Accept-Language`, and `If-Match` for version-controlled updates. Do not trust headers for identity, roles, organization scope, prices or actor authority.

### 10.2 Standard response envelopes

Successful collection response:

```json
{
  "data": [{"id":"evt_123","title":"Community Iftar"}],
  "meta": {"nextCursor":null,"limit":20,"asOf":"2026-10-26T18:00:00Z"}
}
```

Error response:

```json
{
  "error": {
    "code": "BOOKING_TIME_CONFLICT",
    "message": "This time is no longer available.",
    "fieldErrors": {"startAt": ["Choose another time."]},
    "requestId": "req_abc123",
    "retryable": false
  }
}
```

Standards: 200 reads/updates, 201 creation, 202 queued/pending, 204 deletion, 400 invalid syntax, 401 unauthenticated, 403 unauthorized, 404 not found/not owned, 409 conflicts/duplicate commands, 412 stale version, 422 valid JSON with invalid business state, 429 throttling with Retry-After, 500 unexpected, 503 dependency down. Do not leak private resource existence by differing 403/404 on ownership-sensitive lookups. Do not return raw Prisma/Stripe errors.

### 10.3 Representative endpoints (canonical proposed v1 contracts)

| Domain | Method and route | Who/what | Core contract or invariant |
|---|---|---|---|
| Auth | `POST /auth/register` | Public | New member with consent; no privileged role selection |
| Auth | `POST /auth/login` | Public | MFA/verification state; rate limits, lockout |
| Auth | `POST /auth/refresh` | Auth device | Rotate refresh token once; detect replay; revoke family |
| Auth | `POST /auth/logout` | Auth | Revoke current session/device |
| Auth | `GET /auth/me` | Auth | Effective grants, organization, verified state |
| Auth | `POST /auth/verify-email/request` | Auth/limited | Rate-limited; nonenumerating responses |
| Auth | `POST /auth/verify-email/confirm` | Token | One-time hashed token; short expiry |
| Auth | `POST /auth/password/forgot` | Public | Enumeration-resistant reset initiation |
| Auth | `POST /auth/password/reset` | Token | Rotate credentials and revoke other sessions |
| Auth | `POST /auth/mfa/enroll`, `/confirm`, `/disable` | Privileged | Recent authentication and recovery safeguards |
| Auth | `GET /auth/sessions`, `DELETE /auth/sessions/{id}` | Auth | List and revoke own devices |
| Identity | `GET/PATCH /me` | Auth | Allowed personal fields only |
| Identity | `GET/PATCH /me/preferences` | Auth | Push/email, language, accessibility |
| Identity | `POST /me/export`, `POST /me/deletion-request` | Auth | Verified, queued, retention-aware |
| Roles | `GET/POST /orgs/{orgId}/role-grants` | Delegated admin | Explicit scope, reviewer, MFA, audit |
| Roles | `PATCH /orgs/{orgId}/members/{id}` | Org admin | Invite/suspend; deny owner self-lockout |
| Worship | `GET /orgs/{id}/prayers/today` | Public | Mosque-local date, source, adhan+iqamah |
| Worship | `GET /orgs/{id}/prayers/calendar?month=YYYY-MM` | Public | Published effective schedule |
| Worship | `GET /orgs/{id}/jummah` | Public | Friday sessions, khutbah/iqamah, notices |
| Worship | `POST /orgs/{id}/prayer-schedules` | Worship editor | Draft or approved version, validation |
| Worship | `PATCH /orgs/{id}/prayer-schedules/{id}` | Worship editor | ETag/version check |
| Worship | `POST /orgs/{id}/prayer-schedules/{id}/publish` | Approver | Audit and cache invalidation |
| Worship | `GET /orgs/{id}/qibla-info` | Public | Kaaba coordinate/bearing metadata; device heading local |
| Content | `GET /content/announcements`, `/posts` | Public published | Safe pagination, moderation state |
| Content | `POST /admin/content/{type}` | Editor | Draft only; attachments verified |
| Content | `POST /admin/content/{type}/{id}/publish` | Approver | Two-step scheduling if configured |
| Content | `POST /media/upload-intent` | Scoped | Signed short-lived upload, allowlist MIME/size |
| Content | `GET /media/{id}/access` | Authorized | Signed short-lived private download |
| Events | `GET /events`, `GET /events/{id}` | Public published | Timezone, status, capacity policy |
| Events | `POST /events/{id}/rsvps` | Eligible auth | Unique reservation, capacity transaction |
| Events | `PATCH /events/{id}/rsvps/me` | Owner | Modify/cancel before cutoff |
| Events | `POST /admin/events`, `PATCH /admin/events/{id}` | Scoped staff | Draft/publish lifecycle |
| Events | `POST /events/{id}/check-ins` | Authorized organizer | Separate RSVP vs attendance |
| Volunteers | `GET /volunteer-opportunities` | Public | Published, eligibility |
| Volunteers | `POST /volunteer-opportunities/{id}/applications` | Auth | Duplicate prevention |
| Volunteers | `POST /admin/volunteer-applications/{id}/decision` | Coordinator | Approval transaction and spot count |
| Volunteers | `GET /me/volunteer-shifts` | Auth | Own accepted shifts |
| School | `GET /school/programs`, `/classes` | Public approved | No private rosters |
| School | `POST /school/applications` | Eligible guardian | Submitted enrollment request |
| School | `GET /me/children` | Verified guardian | Explicit approved guardian links only |
| School | `GET /me/children/{studentId}/overview` | Guardian | Attendance, assignments, reports in scope |
| School | `POST /admin/school/guardian-links` | School admin | Proof/verification/approval |
| School | `POST /admin/school/teacher-assignments` | School admin | Trusted teacher account FK, no names |
| School | `GET /teacher/classes`, `/teacher/classes/{id}/roster` | Assigned teacher | Class owner filter on every query |
| School | `POST /teacher/classes/{id}/sessions` | Assigned teacher | Valid scheduled class instance |
| School | `PUT /teacher/classes/{id}/sessions/{sId}/attendance` | Assigned teacher | Upsert, unique per student/session, version |
| School | `POST /teacher/classes/{id}/assignments` | Assigned teacher | Publishing policy and recipients |
| School | `GET /students/me/assignments`, `/attendance` | Linked student | Own records only |
| School | `POST /teacher/students/{id}/reports` | Assigned teacher | Scoped student and class |
| School | `GET /school/resources` | Public or scoped | Published/assigned visibility |
| School billing | `GET /me/children/{id}/invoices` | Verified guardian | Child link and invoice owner |
| School billing | `POST /school/invoices/{id}/checkout` | Verified payer | Calculate server amount; idempotency |
| School billing | `POST /admin/school/invoices` | School billing admin | Draft/issue with approvals |
| Giving | `GET /giving/campaigns` | Public | Published, totals from verified source |
| Giving | `POST /giving/checkout` | Eligible | Server-calculated money, Stripe hosted |
| Giving | `GET /me/donations`, `/receipts/{id}` | Verified owner | No matching solely by email |
| Giving | `POST /me/subscriptions/{id}/cancel` | Owner | Real provider state, pending status |
| Finance | `GET /admin/finance/ledger` | Finance | Cursored, redacted by grant |
| Finance | `GET/POST /admin/finance/budgets` | Finance | Draft and month/category uniqueness |
| Finance | `POST /admin/finance/adjustments` | Finance + reviewer | Compensating entries, no mutation of past |
| Finance | `GET /public/financial-summaries` | Public | Explicit published aggregate only |
| Stripe | `POST /webhooks/stripe` | Provider signature | Raw body, replay/idempotency, durable event |
| Proposals | `GET /proposals`, `GET /proposals/{id}` | Public published | Hide admin notes/PII |
| Proposals | `POST /proposals` | Verified auth | Draft, limits, attachments |
| Proposals | `POST /proposals/{id}/votes` | Eligible verified auth | Unique voter/proposal |
| Proposals | `POST /admin/proposals/{id}/decision` | Reviewer | Authorized state machine + reason |
| Jobs | `GET /jobs`, `GET /jobs/{id}` | Public published | Truthful salary period/status |
| Jobs | `POST /jobs/{id}/applications` | Eligible auth | Private, virus-scanned resume |
| Jobs | `GET /me/job-applications` | Auth owner | Paginated private status |
| Jobs | `POST /admin/jobs`, `POST /admin/jobs/{id}/publish` | Moderator | Content checks and expiry |
| Facilities | `GET /rentals`, `GET /rentals/{id}/availability` | Public | Valid quote + timezone |
| Facilities | `POST /rentals/{id}/booking-requests` | Eligible auth | Overlap-safe transaction |
| Facilities | `POST /admin/rental-bookings/{id}/decision` | Facilities | Status transition, idempotency |
| Facilities | `GET /me/rental-bookings` | Auth owner | Private fees and state |
| CRM | `GET/POST /admin/crm/tasks` | Scoped staff | Assignee, due date, audit |
| CRM | `GET /admin/crm/contacts` | Scoped staff | Consent and field-level controls |
| Notifications | `GET /me/notifications` | Auth | Cursor, only actor-owned |
| Notifications | `PATCH /me/notifications/{id}` | Auth owner | Read/unread, idempotent |
| Notifications | `POST /me/devices`, `DELETE /me/devices/{id}` | Auth | Device ownership and token rotation |
| Support | `POST /contact` | Public rate-limited | Spam handling, privacy disclosures |
| Kiosk | `GET /orgs/{id}/kiosk/feed` | Public kiosk | Strictly published and sanitized |
| Ops | `GET /health/live`, `GET /health/ready` | Probes | No secrets; readiness checks dependencies |
| Ops | `GET /admin/audit-events` | Auditor/admin | Immutable and minimally redacted |

**Operational note:** This table defines intended **new** contracts, not exact current endpoints. `/api/v1` prefix applies to the relative paths listed. Convert existing APIs using mapping adapters, version telemetry and explicit sunset dates; do not suddenly break installed mobile clients.

### 10.4 Payload examples and validation

Prayer payload (the server determines local date and source):

```json
{
  "organizationId": "org_1",
  "localDate": "2026-10-26",
  "timeZone": "America/New_York",
  "source": {"type": "mosque_published", "version": 7},
  "times": {
    "fajr": {"adhan": "06:12", "iqamah": "06:35"},
    "sunrise": {"at": "07:24"},
    "dhuhr": {"adhan": "12:42", "iqamah": "13:00"},
    "asr": {"adhan": "15:34", "iqamah": "16:00"},
    "maghrib": {"adhan": "17:54", "iqamah": "18:00"},
    "isha": {"adhan": "19:09", "iqamah": "19:30"}
  },
  "publishedAt": "2026-10-25T21:00:00Z"
}
```

**Times above are schema illustrations, NOT actual mosque prayer times.** Use IANA timezone IDs, validate `HH:mm` and local date on the server, and include DST ambiguity handling where a civil time is nonexistent/repeated. Return source/version and never derive today with the server's default timezone.

Financial payment-initiate payload:

```json
{
  "campaignId": "cmp_20",
  "amountMinor": 2500,
  "currency": "USD",
  "frequency": "one_time",
  "anonymousPublicly": true
}
```

Server enforces currency range, campaign eligibility and user identity, creates pending intent and returns provider checkout URL/reference. It does **not** accept `status:"completed"` or bank account identifiers from the client.

### 10.5 Cross-cutting API controls

- Require Zod schema validation and safe output projection for every endpoint.
- Public GET may be cached briefly; identity, attendance, invoices, tokens, receipts and privileged reads use `Cache-Control: private, no-store` as appropriate.
- Separate page/limit/cursor constraints; never allow unbounded reads or free-form `include`/`select` Prisma arguments from clients.
- Scope all queries by organization and relation before limit/ordering. Use compound indexes matching real filters.
- Add stable idempotency keys on potentially duplicated POSTs; reject reuse with a different payload fingerprint.
- Use optimistic concurrency `version` or ETags on documents/approval flows, plus database transactions for capacity.
- Define HTTP contract deprecation period and a minimum supported mobile app version.
- Deep links use an allowlisted route resolver; never turn user/notification-provided URLs into arbitrary navigation.
- Expose public APIs only with consent/rate limits; no confidential logs or stack traces.
- Publish SDK-ready client types from OpenAPI contract; use generated API client where appropriate.
- Create contract tests for every endpoint: validation, unauthorized, forbidden, not found, malicious fields, duplicate action and retry.


## 11. Database redesign — normalized PostgreSQL schema

### 11.1 Schema goals and conventions

**Keep PostgreSQL** as the primary transactional store; **Prisma** remains the ORM for the target migration. Introduce additive changes, test on staging snapshots and retain existing IDs during migration with mapping tables if transitioning from `Int` IDs to UUID/ULID. Use UTC `timestamptz` for instants, IANA timezone and `date` for local-calendar records, integer minor units for money and ISO 4217 currency codes, and carefully indexed foreign keys.

Standard columns where applicable: `id`, `organizationId`, `createdAt`, `updatedAt`, `createdById`, `version` and `deletedAt` (soft delete only for domains that need it). Immutable events use `occurredAt` and **no arbitrary mutable update fields**. The schema below is a **target domain model**, not runnable complete Prisma code; every field/index constraint must be implemented in reviewed migrations and enforced server-side.

### 11.2 Organization / identity / permissions

| Model | Important columns | Relations / uniqueness / purpose |
|---|---|---|
| `Organization` | id, slug, legalName, displayName, timeZone, address, status, defaultLanguage | 1:N venues/settings/memberships; unique slug |
| `Venue` | id, organizationId, name, address, lat, lon, timeZone, capacity, active | Multi-location worship/classes/facilities |
| `PersonProfile` | id, givenName, familyName, preferredName, avatarMediaId, locale, birthDate? | Separate public identity from private contact data; birthDate only if justified |
| `UserAccount` | id, personId, normalizedEmail, verifiedAt, passwordHash?, status, lastLoginAt, securityVersion | Unique normalized email where applicable; cannot grant privileges through profile updates |
| `OrganizationMembership` | id, organizationId, userId, joinedAt, status | Unique (organizationId,userId); base member context |
| `RoleDefinition` | id, key, displayName, systemControlled | Controlled permission templates |
| `RoleGrant` | id, membershipId, roleId, resourceType?, resourceId?, startsAt, expiresAt?, grantedById | Unique active grant per resource/role; auditable |
| `PermissionGrant` | id, roleDefinitionId, permissionKey | E.g. `school.attendance.write`, `finance.refunds.approve` |
| `Invitation` | id, organizationId, invitedEmailHash, roleProposal, scope, expiresAt, acceptedAt, issuerId | Single-use invite; no role upgrade from link tampering |
| `GuardianLink` | id, organizationId, guardianUserId, studentId, relationship, verificationMethod, approvedBy, validFrom, revokedAt | Unique active guardian/student relationship; verification evidence reference |
| `StudentAccountLink` | id, studentId, userId, approvedAt, revokedAt | Unique active student login link, age/consent policy |
| `TeacherAssignment` | id, teacherUserId, classSectionId, assignedById, validFrom, validTo | Scope teacher permission by actual FK, not display name |
| `AuthSession` | id, userId, deviceId?, tokenFamilyId, expiresAt, lastSeenAt, revokedAt, ipHash?, userAgentHash? | Hash tokens; revoke sessions independently |
| `RefreshToken` | id, sessionId, tokenHash, rotatedFromId?, expiresAt, consumedAt, revokedAt | Rotation with replay detection, short reuse window only if engineered |
| `MfaFactor` | id, userId, kind, encryptedSecret?, verifiedAt, disabledAt | TOTP/passkey policies; protected recovery codes |
| `EmailVerificationChallenge` | id, userId, tokenHash, expiresAt, consumedAt | TTL + unique hash, no raw token persisted |
| `PasswordResetChallenge` | id, userId, tokenHash, expiresAt, consumedAt | Short TTL, hashed and one-time |
| `ConsentRecord` | id, personId, consentType, version, grantedAt, revokedAt, evidence | Per policy/legal region, opt-in tracking |
| `DeviceInstallation` | id, userId, platform, pushTokenHash, encryptedToken, appVersion, lastSeen, revokedAt | Ownership scoped; token rotation/expiry |
| `NotificationPreference` | userId, organizationId, channel, topic, enabled, quietHours, locale | Unique user/org/channel/topic |

Security invariants: account deactivation revokes/invalidates sessions immediately, organization grant checks always verify active membership, and user-facing profile APIs cannot update role/security fields. Credential hashes and MFA secrets never appear in API response models.

### 11.3 Worship and schedule

| Model | Fields | Constraints |
|---|---|---|
| `PrayerSchedule` | id, venueId, startDate, endDate, timeZone, calculationSource?, method?, revision, status, publishedById, publishedAt | Non-overlapping published effective periods per venue/type |
| `PrayerDay` | id, scheduleId, localDate, fajrAdhan, sunrise, dhuhrAdhan, asrAdhan, maghribAdhan, ishaAdhan, notes | Unique (venueId, localDate, publishedVersion via schedule); server-valid clock values |
| `IqamahTime` | id, prayerDayId, prayerKey, localTime, overrideReason? | Unique (prayerDayId, prayerKey), explicit missing state |
| `JummahSession` | id, venueId, localFridayDate, ordinal, khutbahAt?, iqamahAt, imamName?, language?, capacity?, publishedStatus | Unique (venueId, date, ordinal) |
| `WorshipNotice` | id, venueId, kind, title, body, startsAt, endsAt, status, priority | Eid/Ramadan/cancellations; approved publication |
| `PrayerReminder` | id, userId, venueId, prayerKey, offsetMinutes, enabled | User-owned, local device scheduling with server consistency |
| `PrayerPublicationAudit` | id, scheduleId, priorVersion, newVersion, actorId, reason, occurredAt | Immutable history |

Rules: venue-local date authoritative; distinguish **adhan** from **iqamah**; sunrise is informational not a congregational prayer; publish only reviewed schedules; warn on stale revisions; retain historical prayer versions for audit without showing old public values.

### 11.4 Education: programs, enrollment and protected minors

| Model | Fields | Constraints |
|---|---|---|
| `SchoolProgram` | id, organizationId, name, description, agePolicy, status | Program catalog |
| `AcademicTerm` | id, organizationId, name, startsOn, endsOn, status | Term boundaries and grading periods |
| `ClassSection` | id, programId, termId, venueId?, name, capacity, scheduleRule, status | No ambiguous teacher-name security |
| `Enrollment` | id, studentId, classSectionId, status, startDate, endDate? | Unique active (studentId,classSectionId), capacity check |
| `StudentProfile` | id, organizationId, studentNumber, personId?, status, gradeLevel?, restrictedNotesRef? | Unique (organizationId,studentNumber) |
| `GuardianLink` | See identity section | Approved relational protection |
| `TeacherAssignment` | See identity section | Explicit assigned class |
| `ClassSession` | id, classSectionId, startAt, endAt, venueId?, status | Actual scheduled instance; unique course/date as appropriate |
| `AttendanceRecord` | id, classSessionId, studentId, status, markedById, markedAt, reason?, revision | Unique (classSessionId,studentId), no loose date-only collisions |
| `Assignment` | id, classSectionId, authoredById, title, description, type, dueAt, publishedAt, status | Publish version and visibility |
| `AssignmentSubmission` | id, assignmentId, studentId, contentRef, submittedAt, revision, status | Unique active submission/version policy |
| `Assessment` | id, classSectionId, title, type, maxScore?, gradingPolicy, visibility | Grade rules explicit |
| `GradeRecord` | id, assessmentId, studentId, gradeValue, feedback, markedById, publishedAt | Unique assessment/student; audit changes |
| `StudentReport` | id, studentId, classSectionId, teacherId, termId, category, body, status, publishedAt | Only assigned teacher or school admin, approved release |
| `EducationalResource` | id, organizationId, title, mediaRef?, externalURL?, category, status, publishedAt | Safe verified URLs, visibility |
| `ResourceAssignment` | id, resourceId, classSectionId?, studentId?, visibility | Explicit audience, no guess by grade |
| `EnrollmentApplication` | id, applicantUserId, studentDataRef, programId, status, reviewerId, reviewedAt, reason | Private application + workflow |
| `SchoolInvoice` | id, organizationId, studentId, payerGuardianUserId?, amountMinor, currency, dueAt, status, providerRef | Unique provider references, owner check |
| `SchoolInvoiceLine` | id, invoiceId, description, quantity, unitPriceMinor, subtotalMinor | Server-calculated totals |
| `StudentAchievement` | id, studentId, category, points, sourceEventId, issuedById, privacyLevel | Private by default; no invented points |
| `FamilyAccessAudit` | id, actorId, studentId, purpose, timestamp | Access monitoring, retention policy |

Important: Use existing `Student`, `Class` and `Attendance` records as migration sources; do not assume legacy `parentEmail` makes a valid guardian link. Contact/verification workflow is required. Only a school admin authorizes a student account; school-sensitive exports must be limited, logged and purpose-bound.

### 11.5 Payments, donations, accounting and budgets

| Model | Fields | Constraints |
|---|---|---|
| `DonationCampaign` | id, organizationId, name, slug, purpose, goalMinor?, currency, status, publishedAt | Published campaign, clear permitted use |
| `Donation` | id, organizationId, donorUserId?, campaignId?, amountMinor, currency, anonymityPolicy, paymentIntentId, status, createdAt | Guest ownership never inferred from email alone |
| `Subscription` | id, donorUserId, stripeSubscriptionId, status, amountMinor, currency, interval, cancelAt? | Provider state mirrored, cannot be client-forced |
| `PaymentIntentRecord` | id, kind, entityId, provider, providerIntentId, amountMinor, currency, status, idempotencyKey | Unique provider reference + idempotency |
| `PaymentEventInbox` | id, provider, providerEventId, type, payloadHash, receivedAt, processedAt, outcome | Unique (provider,providerEventId) |
| `PaymentRefund` | id, paymentId, amountMinor, reason, approvedById, providerRefundId, status | No refund > available net paid balance |
| `LedgerAccount` | id, organizationId, code, category, currency, status | Accounting chart of accounts |
| `JournalEntry` | id, organizationId, sourceType, sourceId, postedAt, status, reference | Immutable posted journals; reversing adjustment |
| `JournalLine` | id, journalEntryId, ledgerAccountId, debitMinor, creditMinor, currency | Sum(debit) = Sum(credit) per journal/currency |
| `Expense` | id, organizationId, categoryId, supplierRef?, amountMinor, currency, incurredOn, receiptMediaId?, status | Reviewer and receipt link |
| `ExpenseApproval` | id, expenseId, actorId, decision, reason, createdAt | Maker/checker; cannot approve own high-risk request |
| `Budget` | id, organizationId, categoryId, periodStart, periodEnd, amountMinor, publishedAt?, status | Unique category/period/version |
| `FinancialPublication` | id, organizationId, period, publishedTotalsJson, approvedById, publishedAt | Snapshot of publicly allowed aggregates |
| `Receipt` | id, paymentId, receiptNumber, pdfMediaId?, issuedAt, status | Unique receipt number, immutable correction links |
| `ReconciliationRun` | id, startedAt, completedAt, provider, count, discrepancies, status | Evidence and exception review |

**Non-negotiable:** No currency stored as JavaScript floating point. Avoid double counting charges. Stripe webhooks verified with raw body and signing secret, processed idempotently; authoritative state changes occur only in committed database transactions. Never display a success receipt because a browser redirects to a “success” URL.

### 11.6 Community, content and service operations

| Model(s) | Important fields and relationships | Business invariants |
|---|---|---|
| `Post`, `Category`, `PostRevision` | author, category, draft/published status, scheduling, content, revisions | Review gates, escaped/sanitized rich text |
| `Announcement`, `AnnouncementAudience` | priority, publish window, localized body, audience | Only approved published audience reaches push/kiosk |
| `Event`, `EventOccurrence` | venue, times, recurrence, capacity, status | Occurrences for recurring events; avoid implicit local time |
| `EventRSVP`, `EventCheckIn` | event occurrence, user, status, checkedInAt | Unique active RSVP; check-in separate |
| `VolunteerOpportunity`, `VolunteerApplication`, `VolunteerShift` | qualifications, capacity, applicant, assignment/status | Transactional spots; history of decisions |
| `ProjectProposal`, `ProposalRevision`, `ProposalVote`, `ProposalComment` | submitter, budget, moderation, votes, internal/public notes | Unique eligible votes; internal notes never public |
| `JobPosting`, `JobApplication`, `WorkerProfile` | employment terms, consent, screening, private resumes | Unique ownership/duplicate policy; moderation before publish |
| `RentalAsset`, `RentalBooking`, `RentalHold` | venue, availability, startsAt/endsAt, status, priceMinor | No overlapping confirmed holds/bookings; expiry of temporary holds |
| `FacilityMaintenance`, `FacilityClosure` | asset, interval, issue, owner, priority | Blocks bookings when applicable |
| `ConstructionProject`, `ConstructionMilestone` | goal, public progress, verified updates, funding link | Published progress with dated evidence |
| `CrmContact`, `CrmTask`, `CrmInteraction` | legal basis/consent, assigned staff, status | Consent segregation and scoped queries |
| `ContactSubmission`, `NewsletterSubscriber` | contact identity, request, subscription version | Unsubscribe and safe retention |
| `MediaAsset`, `MediaAccessGrant` | owner, MIME, byte length, scan status, visibility | Signed URLs, file checks, no public private media |
| `KioskPlaylist`, `KioskContent`, `KioskEmergencyNotice` | venue, schedule, approved content | Public sanitization, read-only delivery |
| `Notification`, `NotificationDelivery`, `NotificationTemplate` | user, type, deepLinkId, channel, status, locale | No raw external links, dedup, respect preferences |

### 11.7 Infrastructure, governance and operational models

`AuditEvent` (actor, action, resource, before/after redacted diff, reason, IP hash, occurredAt, immutable), `OutboxEvent` (aggregate/id/eventType/payload/redaction, publishedAt, attempts), `InboxEvent` (external event id, processedAt), `IdempotencyRecord` (actor, route, request hash, response reference, expiry), `FeatureFlag` (org, key, variant, rollout, owner), `DataExportJob` (owner, scopes, status, expiresAt), `DeletionRequest` (subject, status, legal holds), `ProviderHealth` (system, lastSuccess, failureCount), `SupportTicket` and `SystemSetting` (validated, per organization).

### 11.8 Indexes, constraints and normalization

- Primary keys on every table; real FKs on sensitive relations. Avoid using email/display name as resource permission FK.
- Index `(organizationId,status,createdAt DESC)` for queues; `(userId,createdAt DESC)` for notifications and histories.
- Unique `(classSessionId,studentId)`; unique active `(studentId,classSectionId)`, `(proposalId,userId)`, `(provider,providerEventId)`; enforce in database, not only application logic.
- For bookings, consider PostgreSQL exclusion constraints on `tstzrange` by asset for confirmed/held intervals; test for concurrency at the database level.
- Use check constraints for positive minor units, percentages 0–100, `startsAt < endsAt`, one valid status per state transition, nonnegative capacity.
- Index normalized email lookup and public slugs with case-safe uniqueness; never expose sequential IDs alone as authorization.
- Use dedicated `organizationId` on org-owned entities; enforce scope in service repositories and negative tests. Consider PostgreSQL RLS only as a defense-in-depth layer after explicit connection-context design; do not rely on it accidentally.
- JSONB for well-defined nonrelational metadata, not as a substitute for money, permissions, foreign keys or queryable domain entities.
- Use transactional outbox for notifications following commits, retries with bounded exponential backoff and dead-letter inspection.
- Retention: keep only operationally required personal data; purge stale reset tokens, revoked device data and expiring uploads; do not indiscriminately erase required financial records or immutable security events.
- Incremental migrations follow **expand → backfill → dual-read/write where necessary → verify → switch → contract**; never destructively reset the production DB.

### 11.9 Selected Prisma-style sketches (illustrative, migration design inputs only)

```prisma
model Organization {
  id           String   @id @default(cuid())
  slug         String   @unique
  displayName  String
  timeZone     String
  memberships  OrganizationMembership[]
}

model OrganizationMembership {
  id             String   @id @default(cuid())
  organizationId String
  userId         Int
  status         String
  organization   Organization @relation(fields: [organizationId], references: [id])
  grants         RoleGrant[]
  @@unique([organizationId, userId])
}

model RoleGrant {
  id            String @id @default(cuid())
  membershipId  String
  roleKey       String
  scopeType     String?
  scopeId       String?
  expiresAt     DateTime?
  membership    OrganizationMembership @relation(fields: [membershipId], references: [id])
  @@index([membershipId, roleKey])
}

model GuardianLink {
  id              String   @id @default(cuid())
  organizationId  String
  guardianUserId  Int
  studentId       Int
  approvedById    Int?
  approvedAt      DateTime?
  revokedAt       DateTime?
  @@index([guardianUserId, revokedAt])
  @@index([studentId, revokedAt])
}

model ClassSession {
  id             String   @id @default(cuid())
  classSectionId String
  startsAt       DateTime
  endsAt         DateTime
  status         String
  attendance     AttendanceRecord[]
  @@index([classSectionId, startsAt])
}

model AttendanceRecord {
  id             String @id @default(cuid())
  classSessionId String
  studentId      Int
  status         String
  markedById     Int
  version        Int @default(1)
  classSession   ClassSession @relation(fields: [classSessionId], references: [id])
  @@unique([classSessionId, studentId])
}

model PaymentEventInbox {
  id              String   @id @default(cuid())
  provider        String
  providerEventId String
  payloadHash     String
  receivedAt      DateTime @default(now())
  processedAt     DateTime?
  @@unique([provider, providerEventId])
}
```

These models omit some back-relations and existing-schema migration mappings and must **not** be pasted into production unreviewed.


## 12. Security architecture and privacy engineering

### 12.1 Threat model and trust boundaries

Assets: children's records, account sessions, donations/receipts, staff privileges, private documents, admin audit, phone numbers/email, device tokens, and published mosque schedule. Attackers may be anonymous, authenticated members, compromised staff accounts, automated scrapers, malicious file uploaders or replayed webhook senders.

Threats include credential stuffing, account enumeration, IDOR/BOLA, cross-organization access, insecure direct object mutation, CSRF/XSS on web, untrusted deep links, server-side request forgery through media URLs, mass assignment/Prisma relation injection, payment status forgery, double spending/refunds, booking races, leaked secrets, mobile token extraction, cloud storage misconfiguration and school records exposure.

Adopt OWASP **ASVS** for server/web and **MASVS/MASTG** for mobile. Review dependencies and pen-test authorization boundaries before launch.

### 12.2 Authentication design

- **Web:** Use secure HttpOnly, Secure, SameSite cookies and server-managed session state or a refreshable session architecture; protect mutations against CSRF and check Origin when appropriate.
- **Mobile:** Use short-lived signed access token and **rotating, revocable refresh token**; store secrets in Expo SecureStore/keychain/keystore, not AsyncStorage. Existing mobile token in AsyncStorage is a migration target. Do not store credentials or private school records in unencrypted cache.
- **MFA:** Required for admins and finance; support TOTP or passkeys after provider compatibility review. Require step-up authentication for payouts/refunds, role grants, family-link overrides, sensitive exports and secret changes.
- **Login:** Normalize email, generic account-recovery messaging, breach-aware password checks where available, adaptive/provider-backed distributed throttling, per-account + per-IP limits, lockout with abuse monitoring and secure password hashing with adjustable cost.
- **Sessions:** Device listing, explicit logout everywhere, timeout, revocation on password reset/role demotion/deactivation, token family replay detection, audience/issuer verification and key rotation.
- **Verified ownership:** Email verification is necessary but not sufficient to link a child. The school must approve a guardian using its documented identity verification process.
- **Privileged recovery:** Secure audited break-glass path with at least two authorized human approvals where possible.

### 12.3 Authorization rules

Every mutation and private read evaluates:

```text
allow =
  authenticated AND accountActive AND organizationMemberActive
  AND permissionGrantedForAction
  AND resourceOrganizationMatches
  AND relationScopeValid
  AND sensitivityStepUpSatisfied
  AND resourceInPermittedState
```

Never derive privileges from a React component, email query string, role displayed by the client, mutable teacher name or hidden navigation. Always select the minimum required fields in ORM projections. For subscriptions, donations, invoices and job applications, the authenticated account/resource relationship—not form-submitted email—governs access.

### 12.4 Protection requirements

- All production traffic over HTTPS with valid TLS, HSTS where appropriate, secure proxy trust and CORS allowlist.
- Separate secrets by environment and provider; encrypt at rest using managed keys, rotate credentials with tested runbooks, do not commit `.env` files.
- **Historical secret exposure:** Treat old Git history secrets as compromised; rotate and review access logs. Deleting branches/files does not erase reachable history.
- Upload size/type allowlists, malware scanning, content-disposition rules, EXIF stripping for public imagery, private object storage and short-lived signed URLs.
- Server-side rich text sanitization; allowlisted redirects/deep links; no arbitrary fetch to user-submitted URLs.
- Structured logs redact names, emails, tokens, sensitive session data, bank/payment secrets and child records.
- Immutable audit trail for role changes, child-link approvals, attendance/grade modifications, exports, budget changes, payment adjustments, data deletion and emergency publication.
- Rate limits in a shared/durable store (not per-instance memory in production); complexity budgets on search/list endpoints.
- Separate deployment identities/service accounts for GitHub Actions, Vercel, database, storage, email and Stripe.
- Disaster-response policy: detect → disable high-risk operations → revoke/rotate → preserve evidence → notify applicable stakeholders per law → restore.
- Admin on phone requires explicit context, stronger authentication and no high-risk destructive bulk action without confirmation/review.

### 12.5 Data privacy, minors and governance

- Data classification: **Public**, **Internal**, **Confidential**, **Highly restricted** (children's profiles, auth secrets, private financial/medical-like notes). Define owner, purpose and retention for every category.
- Minimize collection; separate religious participation and personal data; never infer religious identity or publish someone's worship/attendance history.
- Student profiles private by default. Images, rankings, grades and reports never appear publicly without an independently evaluated consent/legal basis. Avoid exposing guardian email/phone in roster APIs.
- Parent/guardian identity verification and safeguarding rules are mandatory for child access. Teacher-student private messages are not launched without dedicated safety policy, moderation and audit requirements.
- Account export/deletion with explicit exceptions for lawful financial and integrity retention. Published analytics must have aggregate thresholds to avoid singling out a small group.
- Review applicable US state and federal privacy requirements, COPPA if child-directed/under-13 data collection applies, and FERPA only where legally applicable; do not self-claim compliance without counsel review.
- Separate opt-in marketing/newsletters from operational communications; honor consent version, unsubscribe and quiet hours. Notification payloads on locked devices should not reveal children's names or private billing details.

## 13. Faith-specific correctness

### 13.1 Prayer schedule authority

The mosque may publish times directly or use a chosen calculation provider as a **draft source**. Published server records override on-device geographic estimations. Store:
`venueId`, `localDate`, `timeZone`, `adhan`, `iqamah`, source, publication state, revision, publisher, valid interval and last-reviewed time.

If no date is published: show a clear unavailable/pending state, offer the mosque contact and optionally a clearly labeled calculation estimate **only if expressly approved**; never silently substitute sample values. Respect different calculation methods, Asr conventions and local daylight-saving adjustments with community leadership approval.

### 13.2 Qibla

Use precise Kaaba geodesic bearing computation from a trusted location, with a unit-tested utility. Compass heading may be inaccurate indoors, uncalibrated or without permission; show calibration help, static map bearing fallback and uncertainty. Qibla direction is not a user identity or location-tracking reason. Never retain precise location unless needed for a disclosed feature and explicitly permitted.

### 13.3 Ramadan, Eid and Hijri dates

Hijri date displays and Ramadan/Eid start notices are subject to a mosque-approved calendar/observation policy. Provide a manual confirmed override and audit trail; label “provisional” vs “announced” where appropriate. Distinguish Friday khutbah start, actual congregational time, optional second Jummah and capacity/accessibility details.

## 14. Commerce, payments and financial integrity

1. Create pending server record from validated amount/currency and campaign/child reference.
2. Create Stripe checkout/intent with a deterministic idempotency key and metadata referencing internal record IDs, not private child notes.
3. Redirect to trusted Stripe-hosted flow; show “Payment processing” on return.
4. Verify webhook cryptographic signature against exact raw body; store event ID in `PaymentEventInbox` with unique constraint.
5. In one DB transaction: lock payment, ensure correct amount/currency and allowed status, update payment/donation/invoice, create balanced journal postings, enqueue notification and receipt event.
6. Handle duplicate/out-of-order events safely. Reconcile provider state if events arrive in surprising order.
7. On refunds, create reversal/compensating ledger entries and preserve receipt history. Record staff approval where required.
8. Daily reconciliation compares internal posted money with provider settlement data and surfaces exceptions.
9. Separate recurring subscription cancel request from provider-confirmed cancellation. Make next charge date/cancellation policy visible.
10. Safeguard anonymous giving: publicly hide donor identity; access to legal/processor records restricted to necessary finance operations.

**SLO acceptance:** No double processing under concurrent webhook replay; no user can set paid status with a client request; no refund greater than settled amount; all currency rounding deterministic; reports reconcile to provider totals subject to known timing differences.

## 15. School correctness and safeguarding

- Teacher identity is via **assigned account ID** plus active class/term scope, never the free-text teacher display name.
- Guardian access requires approved `GuardianLink`, not merely same surname or an email string.
- Student account identity requires school approval and age-appropriate account policy; no self-selection of another student ID.
- Attendance should refer to a real `ClassSession`. Concurrent writers use transaction/version conflict rules; edits require actor/reason and audit.
- Assignment content is visible only after publish and to enrolled relevant students/linked guardians.
- Report publishing has draft/review/published states. Grade corrections retain history and reason.
- Billing belongs to exact student/invoice and approved payer scope; all amounts server-calculated.
- Enrollment decisions are status transitions, cannot accept an applicant twice into a full class, and generate auditable notices.
- Optional parent messaging must respect safeguarding policy; no direct unsupervised adult-child chat.
- Gamification must be opt-in and privacy-safe; private score not exposed in public leaderboards without reviewed policy.

## 16. Notifications, background tasks and offline operation

### 16.1 Notification architecture

An operation commits a domain event to `OutboxEvent`. Worker reads and fans out permitted notifications based on consent, device ownership, role and quiet hours; stores `NotificationDelivery` outcome and retries transient provider failure. Push payload should default to generic privacy-safe text, with a signed/allowlisted in-app destination. Opening it fetches current authorized data from the API, not cached secret payload.

### 16.2 Offline policy by module

| Module | Offline behavior | Sync safety |
|---|---|---|
| Published prayer calendar | Read-only last verified schedule, clearly labeled effective date and timestamp | Refresh on reconnect; never present expired data as current |
| Home/public articles | Small cached snapshot + “Last updated” label | Stale-while-revalidate |
| Event browse | Cached read, RSVP disabled while offline or explicit queued request only after policy review | No false success; idempotency |
| Donation/fees | View prior verified history if encrypted and privacy safe; cannot confirm payment offline | Provider online mandatory |
| School | Limited private cache by consent/device policy, preferably no sensitive details offline initially | Clear on logout; no cross-account reuse |
| Teacher attendance | Optional encrypted local **draft only** after conflict-resolution design; not presented as submitted | Explicit sync reconciliation, conflict errors |
| Admin approvals | Not completed offline | Fresh authorization and concurrency checks |
| Device notifications | Display minimal metadata only | Fetch record on open |

Use TanStack Query for server cache; Zustand for small UI preferences. SecureStore for secrets, storage encryption for any sensitive offline store (or avoid local persistence). On logout, clear sensitive caches, subscriptions, tokens and pending user-bound tasks. Background retry tasks require idempotency keys and safe cancellation.

## 17. Search, content and internationalization

Search: start with PostgreSQL text search and indexed filters; adopt a dedicated search engine only after performance/data requirements justify it. Return published/authorized items only. Debounce client queries, cancel stale requests and offer recent local searches only with consent.

Content workflow: author → save draft → preview → review → schedule/publish → notify/present → edit as revision → archive. Rich text is sanitized and media scanned. All announcements support `locale` variants and alt text.

Localization: store canonical data as typed values, not formatted English strings. Translate statuses and validation/errors. Use Intl APIs plus verified Hijri calendar library if necessary, with user preferences for numerals. Test Arabic RTL layouts with real Arabic copy, especially tabs, icon direction, mixed LTR amounts, time, phone numbers and linked URLs.

## 18. Non-functional engineering requirements

### 18.1 Mobile performance

- Measure cold/warm start, first meaningful content, navigation and list FPS on budget Android and representative iPhones, including slow 3G/4G and low-memory modes.
- Do not mount giant screen trees; lazy-load route sections, FlashList for big collections, memoize expensive derived rows where measured.
- Bundle-size budget reviewed each release; compress/resize images and preload only above-the-fold essentials.
- Avoid constant blur/reanimated effects on low-end hardware. Prefer static gradient/opaque fallback.
- Use query invalidation rather than global full-screen refresh after every mutation; split cache keys by actor/org.

### 18.2 Backend reliability

- Health endpoints check liveness vs actual readiness separately; public prayer/cache reads remain available during non-critical provider outages.
- Define per-operation timeout, retryable error types, circuit breakers for provider calls, durable queues and dead-letter operations.
- Run critical money/booking/capacity changes under database transactions with appropriate row locking/isolation.
- Ensure backfills are resumable; hard deletes gated, reviewed, and reversible where possible.
- Provide idempotent operations and canonical error codes. Never rely on a process-global variable for correctness in serverless deployments.

### 18.3 Observability and metrics

Instrument:
- HTTP requests by route/category/status/latency (no PII in tags)
- API 401/403/429 spikes and possible IDOR probes
- Queue lag, retries, dead letters, push/email delivery failure
- Stripe webhook lag, reconciliation mismatches, invoices overdue
- Prayer schedule missing/stale publication alert
- Database slow query/pool saturation/migration version
- Mobile crash-free sessions, screen load and interaction completion
- Staff audit security alerts, privileged role changes, export volume

Establish on-call owner, dashboard, incident severity, escalation process, and tested backup/restore with RPO/RTO targets chosen by the organization.

## 19. Testing and quality strategy

### 19.1 Test pyramid

1. **Unit:** domain math, prayer local dates/DST, qibla, money, fee/tax/discount math, permission policy, input validation, workflow state transitions.
2. **Component/UI:** every design component variant and accessible states, forms, error banners, RTL, dynamic type and reduced motion.
3. **API integration:** real disposable Postgres, session/role/object scope, unique constraints, concurrent approvals, transactional finance, consent.
4. **Contract:** OpenAPI/Zod request/response schemas, generated clients, old-to-new adapter parity, intentional 4xx mapping.
5. **End-to-end web:** browser login, dashboard, editor workflows, school links, finance read/approve, responsive viewport/keyboard.
6. **End-to-end native:** iOS/Android app launch, deep links, permission dialogs, offline recovery, background/foreground, notification actions, sign-out privacy.
7. **Provider sandbox:** verified Stripe checkout/webhook/replay/refunds, email send/confirm/resend, test push token roundtrip, signed media uploads.
8. **Security:** SAST, secret scanning/history review, dependency scanning, DAST, object-level authorization matrix, file upload threats, mobile MASVS assessment, manual penetration test.
9. **Performance/accessibility:** large datasets, low-end devices, contrast/dynamic type, VoiceOver/TalkBack, keyboard-only web, Android back gestures, memory/battery.
10. **Migration/DR:** Snapshot staging restore, schema drift checks, expand/backfill/switch/rollback rehearsal, idempotent migration rerun, backup restore simulation.

### 19.2 Required negative tests

- Member accesses someone else's donor receipt by guessing `id` → denied.
- Teacher accesses any unassigned class/child → denied even if display name matches.
- Unverified guardian guesses student ID, even with matching email → denied.
- Student requests full roster or other student's grades → denied.
- Staff edits invoice, published finance numbers or privileged grants → denied.
- Public job listing reveals private applicant phone/resume → denied.
- Non-public announcement leaks via search, kiosk or notification → denied.
- One user submits two votes / two volunteer approvals concurrently → unique/capacity safe.
- Two users book same asset/time concurrently → exactly one confirmed.
- Stripe event delivered 10 times or out of order → exactly one recorded state transition/ledger posting.
- Mobile token stolen/replayed after password change or logout → revoked.
- Signed URL expires, upload wrong MIME, executable file or oversized media → blocked.
- Deep link to private page while signed out → login then policy; no cached private content.
- Editing Salah across timezone midnight or DST switch → correct published local date.
- Unavailable data/provider → clear error/empty state, never imaginary success.

### 19.3 “Every button works” verification definition

Every touchable element must have an entry in a **UI Action Registry** with `screenId`, `actionId`, actor/permission, expected navigation/side effect, API contract, loading/confirmation/error states, analytics event, accessibility label and at least one automated or documented manual test. Disallow production components whose registered action is missing or points to placeholder/mock behavior. Static, noninteractive cards must not visually imitate buttons.

## 20. Application security and release operations

### 20.1 Environments

- `local`: disposable local Postgres; fake/sandbox integrations; no production PII.
- `CI`: isolated Postgres and fixture accounts; tests with deterministic clock and scoped secrets.
- `staging`: near-production infra with sanitized data and Stripe test mode, separate sender/domain and push project.
- `production`: managed Postgres with backups, deployment approvals and least-privilege credentials.

### 20.2 Pipeline

```text
PR -> lint/typecheck/format -> schema validation -> unit tests
   -> contract/API integration -> browser/native smoke -> security scan
   -> build -> preview environment -> reviewer + accessibility checks
   -> staging migrations rehearsal -> sandbox payment/email/push tests
   -> release approval -> production migration (separate reviewed step)
   -> deploy specific immutable commit -> smoke/telemetry -> rollback plan
```

**Branch policy:** All future code is based on `development`, currently the single canonical branch; for risky implementation work, isolate changes in local working copies or temporary short-lived PR branches **only if** the owner explicitly approves changing the one-branch operating policy. Always preserve CI gates and review results. Avoid direct deployment of untested large changes.

### 20.3 Database migration safety

1. Inventory deployed schema, actual row counts, data owners and migrations ledger.
2. Rotate previously exposed credentials and verify provider configuration/permissions.
3. Back up staging and production; restore a backup to prove it works.
4. Create additive migration with nullable fields/new tables/indexes; validate constraints and locks.
5. Write idempotent backfill with checkpoints and audit count reconciliation.
6. Use dual-read/write where essential; compare old/new outputs with controlled flags.
7. Shift API in stages with client compatibility window; emit metrics for fallback use.
8. Apply NOT NULL/unique/FK constraints after validating historical data.
9. Remove unused fields only after retention/rollback period and no active consumers.
10. Rollback code independently when possible; irreversible schema changes require explicit business signoff.

**Prisma version note:** Existing code uses Prisma 5; follow docs and commands for the locked version. Production must use reviewed migration history—**not** an automatic `db push` during a Vercel build.

### 20.4 Deployment topology

- **Next.js/Vercel:** Staff portal and public read/API gateway with properly set root directory, explicit environment variables and secure headers.
- **PostgreSQL:** Managed TLS, connection pool, observability, least privilege, PITR backup/recovery.
- **Background jobs:** Separate managed worker/queue suited to Vercel/serverless architecture.
- **Expo/EAS:** Development builds, internal beta, TestFlight/Play testing, staged rollout and OTA policy that respects native runtime compatibility.
- **Storage:** Private uploads and public transformed assets with scanning, object lifecycle and encryption.
- **Stripe/email/push:** Separate sandbox and production credentials and webhook verification; correct verified sender and notification opt-in.
- **Kiosk:** Public projection with no authenticated admin token embedded in the TV page.

## 21. Suggested delivery roadmap — evidence-based gates

### Phase 0 — Inventory, security blockers and architectural contracts

**Deliver:** Source inventory; active endpoint map; current vs proposed schema diff; design tokens; role matrix; threat model; test baseline; backup+restore rehearsal; secret rotation plan; integration inventory and provider owners.

**Exit criteria:** Every critical legacy feature has a documented owner, known data source and status; secrets investigated; new role/ownership rules approved; no unreviewed production migration.

### Phase 1 — Design system foundation and UX architecture

**Deliver:** Complete Figma design system, original premium light/dark brand, 5-tab IA, native/web component library, localization system, action registry, navigation/deep link map, empty/error/loading/confirmation patterns and baseline accessibility tests.

**Exit criteria:** Core components meet accessibility tests; flows for guest/member/guardian/teacher/admin clickable in prototype; target devices and states covered. No decorative dead controls.

### Phase 2 — Identity, roles, organization and secure API contracts

**Deliver:** Permission service; explicit org/member/role grants; GuardianLink/TeacherAssignment; protected session storage, refresh/revoke/MFA; verified owners; request schemas, v1 API error envelope, SDK/client contracts.

**Exit criteria:** Cross-user, cross-class, cross-org, privilege escalation and session-replay negative tests pass; sensitive records never exposed by default.

### Phase 3 — Worship, Home and community publishing

**Deliver:** Fully dynamic published Salah/Jummah, Qibla, calendar, announcements, content, events, RSVPs, safe notification delivery and editorial Home.

**Exit criteria:** Prayer source/timezone/DST tests, deep links, RTL, public/no-data states, event capacity and published-only tests pass.

### Phase 4 — School and safeguarding

**Deliver:** Term/program/class/session redesign, verifiable guardian/student identity, assigned teacher scopes, attendance, assignments, reports, resources, enrollment, privacy-aware achievements.

**Exit criteria:** Teacher/guardian/student authorization suites pass, source reports accurate, concurrency-safe writes, school admins verify sample realistic records in staging.

### Phase 5 — Donations, invoices and finance

**Deliver:** Minor-unit money schema, provider inbox/outbox, Stripe one-time/recurring/tuition, receipts, budgets, expenses, reconciliation and finance approval flows.

**Exit criteria:** Sandbox real webhook replay and refunds pass; ledger balanced; verified users can only access owned receipts; no fabricated payment status.

### Phase 6 — Jobs, volunteers, proposals, facilities and CRM

**Deliver:** All moderation/approval lifecycles, job applications, shifts, voting, bookings, construction, tasks, contact/newsletters, organization dashboards.

**Exit criteria:** No dead actions or mock success; concurrent capacity/booking tests pass; moderation/audit/notifications connected.

### Phase 7 — Full native polish, resilience and public beta

**Deliver:** Device usability tests, low-end performance, offline read policies, mobile push, EAS signing, accessibility, telemetry, crash reports, App Store/Play compliance content.

**Exit criteria:** Representative testers from each role complete critical journeys, no severity-1/2 defects, documented UX satisfaction/performance thresholds achieved.

### Phase 8 — Controlled release and ongoing operation

**Deliver:** Approved migrations, production secrets, operational dashboards, incident runbooks, data processing review, staged rollout, post-release validation and maintenance schedule.

**Exit criteria:** Owner signs evidence, staging-to-production data release plan approved, smoke tests pass, provider callbacks healthy, privacy/support contacts active, rollbacks tested.

### Delivery ordering and parallelism

- Phase 0 and design research may run in parallel, but no schema or auth rewrite without Phase 0.
- Design system can progress while API contracts stabilize; UI feature implementation must wait for its signed contract and permission tests.
- School and financial migration work require their own staging gates; do not deploy an unverified schema just to unblock UI previews.
- Aim for a **vertical slice** per feature: API/schema → policy → UI → error states → tests → telemetry → acceptance, rather than rebuilding 90 screens with fake values and connecting backend later.

## 22. Priorities, ownership and completion definition

### 22.1 Priority ranking

**P0 (release blockers):** Credentials/history exposure review and rotation; real permission isolation, mobile token security; correct money ownership/provider verification; checked migration path, backup restore; private child access; production queue/rate limiting; verified Salah data; broken/pretend successful actions.

**P1 (core experience):** Design system, Home/Salah, membership, classes, events, donations, admin editing, notifications, complete English/Arabic accessibility, automated primary paths.

**P2 (full capability):** Facility scheduling, CRM, workers/jobs, proposal budgets and audit versions, advanced volunteer shifts, school resources, financial transparency.

**P3 (future enhancement):** Novel personalized recommendations, advanced search and reporting, watch-specific enhancements, additional faith content subject to review.

### 22.2 Responsibility chart

| Role | Accountability |
|---|---|
| Product owner / mosque leadership | Scope, worship policy, priority, approval and legal/provider ownership |
| Engineering lead | Architecture, domain contracts, integration plan, performance and code reviews |
| Design lead | Design tokens, prototypes, content, accessibility and complete state coverage |
| Security/privacy lead | Threat model, minors' data, account lifecycle, release review |
| Backend/data engineer | Schema, scoped APIs, data migration, queues, audit, provider correctness |
| Mobile engineer | Native navigation, state, secure storage, gestures, device and release QA |
| Web engineer | Staff/admin portal, responsive forms/tables, workflow audit UI |
| QA/accessibility engineer | Test plans, E2E, real devices, Arabic/RTL, automation evidence |
| Operations owner | Secrets, backups, staging/prod release, monitoring and incidents |
| Finance/school domain approvers | Billing and educational policy/reconciliation signoff |

Small teams can combine responsibilities, but **maker/checker for financial/security changes cannot be waived merely because the same person fills multiple titles**; use a separately authorized approver for sensitive operations.

### 22.3 Definition of done — mandatory for every feature

A feature is “done” only when: (a) user story/permission and acceptance conditions approved; (b) UX states complete in light/dark and supported languages; (c) no mock/unavailable data portrayed as factual; (d) API/schema/contracts and server authorization implemented; (e) form validation, loading/error/empty/success, offline state handled; (f) audit and privacy obligations met; (g) unit/integration/E2E and negative tests pass; (h) device/responsive/accessibility tests pass; (i) telemetry/runbook/deployment config completed; (j) production owner accepts it. “100%” means this evidence exists for the agreed release scope, not an untestable promise of zero defects.

## 23. Detailed feature acceptance register

| Feature | Must demonstrably work | Verification gate |
|---|---|---|
| Login and recovery | Register, verify, sign in, sign out, reset, MFA, revoke | Manual + auth/token tests |
| Home | Published/authorized widgets render accurately; refresh/links work | Contract + screen E2E |
| Salah | Day/calendar/Jummah/iqamah, source, timezone and Qibla states | DST, prayer, device tests |
| Events | View, RSVP, modify, cancel, check in, handle capacity | Concurrent integration/E2E |
| News | Draft, review, schedule, publish, edit, archive | Moderation and role tests |
| School catalog | Program/class browse and enrollment request | Content/access tests |
| Guardian | Approved link, multiple children, correct own reports/invoices | Cross-child privacy tests |
| Teacher | Assigned roster, mark/edit attendance, publish assignments/reports | Cross-class and concurrency tests |
| Student | Own schedule, attendance, submissions, graded feedback | Own-resource test suite |
| Giving | One-time/recurring, proper checkout, refund and receipt | Stripe sandbox reconciliation |
| Tuition | Invoice issuance, payer access, checkout, void/refund | Amount/ownership integrity |
| Volunteer | Opportunities, apply, approve, shift, attendance | Duplicate/capacity tests |
| Proposals | Draft, submit, review, vote, comments, progress | Identity/voting/visibility tests |
| Jobs | Publish/search/save/apply, history, moderate | Resume privacy tests |
| Rentals | Quote, hold, book, approve, cancel, fee/refund | Time-conflict integration |
| CRM | Scoped tasks, contacts, communication consent | PII leakage/export tests |
| Finance | Ledger, expense approvals, budgets, published aggregates | Balancing/maker-checker tests |
| Kiosk | Published prayer/event data, public-only announcements | No private record in projection |
| Notifications | Push/inbox/read/preferences/deep links | Token owner/replay and permissions |
| Profiles | Verified updates, privacy controls, export/delete requests | Account state and retention |
| Admin | Grants, reports, audit events, system health | MFA, change history, privilege tests |

## 24. Engineering decisions needing product-owner approval

Record an Architecture Decision Record (ADR) for each:

1. One organization/venue or multiple mosque locations at initial launch?
2. Which mosque authority calculates or signs off Salah and Hijri dates?
3. Is a parent self-service request allowed, or must school verify every guardian link manually?
4. What minimum student age and parental consent process apply?
5. Which roles may approve donations refunds, publish budgets and manage financial data?
6. Which school features require administrative second review?
7. What data retention and deletion timeframes are legally and operationally required?
8. Which payment methods/currencies, refund policies and fee coverage apply?
9. Should private school data be available offline at all?
10. Which announcement channels require explicit consent vs essential operational delivery?
11. Do classes/volunteer opportunities have waitlists or hard-cap rejection?
12. Which features are in the first release versus staged opt-in later?

Until answered, use safe defaults: one mosque, no implied guardian links, admin approval for sensitive roles, confidential school data online-only, strict financial separation, minimal marketing notifications, and no fabricated worship information.

## 25. Recommended immediate engineering work packages

1. **API and schema audit:** Generate all current route inventories, map current models to Section 11, identify missing FK/unique constraints, migrate one bounded use case in staging.
2. **Security remediation:** Move native tokens from AsyncStorage to protected native storage, design refresh/revocation, rotate historic secrets and test role/guardian/class isolation.
3. **Design system spike:** Implement Home/Salah/Discover core primitives with the Azure Sanctuary tokens and verify Android/iOS compatibility of NativeWind/blur/components. Keep the fallback code path stable.
4. **Salah reliability:** Introduce venue-local publication contract, adhan-vs-iqamah, Jummah and error/refresh states; confirm community approval.
5. **Payment correctness:** Inventory current float money fields, plan integer migration, sandbox webhook inbox/idempotency and reconciliation tests.
6. **Release confidence:** Add feature action registry, cross-role end-to-end tests, native device matrix, migration rehearsals, SLO dashboards and go/no-go checklist.

## 26. Source of record and implementation traceability

Use these repository sources to understand the existing system before changing it:

- `staff-web/prisma/schema.prisma` — currently implemented models and enums.
- `staff-web/src/lib/role-config.ts`, `permissions.ts`, `auth.ts`, `mobile-auth.ts`, `api-identity.ts` — current account and access logic.
- `staff-web/src/app/api/**/route.ts` — actual API routes (the endpoints in this document are proposed v1 replacements).
- `masjid-mobile/app/**`, `components/common/**`, `services/**`, `stores/**` — current native screens and state.
- `staff-web/src/app/dashboard/**` and `components/**` — current admin interface.
- `staff-web/prisma/migrations/**` — existing incremental SQL files; **do not apply blindly**.
- `SECURITY_AND_RELEASE_AUDIT.md` and `Deploy.md` — historical release gaps and operational prerequisites; verify against current deployment before relying on their status.
- `.github/workflows/verify.yml`, `staff-web/tests/e2e/**`, `masjid-mobile/__tests__/**` — current automated coverage.

### Required product backlog record

For each screen or backend service, track:
`FEATURE-ID` | priority | personas | information classification | authoritative entities | UI route | API contract | server policy | optimistic/offline behavior | observability event | tests | accessibility review | owner | target phase | staging result | release approval.

Keep status as **Not started / Designed / Building / Integrated / Verified / Released / Deprecated**. No “complete” label without test and user-acceptance evidence.

---

## 27. Final product promise

**Build one original, premium, white-and-light-blue, accessible Masjid Community platform that gives people verified information, meaningful actions and real service—and gives mosque leaders precise control without exposing private data.** Architecture, permissions, payments, education, prayer data, content, administration and design all serve that same purpose.

**No development shortcut is acceptable if it replaces real data with samples, creates a fake success, grants an unsafe relationship or risks corrupting existing financial/child records.**

**This `document.md` is the complete planning baseline for the redesign; implementation and production acceptance remain separate, measurable work.**

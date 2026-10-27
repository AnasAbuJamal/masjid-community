# SILA / صِلَة — A New Beginning
## The complete product, experience, architecture and delivery blueprint

**Document:** document.md  
**Edition:** 1.0 — clean-sheet concept, 26 October 2026  
**Working product name:** **SILA** (Arabic: **صِلَة**, connection or a meaningful bond)  
**Brand status:** Provisional. Name, domains, translations, trademarks and app-store availability require clearance before public use.  
**Status:** **Future product specification, NOT implemented code, certification, deployment or a declaration of production readiness.**  
**Source of truth:** This document supersedes the previous Masjid Community / Azure Sanctuary blueprint as the forward-looking product concept. Do not import the old architecture, routes, database names or features without a fresh decision.  
**Intended products:** SILA Mobile (iOS/Android), SILA Steward (authorized browser-based operations console), SILA Public (accessible public site), SILA Display (read-only mosque screen), and their shared API/worker platform.

> **North star:** Turn a mosque from a place people visit into a community they can belong to throughout the week—without turning worship into an attention economy, exposing vulnerable people, or making ordinary tasks complicated.
>
> **Engineering north star:** Correctness before effects. Authorization before convenience. Accessible, comprehensible flows before feature count. Every button must have an implemented, tested, truthful result.

---

# PART I — THE PRODUCT WE ARE BUILDING

## 01. Reset the idea

### 01.1 What is SILA?
SILA is a **mosque-centered community companion and operating system**. It helps people answer five simple questions:

1. **Today:** What matters at my mosque now—verified prayer times, Jummah details, closures, and a relevant next step?
2. **Gather:** Where can I meet people, attend a gathering or take part in a trusted circle?
3. **Learn:** Which age-appropriate classes, study paths and learning activities can I join or support?
4. **Care:** How can I help—or confidentially ask for help—through donations, service and supervised care programs?
5. **You:** What have I joined, what do I owe, what can I change, and what information does this organization hold about me?

The product is **not** another public social feed. It is an organized network of **trusted places, real gatherings, meaningful learning, and dignified acts of care**. Its digital side should help community life happen in person.

### 01.2 Core proposition
**For a visitor:** Reliable worship information without creating an account.  
**For a member:** One clean account for gatherings, volunteering, donations and participation.  
**For a family:** Carefully verified relationships, approved enrollment, attendance and tuition information.  
**For an educator:** A scoped, focused classroom—not an unrestricted view of children.  
**For a steward:** Confident, accountable operations: publishing, approving, scheduling and communicating.  
**For leadership:** Understand participation and service without spying on people or gamifying religion.

### 01.3 A different product logic
The old pattern was "a screen for each department." SILA instead works around **member intent**:

| Intent | First action | Trust mechanism | Real-world outcome |
| --- | --- | --- | --- |
| I want to pray | Read venue-authorized schedule | Mosque-verified revision and local timezone | Arrive at the right place/time |
| I want to meet people | Explore an event or approved circle | Moderator, capacity and safeguarding rules | Attend an authentic gathering |
| I want to learn | Browse path/program, apply | Enrollment approval and protected child records | Participate in learning |
| I want to help | Select a service shift or approved cause | Scheduling and verified payment status | Time or money makes a difference |
| I need assistance | Request a private care conversation | Restricted case intake and explicit consent | Safe human follow-up |
| I manage the mosque | Open task queue, decide, publish | Scoped permissions, audit and maker/checker | A dependable community service |

The same event, person, room or notification should never be duplicated into departmental silos. Use one canonical record and permission-aware views.

### 01.4 Four experience principles
- **Calm:** Zero endless feeds, artificial streaks, religious scores, manipulative badges or attention-maximizing notifications.
- **Human:** Digital workflows end in a meeting, answer, check-in, class, service or receipt. Avoid "submit and disappear" experiences.
- **Trustworthy:** Label the source and status of prayer times, schedules, financial transactions and official announcements.
- **Inclusive:** An older person, a first-time guest, a busy parent, a screen-reader user and an Arabic-speaking member must all understand what to do.

### 01.5 Success is not download count
Use a small, privacy-preserving scorecard: percentage of prayer-day records verified on time; event check-ins versus RSVP; time to close a care request; approved school enrollments with signed guardian evidence; service shifts completed; receipt accuracy; successful task completion; accessibility defect count; security exceptions; user-reported trust. No individual religiosity scoring, leaderboards, inferred beliefs or covert location tracking.

---

## 02. Naming and brand architecture

### 02.1 Working identity
- **Umbrella:** SILA / صِلَة.
- **Consumer app:** **SILA**. Descriptor: *Your place, your people, your moments.*
- **Staff product:** **SILA Steward**. Descriptor: *Organize with care.*
- **Public presence:** **SILA Public** (normally branded as the mosque's own website).
- **On-premise read-only view:** **SILA Display**.
- **Internal product platform:** SILA Core (not a marketed consumer product).

The mosque's **own legal name and identity remain primary**. SILA is an enabling system, not a substitute for local community identity. White-labeling is possible later through organization-bound design tokens and verified content.

### 02.2 Naming rules
Use understandable words; do not use internal database terms in menus:
- **Gathering**, not EventRSVP.
- **Circle**, not GroupMembership.
- **Learning Path**, not SchoolProgramType.
- **Service Shift**, not VolunteerOpportunitySlot.
- **Care Request**, not CRM Ticket.
- **Steward**, not Super User.
- **Contribution**, not CheckoutSession.
- **Receipts**, not Payments API.

The UI should distinguish: **requested, awaiting review, confirmed, active, completed, declined, canceled, refunded**. Never present a requested reservation or submitted payment as completed.

### 02.3 Brand personality
Warm, composed, intelligent, spiritually respectful, never theatrical. Avoid cliché mosque clip-art, decorative Arabic text used without linguistic review, gold gradients, borrowed Apple assets, marketing noise or flashy glass everywhere. Visual authenticity comes from hierarchy, material, typography, clarity and humane detail.

### 02.4 Naming clearance gate
Before publishing SILA publicly: trademark search by a qualified professional in target jurisdictions and software classes; domain and social handle checks; app-store conflict search; native Arabic proofreading; potential negative connotations in languages served; written owner approval. **SILA is a working name, not a promise of legal availability.**

---

## 03. Who uses the product

| Persona | Principal goal | Default access | Highest-risk consideration |
| --- | --- | --- | --- |
| Guest | See prayers, visit, browse public events | Anonymous public records | No forced registration |
| Member | Join gatherings, give, serve, manage profile | Verified own account | Private data minimization |
| Guardian | Apply for child, view authorized reports and invoices | Verified guardian relationship | Child safeguarding and custody changes |
| Student | Access assigned work via age-appropriate account | Self plus school scopes | Minor permissions and consent |
| Teacher | Manage assigned cohorts and attendance | Cohort/subject scopes | Zero cross-class disclosure |
| Program host | Manage own gathering or circle | Explicit program grant | No organization-wide access |
| Volunteer coordinator | Staff service calendars and check-ins | Assigned service-area grant | Identity validation |
| Care coordinator | Review restricted requests | Restricted named case scope | Extreme confidentiality |
| Finance maker/checker | Handle contributions, requests, approvals and ledger | Financial actions with separation of duty | Funds and donor identities |
| Worship editor | Update authorized venue schedules | Venue-scoped publishing | Time accuracy and urgent corrections |
| Organization steward | Configure org, staff, policies and review queues | Organization scope, MFA | Privilege management |
| Auditor | Read approved audit/reconciliation artifacts | Expiring read-only access | No write capability |
| Platform operator | Maintain infrastructure, not browse private case data | Break-glass operations only | Cross-tenant protection and audit |

A single person may have **multiple scoped assignments** in one or several organizations; do not force all privileges into a mutable "one role" column. Primary app navigation is based on current context and authorized actions.

---

## 04. Product boundaries and ethical decisions

### 04.1 Launch product: complete but focused
The first production version includes trusted worship schedules, events/gatherings, moderated circles, learning/enrollment, private guardian views, volunteering, contributions/tuition, receipts, controlled care intake, multilingual discovery, official announcements, a serious steward console and a safe public website. A business workflow is included only when it has a realistic **complete lifecycle** and an accountable human owner.

### 04.2 Deliberately not a first-release feature
- Open public chat/DMs with strangers; anonymous social streams; child-to-adult unmoderated messaging.
- Prayer streaks, "who prays most" charts, religion-based rankings or sensational engagement loops.
- Marketplace jobs and paid space rentals, unless leadership validates operations, policies, support and refund obligations.
- Automatic religious rulings, fatwas or moon-sighting declarations from an AI model.
- Automated approval of financial assistance, child custody, educational discipline or expense reimbursement.
- Collecting detailed medical or welfare histories without a defined program, trained case owner, retention policy and legal review.
- Vendor lock-in via opaque proprietary database formats; premature microservices.

These may later be assessed with problem statements, safeguards and independent acceptance gates. Do not quietly introduce them because they existed in the previous code.

### 04.3 Core rules
Every proposed feature needs: target persona, evidence of demand, success criterion, sensitivity classification, object ownership, access policy, UI states, API contract, data model, negative tests, operating owner, and recovery path. If any is missing, implementation is not ready.

---

## 05. The five experiences

### 05.1 TODAY — a reliable starting place
First surface, usable without sign-in:
- **Now card:** Local date, assigned venue, next published prayer and source timestamp; never fabricate unpublished times.
- Prayer schedule by venue with iqamah alongside adhan, Jummah sessions, exceptional holiday schedules and seasonal adjustments.
- **One consequential message**, such as a confirmed closure or changed Jummah time, visually prioritized over routine announcements.
- Personal next step **only after login and opt-in**: confirmed gathering, upcoming shift, due learning task.
- "Directions to venue" may open platform maps; no continuous GPS collection.
- Accessible Qibla: compass if permission granted, explanatory manual fallback; say when compass accuracy is uncertain.
- Ramadan/Eid and moon-sighting announcements sourced from explicitly approved mosque records, never guessed.

### 05.2 GATHER — actual community, not a feed
- Browse curated, public gatherings: lectures, youth events, meals, Jummah community programs and special events.
- Search and filter by date, venue, audience, accessibility accommodations and category.
- A gathering has a host, status, visibility, start/end in venue timezone, location, capacity/waitlist policy, RSVP deadline and cancellation terms.
- RSVP once, cancel within rules, receive truthful confirmation and optional calendar export.
- Attended vs merely registered is distinct; authorized hosts check in by roster or short-lived code.
- **Circles** are sustained, moderated groups (e.g., sisters' learning circle, new-neighbor welcome, volunteer crew). Members request access; an approved host manages attendance, calendar and carefully moderated updates. No public member directories by default.
- Guest access for public gatherings; sign-in at the precise point needed to reserve or join.

### 05.3 LEARN — structured, respectful growth
- **Learning Paths** group goals, programs, sessions and resources; users understand prerequisites, ages, language, dates and availability.
- Adult enrollments can be self-managed; child enrollments require verified guardian requests and school approval.
- Teachers have assigned rosters, attendance, session notes, assignments and reviewed progress reports.
- Student work is visible only to the student and authorized teacher(s); approved guardians see only appropriately shared progress.
- School fees, concessions, invoices and attendance are separately secured from community-wide volunteer/event data.
- Uploads undergo type checks, scan/quarantine and signed-URL access; no raw public child files.
- Attendance corrections and report publication are versioned, attributable actions with a challenge or appeal process.

### 05.4 CARE — dignity through clear requests
- Two modes: **Give time** (volunteer programs, shifts, training, check-in) and **Give funds** (verified causes, donation and tuition invoices).
- **Ask for support**: optional, private referral intake for approved organizations with trained staff; minimum fields, clear confidentiality scope, urgent-help disclaimers and human response targets.
- A donor sees an amount, designated program, currency, recurring terms (if supported), provider status, receipt and refund policy before committing.
- A volunteer applies, is approved, chooses or receives a shift, confirms it, and sees attendance history.
- Admins never display identifiable care cases on a TV, public dashboard, general leader summary or routine push.
- Case decisions stay human-led. Do not model welfare recipients as a marketing audience.

### 05.5 YOU — ownership and clarity
- Account identity, selected mosque and venue, language, text-size support, notifications and consent settings.
- "My commitments": upcoming gatherings, circles, learning, service and a small timeline of relevant changes.
- Own invoices, receipts and transaction statuses; explicitly show provider-pending versus completed.
- Accessible account recovery, device sessions, sign out everywhere, data export and a reviewed privacy/deletion request path.
- Dependents are visible only via explicit active GuardianLink evidence with revocation; no email-address inference.
- Easy sign out; there are no dark patterns to retain or delete data.

---

## 06. The companion surfaces

### 06.1 SILA Mobile
A native-feeling, five-tab experience: **Today • Gather • Learn • Care • You**. Worship is the highest-visibility destination inside Today and always reachable with a one-tap prayer shortcut. The user's authorized staff tools appear only inside an explicit **Switch to Steward** mode, never as random member actions inside public cards.

### 06.2 SILA Steward
One browser console designed around **work queues and responsibilities**, not 40 dashboard tiles:

- **Overview:** exceptions, today's schedule, actions awaiting review, safe totals.
- **Worship:** venues, prayer revisions, Jummah, Eid/Ramadan verification.
- **Gatherings:** events, circles, RSVP, check-in, venues.
- **Learning:** paths, cohorts, enrollment decisions, attendance and reports.
- **Service:** shifts, hosts, facilities relevant to the program, restricted care cases.
- **Treasury:** receipts, donations, invoices, journals, reconciliation and requests.
- **Publishing:** announcements, public pages, bilingual content, preview and approval.
- **People:** memberships, invitations, guardianship verification, delegated access.
- **Insights:** aggregate operational KPIs without child/care-case leakage.
- **Settings:** organization, locales, provider health, data policies and audit access.

Navigation is filtered by scoped capabilities. A volunteer coordinator must not even load the Treasury's underlying data; a finance role cannot self-approve refunds.

### 06.3 SILA Public
An accessible, indexable organization website: visit information, published worship schedule, official notices, gatherings, class catalog and transparent approved fundraisers. Anonymous guest content and authenticated member content are separated by the server, not by hiding elements with CSS. Give every public item a shareable canonical URL; render critical worship content without JavaScript dependence where practical.

### 06.4 SILA Display
A strictly read-only, kiosk-optimized view: mosque name, venue, today's verified prayer and Jummah times, urgent approved notices, select public gatherings. Device credentials are read-only and scoped; never expose emails, private RSVP counts, donation history or attendance. Support automatic revalidation, stale-content banner and manual emergency blanking.

---

## 07. User journeys and definitions of successful outcomes

### J01 — First visit
Open the app → see correct public mosque/venue name → view today and next prayer → inspect source and timezone → get directions → optionally choose default venue. **No account required**, no fictitious data if schedule missing.

### J02 — Join a gathering
Browse → open real event → read venue, date/time, language, price (if any), accessibility, waitlist and policies → sign in only at reservation → submit idempotent RSVP → get confirmed/waitlisted state → see own commitment → optional reminder → staff check-in → attendance reflected correctly.

### J03 — Participate in a circle
Read public outline → request to join → host reviews against group rules → approved membership appears under Gather → view only approved circle content → leave or request removal. Private rosters stay private; no strangers' contact list.

### J04 — Enroll a child
Verified adult initiates application → consent/safeguarding notices → minimal child details → review queue → authorized staff checks evidence *outside public UI* → approves/rejects with reason → creates verified guardian link and independent enrollment → family sees scoped school dashboard → revoke relationship immediately on verified custody change.

### J05 — Record learning
Assigned teacher opens assigned cohort → marks an authorized student present/absent → correction with reason and audit → drafts progress feedback → publishes to chosen authorized audience → guardian/student views only applicable records.

### J06 — Give once
Select approved cause → amount in exact minor units → confirm terms → launch hosted provider checkout → return shows "processing" until signed webhook → verified receipt and ledger posting once → staff reconciles payout → refund requests follow two-person approval and provider confirmation.

### J07 — Give recurring (not silently enabled)
User explicitly selects recurring terms and cancellation policy → provider mandate/subscription confirmation → each period has its own transaction and receipt → webhooks update installment status → clear cancellation and payment failure path. Do not include recurring checkbox without a finished lifecycle.

### J08 — Serve the community
Choose opportunity → apply → staff checks program eligibility → approve → select/assign shift → reminders with opt-in → check-in by authorized coordinator → log hours as factual records (not religious merit) → corrections require reason.

### J09 — Ask for confidential assistance
Read scope and limitations → consent to restricted data processing → submit minimum-information request → private receipt/reference → case coordinator reviews → assign human owner and contact next step → close with minimal retained outcome. No triaging sensitive details in ordinary email or analytics.

### J10 — Publish an urgent change
Venue editor edits draft schedule → permissioned reviewer approves (dual control for high-impact notices) → atomically publish a new revision → invalidate caches/display → notify opted-in affected people → audit previous/new values and actor; display a clear "last verified" timestamp.

### J11 — Steward joins the organization
Admin sends expiring invitation for one organization and scoped capability set → new user verifies identity and MFA when required → confirms acceptance → steward can access only assigned workspaces → revocation invalidates sessions, active jobs and fresh requests.

### J12 — Close a family relationship
Privacy officer validates documented guardianship change → revokes GuardianLink → all read paths, cached queries, scheduled notifications and file URLs stop exposing the child → existing audit and legally retained accounting references remain controlled.

### J13 — Recover from provider outage
Member starts payment or publishes a request while provider is unavailable → client shows pending or retryable error, not success → durable retry/incident queue → idempotent replay → support sees exception and trace ID → customer sees corrected state without double charge.

### J14 — Use Arabic / accessible controls
Select العربية → layout respects RTL, labels, numerals and reading order; prayer/date information remains semantically correct → switch back to English without sign-out or lost work → VoiceOver/TalkBack exposes descriptive actions and state.

---

## 08. Product governance and nonfunctional promises

Every organization adopts a written content charter, refund policy, safeguarding policy, staff access review and privacy contact. High-impact changes require explicit approval. Every external provider has a failure-mode plan. Every "success" screen is backed by a durable result, not a local animation.

Initial suggested performance/service targets are **engineering goals**, not measured guarantees: API p95 under 400 ms for healthy cached reads excluding third-party latency; public schedule availability target 99.9%; critical payment callback acknowledgment and reconciliation monitored; crashes below 0.5% of active sessions; first content usable within 2.5 seconds on representative midrange devices after warm start. Set real service-level objectives and alert thresholds after load testing, not by wishful claims.

---

# PART II — INTERFACE, DESIGN SYSTEM AND INFORMATION ARCHITECTURE

## 09. The visual system: "Quiet Radiance"

The aesthetic must be **modern, beautifully restrained, confident and human**, not the old ice-blue glass redesign. Its vocabulary comes from natural light, architectural rhythm, handcrafted paper and generous breathing room. It should feel like a premium cultural institution, not a finance template or a game.

### 09.1 Visual direction
- **Canvas:** warm porcelain with rare soft mist-blue surfaces; dark-ink typography; clear, purposeful emphasis.
- **Signature detail:** a subtle, original "connection line" motif, never stolen geometric ornament. Avoid predictable domes, crescents used as generic religious clip-art or decorative scripture.
- **Surface treatment:** primarily opaque for legibility. Translucency only for contextual overlays if readability, reduce-transparency settings, power use and device support allow.
- **Cards:** fewer, larger, more useful. The design should not turn every line of information into a bordered tile.
- **Imagery:** documentary community photography only with informed permission, especially for minors; otherwise illustration rooted in objects, materials and spaces, not generated fake worshippers passed off as real attendees.
- **Emphasis:** let genuine changes ("Jummah moved to 1:30 PM") interrupt visual rhythm; routine content stays calm.
- **Identity:** organization logo and authorized photography are first-class; system branding should not dominate the mosque.

### 09.2 Semantic design tokens (starting values, subject to measured contrast)
| Semantic token | Light theme | Dark theme proposal | Use |
| --- | --- | --- | --- |
| Canvas | #FBFCFA | #0E1920 | App background |
| Surface | #FFFFFF | #17262E | Forms and cards |
| SurfaceSoft | #EFF5F5 | #1D3038 | Contextual panel |
| Ink | #142A35 | #EEF4F5 | Main text |
| InkMuted | #506570 | #B0C2C8 | Secondary content, check contrast |
| Primary | #236C83 | #8DCADD | Links, primary CTA and selected state |
| PrimaryTint | #E1F0F2 | #183943 | Soft emphasis |
| AccentWarm | #B17D51 | #DDB38D | Very sparing editorial accent |
| Success | #246C54 | #8AD8B6 | Durable confirmed outcomes |
| Warning | #975817 | #F0BC78 | Pending, risk or attention |
| Danger | #AA3E43 | #FFA4A6 | Destructive and validation |
| Outline | #DCE5E7 | #354850 | Structural borders |
| Focus | #185C7A | #B5E9F1 | Visible keyboard focus |

**Never assume these hex values pass every WCAG contrast pairing.** Generate and audit the full token matrix for 4.5:1 normal-text contrast, 3:1 large text and required UI boundaries where applicable. Prefer APCA-aware visual review as supplementary, not a replacement for the project's WCAG criterion. Express colors via semantic variables; features must never hard-code their own palette.

### 09.3 Typography
- Latin: high-quality accessible system sans for everyday UI (San Francisco on Apple where available, Roboto/appropriate system sans on Android, modern system fallback on web). A licensed editorial display face is optional for large headlines only.
- Arabic: professionally tested Arabic UI family with excellent shaping and numerals (e.g., Noto Sans Arabic when licensing/distribution and platform rendering are validated); never use a Latin font fallback that breaks diacritics.
- Type scale: caption 12–13; body 16; secondary 14; label 15; card title 20; screen title 30–36; hero 40–48 on large surfaces. All are scalable, not fixed px ceilings.
- Line height: body roughly 1.45–1.6, adapted to Arabic metrics and dynamic text settings. Do not truncate money, schedules, emergency notices or form errors.
- Font weights: reserve heavier weights for hierarchy, not entire screens.

### 09.4 Space, geometry and motion
- Spacing steps in density-independent points: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Minimum touch target: plan for 48×48 dp on Android and comfortable iOS accessibility targets; visually small icons may have larger hit areas.
- Corner radii: control 12, card 20, sheet 28, full-pill for a very small subset of actions. Avoid 30 different radii.
- Shadows: subtle elevation, only when needed to distinguish layer. Stronger borders in dark/high-contrast mode.
- Motion: 120–180 ms state transitions, 200–300 ms navigation/layer transitions where platform-appropriate. Prefer opacity/transform. Respect Reduce Motion; no bouncing donation confirmations.
- Haptics: optional light acknowledgement on confirmed action, never required feedback and never the sole indicator.
- Platform conventions: iOS and Android may differ for sheets, date pickers, gestures, typography and system navigation. Consistency means shared intent and hierarchy—not pixel-identical native imitations.

### 09.5 Icon and illustration policy
Use one licensed icon family per surface with consistent stroke weight, mirrored directional icons in RTL, and accessible labels. Design a small proprietary motif set, export as vectors with provenance. Never embed font files or imagery without ownership/licensing verification.

### 09.6 Component inventory and contracts
| Component | Core behavior | Required states |
| --- | --- | --- |
| ScreenHeader | Title, optional back, context switcher, trailing action | Compact/expanded, RTL, loading |
| NextPrayer | Venue/date/source, adhan+iqamah | Published, missing, changed, stale, offline |
| GatheringCard | Location, audience, time, capacity, action | Open, full, waitlisted, canceled, ended |
| CircleCard | Host, cadence, participation policy | Open, review required, member, archived |
| LearningPath | Milestones, age band, prerequisites | Available, closed, enrolled, completed |
| ServiceOpportunity | Eligibility, date and shift | Apply, approved, scheduled, complete |
| ContributionForm | Cause, amount, period, processor | Validation, pending, verified, error |
| ReceiptSheet | Official receipt number and source | Paid, partially refunded, fully refunded |
| CareIntake | Short and private form, consent | Draft, sending, received, responded |
| WorkQueueItem | Priority, reason, owner, due time | New, assigned, blocked, resolved |
| ReviewDialog | Facts, evidence reference, decision reason | Confirm, reject, conflict, audited |
| InlineNotice | Accessible announcement and remediation | Info, warning, error, success |
| EmptyState | Explain next possible user action | Legitimately empty, forbidden, offline |
| SearchPanel | Query with filters and keyboard support | Loading, results, empty, error |
| FormField | Label, description, errors and input | Default, focus, invalid, disabled |
| IdentitySwitch | Active organization/venue/role | Switching, forbidden, active |
| DataTable | Search/sort/filter, action menu | Loading, empty, paginated, keyboard |
| BottomSheet | Focus-managed supplemental workflow | Expanded, compact, dismiss blocked |
| ActivityTimeline | Structured change history | Pending, completed, correction, revised |
| Skeleton | Avoid misleading layout jump | Loading only, no fake content |

Each component must have screenshots for light/dark, EN/AR, loading/empty/error, extreme text scale and screen-reader reading order before design sign-off.

---

## 10. Mobile layout and navigation

### 10.1 Global shell
Use five fixed tabs (Today, Gather, Learn, Care, You). Avoid nesting tabs inside tabs. A compact top header shows the current mosque/venue with a clearly discoverable switcher. Account status appears only where relevant. Route stacks and modals should work with deep links and back gestures. All data fetching occurs through typed services, never directly inside view components.

### 10.2 Mobile screen map
~~~text
Root
├── Public startup / select mosque and venue / privacy notice
├── (tabs)
│   ├── today
│   │   ├── next prayer / verified daily timings
│   │   ├── venue switcher / directions
│   │   ├── prayer calendar / Jummah / Qibla
│   │   └── Ramadan, Eid and emergency notices
│   ├── gather
│   │   ├── curated gatherings / filters / details / RSVP
│   │   ├── commitments / check-in
│   │   └── circles / circle details / request / member view
│   ├── learn
│   │   ├── learning paths / cohorts / schedule
│   │   ├── enrollment request and status
│   │   └── guardian or student learning workspace
│   ├── care
│   │   ├── serve / applications / shifts
│   │   ├── give / contributions / receipts
│   │   └── ask for help / confidential intake (where enabled)
│   └── you
│       ├── upcoming commitments / activity
│       ├── dependents and linked accounts
│       ├── transactions / receipts
│       ├── language, access, consent and notifications
│       └── account security / data rights
├── Authentication and verification
│   ├── sign in / registration / email confirmation
│   ├── account recovery / elevated challenge
│   └── consent and invitation acceptance
└── Authorized stewardship mode (optional, tightly scoped)
    ├── my action queue / assigned activities
    ├── check-in / limited roster
    └── quick publish actions (restricted)
~~~

### 10.3 Mobile implementation rules
- Show public schedule before login; do not send someone through an account wall to check prayer times.
- A context switch must invalidate organization/venue-scoped cache, listeners and offline snapshots; never display prior mosque private details under a new header.
- Request location only on explicit "use my location" action. City/venue selection must work without location. Store no route history.
- Forms preserve unsent drafts locally with expiration when appropriate, but private care/intake drafts must never be stored unencrypted.
- Loading shows measured skeletons, not fabricated people or prefilled donation amounts.
- Every screen has a retry and a clearly labeled stale/offline state when applicable.
- Accessible login and account recovery are mandatory; passkeys are preferred when provider and platform support are verified.
- Full deep-link test matrix: guest, authenticated, expired, revoked, unknown org, unavailable record and cross-org target.
- File/document download uses short-lived scoped URLs, safe filename handling and share-sheet privacy copy.

### 10.4 Navigation anti-patterns
No route or button should be hidden behind an unlabeled icon; avoid giant floating action buttons, nested carousels, obligatory onboarding tours, menu duplication, animated backgrounds, unexplained premium controls or money totals shown without units.

---

## 11. Steward console layout

### 11.1 Core desktop shell
- Persistent left nav by authorized domain, top organization selector, user role/context, universal scoped search and inbox/notifications.
- Home emphasizes **what needs decision**, with date/time and affected group, not vanity charts.
- Tables: sticky headers, contextual filters, saved (permission-safe) views, pagination and keyboard actions; no hidden critical action behind hover only.
- Details: split pane if desktop width allows; drawer/sheet for quick edits; dedicated route for complex reviews, finance and safeguarding.
- Forms: clear section breaks, contextual field descriptions, autosave only for drafts, explicit publish transaction. Never autosave a child custody decision or payment refund.
- Availability/status: all queues show unassigned/in review/blocked/completed with filters; cases have named responsible owners.

### 11.2 Steward routes (conceptual, not a promise of existing files)
~~~text
/console
  /overview
  /worship/{venues,prayers,jummah,notices,approvals}
  /gather/{events,circles,checkins,venues}
  /learn/{paths,cohorts,enrollments,attendance,assignments,reports}
  /care/{volunteers,shifts,requests,case-reviews}
  /treasury/{contributions,invoices,payments,receipts,journals,
             settlement-reconciliation,refunds,disputes,budgets}
  /publish/{pages,announcements,translations,media,approvals}
  /people/{memberships,invitations,guardianship,access-reviews}
  /insights/{attendance,participation,operations}
  /settings/{organization,locales,policies,integrations,audit}
~~~

### 11.3 Operational UX patterns
- **Review queue:** item name, sensitivity, action needed, time since submission and owner.
- **High-impact publishing:** draft → compare changes → preview per venue/language → independent approval where policy requires → publish revision → notify affected audience → audit.
- **Finance:** separate maker/checker; money displayed in minor-unit-safe formatted locale currency; never derive fund balance from requested donations.
- **School:** never show all children in global search by default; teachers search only assigned cohorts; staff exceptions require a documented delegation.
- **Care:** confidential records have a separate navigation context, no preview snippets in browser notifications or general search.
- **Analytics:** aggregation threshold for small groups, controlled export, retention rules and explicit definition of denominators.

---

# PART III — TECHNICAL FOUNDATION

## 12. Architecture decision: one modular product core

### 12.1 Why this structure?
Build a **TypeScript monorepo with a separately deployable, modular monolith API**. Mobile, web and kiosk consume the same versioned public contracts. One transactional PostgreSQL database is authoritative. A durable worker handles asynchronous side effects. This is simpler to operate and reason about than splitting ten services before there are actual scaling needs.

**Decisions**
- **Client:** Expo/React Native with Expo Router and platform-appropriate native components.
- **Steward/public web:** Next.js with server-side rendering for public content and authenticated, permission-checked console routes.
- **Backend:** Node.js TypeScript, Fastify (with schema validation and typed OpenAPI contract) organized by domain. Alternative frameworks require an explicit ADR, never by default.
- **Database:** PostgreSQL with explicit transaction boundaries and migration history; an ORM/query builder chosen after a short validation spike (default Prisma for velocity with raw SQL only for measured needs).
- **Async:** Postgres-backed durable queue/worker initially (avoid a second persistence system unless throughput warrants it).
- **Cache:** CDN/public schedule cache with bounded TTL and revision-key invalidation. No public caching for private records.
- **Storage:** private object storage, encrypted and key-scoped, with signed downloads and file scanning.
- **Payments:** regulated hosted payment processor integration, never store card numbers or CVC.
- **Observability:** OpenTelemetry-compatible traces/metrics, structured logs with redaction, alerts and audit events separated from application debug logs.

Do not hard-code transient "latest" framework versions. At project creation, pin **supported stable versions** to an ADR and lockfile, verify Expo/native compatibility, and schedule dependency/security upgrades.

### 12.2 Logical architecture
~~~text
[SILA Mobile]       [SILA Steward]      [SILA Public / Display]
      |                    |                     |
      +-------------- HTTPS / TLS ---------------+
                           |
                   [API Edge / Gateway]
             authenticated tenant + policy context
                           |
                 [SILA Core Modular API]
  identity | organizations | worship | gatherings | circles
  learning | service | care | treasury | publishing | search
                           |
        +------------------+------------------+
        |                  |                  |
   [PostgreSQL]      [Private Objects]   [Outbox/Jobs]
        |                                     |
        +--------------------[SILA Worker]----+
                                       |
                    Email / Push / Payment Webhooks
                         with retry + observability
~~~

Each module owns its data access and domain rules. **UI → application service → domain policy → repository → DB**. No client imports Prisma. The API never depends on React components. The worker reuses application/domain contracts but not HTTP route handlers.

### 12.3 Monorepo layout (brand-new target)
~~~text
/
├── document.md
├── apps/
│   ├── mobile/                    # Expo Router
│   │   └── src/{app,features,components,services,state,i18n,assets}
│   ├── steward/                   # Next.js permissioned operator console
│   │   └── src/{app,features,components,lib}
│   ├── public/                    # Next.js public website + display mode
│   └── storybook/                 # Component examples/test surfaces
├── services/
│   ├── api/                       # Fastify, domain modules, OpenAPI
│   │   └── src/{bootstrap,modules,platform,policies}
│   └── worker/                    # Outbox + jobs + reconciliation
├── packages/
│   ├── contracts/                 # Versioned request/response schemas
│   ├── design-tokens/             # Semantic cross-platform tokens
│   ├── ui-native/                 # Reusable accessible RN primitives
│   ├── ui-web/                    # Web component library
│   ├── i18n/                      # Shared messages and locale formatters
│   ├── test-kit/                  # Test factories, fixtures, simulators
│   ├── config/                    # TS, lint, format and policy config
│   └── shared/                    # Safe pure utilities ONLY
├── infra/
│   ├── deploy/                    # Environment definitions, IaC
│   ├── monitors/                  # Alerts, SLOs, runbooks
│   └── policies/                  # Data access + retention controls
├── docs/
│   ├── adr/                       # Architecture decisions
│   ├── api/                       # Generated OpenAPI + examples
│   ├── runbooks/                  # Incident, restore, deployment, keys
│   ├── threat-model/              # Data flows, risks, mitigations
│   └── design/                    # Tokens, accessibility, content style
├── .github/workflows/
└── root package/lock/workspace configuration
~~~

**Repository rules:** strict TypeScript; ESLint and consistent formatting; workspace-level dependency boundaries; conventional commits; code ownership for sensitive modules; protected mainline release branch when eventually introduced; no generated secrets, node_modules or platform credentials in Git. Keep the existing Git branch arrangement intact until expressly authorized to change it.

### 12.4 Domain module template
~~~text
modules/gatherings/
  domain/
    event.ts                  # invariants, state transitions
    policies.ts               # scope and access logic
  application/
    create-gathering.ts       # use case
    reserve-seat.ts
  infrastructure/
    gatherings-repository.ts  # DB adapter
    calendar-projection.ts
  transport/
    gatherings.routes.ts      # input validation / HTTP mapping
  tests/
    reserve-seat.test.ts
    policies.test.ts
    api.contract.test.ts
~~~

Controller routes do **not** make authorization decisions with role strings alone. Domain-level policy functions receive the current actor, organization, scope and target resource; all paths use them.

---

## 13. Data ownership, organization scoping and identity

### 13.1 Tenancy model
- Every business-owned record has an immutable **organizationId** where applicable; venues, cohorts, roles and financial accounts are children of one organization.
- Person identity and organization membership are different objects. One identity may be a teacher in Org A and a member in Org B.
- An API request specifies an active organization through a validated route/subdomain/tenant context, **never by trusting a submitted organizationId**.
- Membership-scoped policies filter both list and individual read/write paths. Authorization for a single record must not use a global "is staff" shortcut.
- Use explicit tenant tests for every sensitive module and consider PostgreSQL row-level security as a second line of defense for selected tables.
- Audit identity always includes actor, organization, action, object and outcome, even for denied sensitive operations where logging is safe.
- No multi-tenant production launch without adversarial cross-tenant E2E tests and audited service-account scope.

### 13.2 Identity objects
- **Identity:** auth provider subject and verified authenticators; not the same as member profile.
- **Person:** optional natural person record with verified email/phone claims and display name.
- **Membership:** relationship of a person/identity to a particular organization, with lifecycle state.
- **CapabilityGrant:** action, scope kind/id, issuer, expiry, revocation and verification requirement.
- **GuardianLink:** student-person relation with evidence status, approval actor, effective period and revocation. An email match **never** creates guardianship.
- **StudentProfile:** restricted record and privacy/age flags; not automatically a sign-in account.
- **Session:** verified assurance level, client/device metadata, rotation state and revocation.
- **Invitation:** one-time, expiring, organization-bound, least-privilege proposed grants.

### 13.3 Authorization grammar
Permissions should describe **capability + resource + scope**, not page names:

- view:public-prayer@venue:123
- edit:venue-schedule@venue:123
- approve:schedule@venue:123
- manage:gathering@gathering:456
- mark:attendance@cohort:789
- view:student-record@student:789 (only after GuardianLink or enrollment/teacher policy)
- decide:care-request@care-team:3
- post:journal@organization:12
- approve:refund@organization:12 (must differ from requester)

These are illustrative policy semantics, not actual authorization token strings. Never trust app navigation guards as a substitute for server-side checks.

### 13.4 Deny-by-default matrix
| Sensitive resource/action | Member | Guardian | Teacher | Host | Care staff | Finance | Org steward |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public prayer and gatherings | Read | Read | Read | Read | Read | Read | Read |
| Own RSVPs/cancel | Own | Own | Own | Own | Own | Own | Own |
| Circle private roster | No | No | No | Assigned circle | No | No | Per documented audit reason |
| Child record | No | Verified linked child only | Assigned learner and field subset | No | No | Only designated billing fields | Explicit school authority only |
| Approve guardian link | No | No | No | No | No | No | Scoped safeguarding reviewer |
| Confidential care case | No | No | No | No | Assigned case only | No | Only designated privacy supervisor |
| Donation receipt | Own | Own | Own | Own | Own | Authorized fund reconciliation | Only if separately granted |
| Approve own refund/expense | Never | Never | Never | Never | Never | Never | Never |
| Worship publish | No | No | No | No | No | No | Venue editor/approver grant |
| Manage roles | No | No | No | No | No | No | MFA + organization grant |

The table is the minimum, not an exhaustive override. More restrictive policy wins when role and scope conflict.

---

## 14. Data platform and relational model

### 14.1 Fundamental conventions
PostgreSQL is the source of truth. Every table gets stable UUID/ULID-style identity; timestamps are timezone-aware UTC instants; display dates for worship use **venue-local dates** separately; monetary values use integer minor units with ISO 4217 currency; server owns authoritative timestamps. Use foreign keys, check constraints, unique/exclusion constraints, optimistic version fields and indexed scope keys. No floating-point money, magic booleans for complicated workflows or deleted rows hiding audit history.

### 14.2 Core identity and trust tables
| Table | Representative fields / constraints |
| --- | --- |
| identities | id, provider, providerSubject unique, createdAt, state |
| authenticators | identityId, type/passkey/TOTP, encrypted reference, verifiedAt, lastUsed |
| sessions | identityId, refreshTokenHash, assuranceLevel, createdAt, rotatedAt, revokedAt, expiresAt |
| organizations | id, slug unique, legalName, displayName, defaultLocale, timezone, status |
| venues | organizationId, code, name, location, timezone, accessibility, status; unique(org,code) |
| people | id, preferredName, contact references and privacy flags |
| memberships | organizationId, personId, status, joinedAt; unique(org,person) |
| capability_grants | membershipId, action, scopeType, scopeId, issuedBy, expiresAt, revokedAt |
| invitations | organizationId, recipientHash, proposedGrants, expiry, acceptedAt, tokenHash unique |
| consent_records | personId, purpose, documentVersion, actor, granted/revoked timestamp |
| guardian_links | orgId, guardianId, studentId, evidenceRef, approvedBy, activeFrom/to, revokedAt |
| audit_events | orgId, actor, action, target, outcome, redactedDiff, requestId, occurredAt; append-only |

### 14.3 Worship tables
| Table | Fields and rules |
| --- | --- |
| prayer_schedule_sources | organizationId, venueId, calculation/source attribution, validation policy |
| prayer_days | venueId, localDate, adhan fields, iqamah fields, revision, source, publishedAt; unique(venue,date,revision) |
| jummah_sessions | venueId, localDate, ordinal, khutbahTime, iqamahTime, language, room, revision |
| faith_notices | orgId, category, confirmedLocalDate, bodyLocale, approval, publish window, revision |
| venue_closures | venueId, reason/public copy, startAt/endAt, severity, approval |
| schedule_publications | venueId, day/range, revision, reviewedBy, publishedBy, supersededBy |

Store prayers as validated local clock times with timezone and source; do not treat naive Date objects or device-local UTC conversions as canonical.

### 14.4 Gatherings and circles
| Table | Key relations |
| --- | --- |
| gatherings | orgId, venueId, ownerMembershipId, capacity, audience policy, status, version |
| gathering_sessions | gatheringId, startAt/endAt, room, timezone, capacity override |
| reservations | sessionId, membershipId, state, createdAt, idempotencyKey; unique active reservation rule |
| waitlist_entries | sessionId, membershipId, rankedAt, offerExpiresAt, state |
| attendance_events | sessionId, membershipId, checkedInAt, actorId, correctionVersion |
| circles | orgId, hostMembershipId, purpose, visibility, audience, cadence, moderationPolicy |
| circle_memberships | circleId, membershipId, requested/approved/left, approvedBy |
| circle_updates | circleId, authorId, content revision, publication state, visibility |
| rooms | venueId, resources, capacity, accessibility, availability constraints |

Capacity must be atomic in the DB transaction with a lock/constraint, not a number incremented in independent read/write requests. Event changes affect RSVPs and waitlists through explicit transition rules.

### 14.5 Learning and child protection
| Table | Key relations |
| --- | --- |
| learning_paths | orgId, name, language, ageBand, curriculum summary, published revision |
| learning_programs | pathId, cohort rules, prerequisites, tuition policy |
| cohorts | programId, venueId, schedule, teacher grants, capacity, lifecycle |
| student_profiles | orgId, personId optional, guardian requirements, restricted fields |
| enrollment_requests | orgId, program/cohort, guardian applicant, student minimal profile, review state |
| enrollments | studentId, cohortId, effective dates, state; unique active per cohort/student |
| session_attendance | cohortSessionId, studentId, status, markedBy, reason, version |
| learning_tasks | cohortId, title, body, dueAt, publish audience, revision |
| task_submissions | taskId, studentId, restricted content, submittedAt, teacher feedback |
| progress_reports | studentId, cohortId, author, approved audience, status, publishedAt, revision |
| safeguarding_cases | restricted separate policy scope, incident category, minimum necessary facts |

Any operation on minors must require: approved guardian/teacher relationship **and** organization/cohort scope **and** field-level policy. Parent relationships have effective and revoked dates. Downloads, search, caches and notifications obey the same policy.

### 14.6 Care, volunteers and contributions
| Table | Key relations |
| --- | --- |
| service_programs | orgId, owner, eligibility policy, safeguarding requirements |
| service_opportunities | programId, time window, capacity, location and terms |
| service_applications | opportunityId, membershipId, review status and reviewer |
| service_shifts | applicationId, slot start/end, confirmedAt, check-in and correction trail |
| care_requests | orgId, minimal request, consentRef, sensitivity, assignedCaseTeamId, retentionAt |
| care_case_access | caseId, authorizedMembershipId, purpose, expiry, audited access |
| causes | orgId, approval state, designated restrictions, payout allocation |
| contribution_intents | causeId, payerRef, amountMinor, currency, frequency, provider intent ID |
| payment_events | provider, immutable eventId unique, type, receivedAt, processedAt, state |
| receipts | source transaction, immutable receiptNumber unique, issuedAt, reversals |
| tuition_invoices | orgId, studentId, authorizedPayerId, amountMinor, terms, dueAt, status |
| ledger_accounts | orgId, code, currency, type; unique(org,code,currency) |
| journal_entries | orgId, sourceKind/sourceId unique, postedAt, reversalId |
| journal_lines | journalId, accountId, debitMinor, creditMinor; sum debits = sum credits |
| settlements | providerId, payoutId, currency, gross/fee/net in minor units, reconciledBy |
| refunds | paymentId, requestedBy, approvedBy, providerId, state, partial/full amount |
| disputes | processorCaseId, amount, deadline, evidenceRef, state |
| finance_budgets | orgId, period, category, allocation, approval and revision |

Every confirmed financial movement produces a balanced journal, never a mutation of an old posted entry. Refunds produce new reversal lines, and differences/fees settle via explicit accounts. "Budget" is not "cash on hand". A care request is **never** linked to a public donor record or used for fundraising targeting without independently documented lawful consent and necessity.

### 14.7 Publishing, reliability and governance
| Table | Fields |
| --- | --- |
| content_items | orgId, kind, locale, revision, state, approval history, schedule windows |
| content_localizations | itemId, locale, text, translator, review status, version |
| media_assets | orgId, objectKey, mime, size, scanStatus, sensitivity, retentionAt |
| delivery_preferences | personId, channel, purpose, consent state, quiet hours |
| device_push_tokens | identityId/deviceId, encrypted token, platform, revokedAt |
| notification_outbox | orgId, recipient, templateVersion, payloadRef, status, attempts, nextAt, idempotencyKey |
| notifications | recipientId, deepLink target, createdAt, readAt, minimal body |
| background_jobs | type, payloadRef, leasedUntil, attempts, deadLetterAt, owner |
| privacy_requests | identityId, requestType, state, reviewer, retention assessment |
| integration_connections | orgId, provider, configRef, scopes, health, lastCheckAt |
| webhook_inbox | providerEventId unique, payloadHash, verifiedAt, processedAt |
| import_batches | orgId, source, checksum, dryRunDiff, appliedAt, rollbackNotes |
| feature_flag_assignments | orgId, name, status, effectivePeriod, approvedBy |
| security_events | subject, IP risk metadata if justified, auth failures, retentionAt |

### 14.8 Database discipline and indexes
- Enforce compound tenant ownership in parent/child foreign keys where possible, not only in application code.
- Suggested indexes: (orgId,status,updatedAt), (venueId,localDate,publishedAt), (cohortId,sessionDate), (recipientId,readAt), (outboxStatus,nextAttemptAt), (provider,eventId unique), (resourceId,startAt,endAt), (guardianId,studentId,revokedAt).
- Overlapping room allocations use PostgreSQL exclusion constraints for time ranges when semantics support them.
- Use check constraints: positive financial amounts, mutually exclusive debit/credit lines, end > start, valid status combinations; use state machine services plus DB constraints.
- Sensitive data is not exported to public analytics without aggregation/anonymization review.
- DB migrations: additive → dual read/write if necessary → backfill → verify → cut over → remove old. No destructive push on a live system.

---

## 15. Architecture boundaries and trade-offs

**One API is chosen because:** coherent identity, transactional enrollment/finance operations, easier audit, fewer operational teams and less network coordination. Modules can be extracted later only if ownership, throughput or availability requirements justify the cost.

**One database is chosen because:** tightly related identities, permissions, session capacity and accounting depend on integrity constraints. Avoid distributed transactions.

**Separate worker is chosen because:** sending an email, charging a card or updating a search index cannot be safely made part of a user-facing HTTP transaction. Use an outbox/inbox and durable idempotency.

**Typed contracts are chosen because:** mobile and web must not drift from actual server responses. OpenAPI is generated from validated server schemas and checked in CI.

**Org-scoped policies are chosen because:** a future multi-organization path must not be a retrofit to a system that assumes one omnipotent admin. Deploy to one initial organization if operationally practical, but design identity and data correctly now.

**Native Expo is chosen because:** one maintainable client codebase can deliver platform-quality experiences, deep links, accessible forms and device integrations. Native modules or platform-specific screens are allowed when needed; do not force all behaviors into generic cross-platform abstractions.

---

# PART IV — API CONTRACTS, SECURITY, CORRECTNESS AND OPERATIONS

## 16. API system and integration boundaries

### 16.1 Protocol and conventions
- Base path: **/v1** behind a versioned domain, for example api.sila.example (placeholder domain, not an acquired asset).
- HTTPS only. JSON REST for ordinary transactions; signed short-lived media URLs for uploads/downloads. Use push/websocket only for justified high-frequency real-time views.
- OpenAPI 3.1 contracts generated from server-owned schemas. Every endpoint has request/response examples, authorization scope, error cases and stable operation IDs.
- Names: plural resources, lower-kebab-case URLs, consistent ISO 8601 UTC instants, IANA timezones, ISO 4217 currency, UUID/ULID IDs.
- Money: integer **amountMinor**, valid **currency**, explicit tax/fee/allocation breakdown, never JSON floats.
- Paging: opaque cursor and bounded limit (default 20, max 100), deterministic ordering and organization-filtered queries.
- Filtering: server allowlist; search query length/type restrictions; no arbitrary "include all" relation parameter.
- Writes: user-visible workflow commands must be idempotent where retried, and return a durable state change reference.
- Public endpoints have caching with ETag/revision; private data is no-store and partitioned by identity + org context.
- Every response includes trace/request identifier and a current policy-safe link for remediation when appropriate.

### 16.2 Standard envelopes
~~~json
{
  "data": {
    "id": "evt_example",
    "status": "confirmed",
    "startsAt": "2026-11-06T18:00:00Z",
    "venueTimeZone": "America/New_York"
  },
  "meta": {
    "requestId": "req_example",
    "apiVersion": "1",
    "revision": 7
  }
}
~~~

~~~json
{
  "error": {
    "code": "WAITLISTED_OR_FULL",
    "message": "This gathering is at capacity.",
    "details": { "waitlistAvailable": true },
    "requestId": "req_example"
  }
}
~~~

Errors are localized through a stable error code, not by matching English strings. Field errors use field keys; never echo passwords, access tokens, care narratives or full card/payment payloads. Appropriate status codes: 400/422 validation, 401 unauthenticated, 403 forbidden, 404 not found or private target masked, 409 conflict, 429 throttled, 503 dependency unavailable.

### 16.3 Auth, context and governance endpoints
| Method | Endpoint | Rule |
| --- | --- | --- |
| POST | /v1/auth/register | Rate-limited registration and anti-automation |
| POST | /v1/auth/login | Password or provider login with assurance challenge |
| POST | /v1/auth/refresh | Rotate one refresh token, revoke reuse chain |
| POST | /v1/auth/logout | Revoke active session |
| POST | /v1/auth/logout-all | Revoke all owned sessions |
| POST | /v1/auth/verify-contact | One-time confirmation token |
| POST | /v1/auth/recovery/request | Indistinguishable account existence response |
| POST | /v1/auth/recovery/complete | One-use expiring token and session revocation |
| POST | /v1/auth/mfa/enroll | Challenge proof then register authenticator |
| POST | /v1/auth/mfa/verify | Fresh, replay-resistant challenge |
| GET | /v1/me | Own profile and assurance state |
| PATCH | /v1/me | Allowed display fields only |
| GET/DELETE | /v1/me/sessions/{id} | Own device/session control |
| GET/PATCH | /v1/me/preferences | Locale and consent preferences |
| POST | /v1/me/privacy-requests | Record and track own requests |
| GET | /v1/me/export | Scoped export after suitable reauth |
| GET | /v1/organizations | Public active organization directory |
| GET | /v1/organizations/{orgId}/venues | Public venue details |
| POST | /v1/organizations/{orgId}/invitations | Verified steward with invite capability |
| POST | /v1/invitations/{token}/accept | Invited identity only |
| GET/POST/DELETE | /v1/steward/grants | MFA + org-scoped role administration |

### 16.4 Worship and discover endpoints
| Method | Endpoint | Contract highlights |
| --- | --- | --- |
| GET | /v1/organizations/{orgId}/today | Public aggregate of approved snippets |
| GET | /v1/venues/{venueId}/prayers?localDate=YYYY-MM-DD | Published schedule, revision, source, timezone |
| GET | /v1/venues/{venueId}/jummah?from=YYYY-MM-DD | Published session sequence and revisions |
| GET | /v1/organizations/{orgId}/faith-notices | Mosque-approved dated notices |
| GET | /v1/organizations/{orgId}/announcements | Approved public content only |
| GET | /v1/search?query=...&kind=... | Limited published records, no private people |
| POST | /v1/steward/venues/{venueId}/schedules | Draft change, venue editor grant |
| POST | /v1/steward/publications/{id}/approve | Different eligible approver where required |
| POST | /v1/steward/publications/{id}/publish | Atomic revision publication |
| POST | /v1/steward/notices/{id}/emergency | Documented emergency override and alert |

### 16.5 Gather, circles, learning and care
| Method | Endpoint | Minimum rule |
| --- | --- | --- |
| GET | /v1/gatherings | Only public, published, filterable |
| GET | /v1/gatherings/{id} | Audience-scoped detail |
| POST | /v1/gatherings/{id}/reservations | One active reservation; atomic capacity |
| DELETE | /v1/gatherings/{id}/reservations/me | Own cancellation, deadline/state guards |
| POST | /v1/gatherings/{id}/checkins | Assigned check-in host and attendee validation |
| GET | /v1/circles | Public discoverable circles only |
| POST | /v1/circles/{id}/join-requests | Applicant with eligibility and cooldown |
| POST | /v1/steward/circles/{id}/decisions | Authorized host decision + notification |
| GET | /v1/learning-paths | Published catalog |
| GET | /v1/learning-paths/{id} | Public summary with policy-safe cohort info |
| POST | /v1/enrollment-requests | Eligible verified applicant |
| GET | /v1/me/enrollment-requests | Own pending and decided applications |
| POST | /v1/steward/enrollment-requests/{id}/decision | Scoped reviewer plus evidence |
| GET | /v1/guardians/me/children | Active verified links only |
| GET | /v1/students/{id}/progress | Own/verified guardian/assigned teacher policy |
| POST | /v1/cohorts/{id}/attendance | Assigned teacher, session open |
| POST | /v1/cohorts/{id}/tasks | Teacher scope, publication control |
| POST | /v1/tasks/{id}/submissions | Own enrolled student; due date |
| GET | /v1/service-opportunities | Published volunteer offerings |
| POST | /v1/service-opportunities/{id}/applications | Eligible applicant |
| GET | /v1/me/service-shifts | Own accepted assignments |
| POST | /v1/steward/shifts/{id}/checkin | Assigned coordinator |
| POST | /v1/care-requests | Informed consent, minimized payload, protected queue |
| GET/PATCH | /v1/steward/care-requests/{id} | Named case team and purpose audit |

### 16.6 Treasury, messages and platform
| Method | Endpoint | Critical guarantee |
| --- | --- | --- |
| GET | /v1/causes | Approved designated fund listing |
| POST | /v1/contributions/checkout | Org-bound cause, immutable amount and idempotency |
| POST | /v1/tuition-invoices/{id}/checkout | Verified payer and guardian relationship |
| GET | /v1/me/contributions | Own statuses and receipts |
| GET | /v1/me/receipts/{id} | Only invoice payer/donor or scoped authorized actor |
| POST | /v1/steward/refunds | Requested full/partial refund with maker |
| POST | /v1/steward/refunds/{id}/approve | Independent authorized checker |
| GET | /v1/steward/ledger/entries | Treasury scoped, audited export |
| GET | /v1/steward/settlements | Provider payout and reconciliation status |
| POST | /v1/webhooks/payments/{provider} | Signature-verified raw body and dedupe |
| GET | /v1/me/notifications | Minimal personal notification data |
| PATCH | /v1/me/notifications/{id} | Own read/archive state |
| PUT | /v1/me/device-push-token | Device association with consent and revocation |
| GET | /v1/steward/audit | Scope-filtered append-only audit |
| GET | /health/live | Process liveness, no credentials or private data |
| GET | /health/ready | Dependency readiness, protected operational detail |

### 16.7 Versioning and transitions
Version non-backwards-compatible changes explicitly (e.g., /v2), allow bounded deprecation windows, generate SDK clients, and test old supported mobile builds against current server. Avoid hidden "breaking but we updated the web" changes because native apps do not all update simultaneously.

### 16.8 Example: Reserve a seat
~~~json
{
  "sessionId": "ses_example",
  "partySize": 1,
  "accessibilityRequest": "wheelchair-space",
  "idempotencyKey": "generated-client-uuid"
}
~~~

On transaction: resolve actor and org; check audience/eligibility; lock session capacity; return existing reservation if same idempotency key; otherwise create confirmed or waitlisted reservation with status and stable ID; emit notification outbox once; record audit event. The response must differentiate confirmed versus waitlisted. Any provider/network retry returns the same operation result.

---

## 17. Auth, session and permissions engineering

### 17.1 Authentication
Use a mature authentication provider or well-audited library with OAuth 2.1/OIDC Authorization Code + PKCE for native login where relevant. Password authentication requires strong server-side hash (Argon2id preferred with operationally appropriate parameters), credential stuffing protections, breached-password checks when justified, and generic account recovery messaging.

- **Mobile:** short-lived access and rotating refresh tokens; refresh secret stored in Keychain/Keystore via approved secure storage; server stores only hash and token-family/reuse state. Never keep bearer tokens in plain AsyncStorage or logs.
- **Web:** HttpOnly, Secure, SameSite cookies with CSRF/origin controls; avoid long-lived session tokens in localStorage.
- **Privileged:** phishing-resistant WebAuthn/passkey/physical key recommended for stewards and treasury; TOTP fallback only with policy and approved recovery path; step-up reauthentication for payouts, refunds, privilege grants, privacy exports and sensitive guardian revocations.
- **Recovery:** logged and rate-limited, no insecure email-only bypass of privileged MFA; documented two-person break-glass under retention and audit policy.
- **Sessions:** device list; logout all; revoked/expired checks on API; refresh-token replay kills token family; privilege or membership revocation invalidates active sessions promptly.
- **Invitations:** signed/hashed one-time tokens, expiry, organization binding, verified recipient and least-privilege acceptance.
- **Bots:** edge/WAF controls for signup and public forms with accessible alternatives; do not require inaccessible visual CAPTCHAs everywhere.

### 17.2 Authorization workflow
For every private API request:
1. Verify session, assurance level, token lifetime and issuer/audience.
2. Resolve trusted active organization (never trust a posted orgId).
3. Resolve current membership state and effective grants.
4. Load target within tenant scope, enforcing field-level minimization.
5. Evaluate permission on target, relation and action; default DENY.
6. Evaluate state-machine guard (deadline, amount, published status, separation of duties).
7. Write in a DB transaction with idempotency/version check; produce audit/outbox event.
8. Return a minimal, policy-safe response. Treat hidden-not-found and true-forbidden consistently with threat model.

**Negative-test requirements:** cross-org ID, expired invitation, unverified guardian, revoked teacher, finance self-approval, guessed receipt ID, bypass via sorting/filtering, modified org header, cached prior identity, skipped MFA, orphan file link, background worker wrong scope.

### 17.3 Security design reference
- OWASP **ASVS 5.0.0** for web/API security requirements (https://asvs.owasp.org/).
- OWASP **MASVS** and **MASTG** for mobile storage, authentication, network, platform, privacy and resilience (https://mas.owasp.org/MASVS/).
- NIST secure development guidance where relevant; organization security policy and independent penetration test are separate release requirements.
- Never call an app "OWASP certified" merely because a checklist was read or a dependency scanner passed.

---

## 18. Privacy, safeguarding and consent

### 18.1 Classify data before collecting it
| Classification | Examples | Default controls |
| --- | --- | --- |
| Public | Published prayer time, approved public event | Public access, revision and correction |
| Member-private | Own RSVP, notification preference | Owner access, encrypted transit |
| School-restricted | Child enrollment, attendance, progress | Verified guardian/teacher and field scope |
| Care-confidential | Support request, case notes, protection concerns | Named case team, no general search/export |
| Financial-sensitive | Donor identity, tuition, payouts, refund audit | Treasury scope, masking, immutable audit |
| Authentication-secret | Refresh token, MFA secret, recovery token | Hashed/encrypted, zero logging, rotation |
| Operational-security | Worker secret, incident evidence, IP abuse signals | Strict access and short retention |

### 18.2 Non-negotiable protections
- Every personal field has a purpose, owner, legal basis/consent analysis, retention duration, deletion/exception rule, encryption class and access test.
- Child profile visibility requires verified GuardianLink, not a shared surname, email or parent role flag.
- Guardianship disputes have manual verified review and immediate temporary access freeze capability.
- Care-case intake never sends raw narratives through push notifications, ordinary email or analytics.
- School uploads use malware scanning, content/type limits, private storage and short-lived access URLs.
- Protect private exports with step-up auth, scoped download links, audit, expiry and file-level encryption as needed.
- Do not collect or predict religious practice or caste/ethnic characteristics as engagement metrics.
- Sensitive logs are redacted at source. Production support does not gain carte-blanche database browsing.
- User data deletion is request-based with documented financial/child safeguarding retention exceptions; explain what remains and why.
- Jurisdiction-specific child protection, privacy, fundraising, financial and accessibility law must be assessed by qualified counsel; the design does not assume a law applies universally.

### 18.3 Care escalation and human safety
The product must not appear to provide emergency, medical or legal response where none is staffed. Where care programs are enabled, publish operating hours, who responds, limits of confidentiality, response expectation and an emergency alternative. A request may be escalated only by authorized humans under an approved protocol; no unreviewed AI triage on vulnerable cases.

### 18.4 Consent and communication
Marketing opt-ins are separate from essential transactional notices. Guardian consent is versioned. A push token is tied to the active device/identity and removed on logout, token rotation or user revocation. No sensitive financial, child, custody or care details in lock-screen notifications.

---

## 19. Financial integrity and money movement

### 19.1 Principles
A payment provider confirms the movement; the application records it; the ledger accounts for it; settlements reconcile it. These are separate facts and must have separate states. A redirect back from Checkout is **not** a successful payment confirmation.

### 19.2 Contribution flow
1. Server validates published cause, organization currency, amount limits, designated allocation and donor terms.
2. Create an immutable checkout intent with unique idempotency key.
3. Provider checkout token or hosted URL is generated using server-only credentials.
4. User completes provider flow; UI displays **processing**.
5. Signed webhook raw bytes are verified before parsing; deduplicate event IDs and provider business objects.
6. Transactionally update payment state, create immutable receipt, post balanced ledger journal and outbox notification.
7. Reconciliation worker compares source transactions with provider charges, fees, refunds and payout settlements.
8. Audit and alert unmatched amounts, currencies, orphan payments or double postings.

### 19.3 Example journal (USD 50.00 donation)
| Account | Debit minor | Credit minor |
| --- | ---: | ---: |
| Payment processor clearing | 5000 | 0 |
| Restricted/unrestricted contribution revenue | 0 | 5000 |
| **Total** | **5000** | **5000** |

On payout, move clearing to cash and book processor fees explicitly. On a full/partial refund, create **new** reversal lines for the actual provider-confirmed refunded amount. Do not delete or overwrite posted receipts.

### 19.4 Refund/expense safeguards
- Maker and checker are different verified actors.
- Amount, organization, source, payer, currency, provider refund status and prior partial refunds checked.
- Idempotency on provider call; stalled provider request enters reconciliation queue rather than blind duplicate retry.
- Provider webhook decides external money status; independent admin approval merely authorizes submission.
- Expense requests can attach scanned evidence, have organization/category budgets and a separate payable/payment lifecycle.
- Staff cannot approve their own reimbursement or access bank integration credentials via UI.
- Restricted donation allocations must not be silently reassigned.

### 19.5 Accounting release gate
Finance policy owner approves chart of accounts, fund restrictions, refunds, statement wording and reporting requirements. Real payment sandbox and live limited pilots must reconcile including fees, chargebacks, failed/late/out-of-order webhooks, disputes, network outages and export retention. Do not claim general-ledger compliance based only on two-line posting tests.

---

## 20. Worship, time, calendars and geographical correctness

### 20.1 Prayer source of truth
Each venue selects its authoritative source/calculation method and local policy. For every date, store authoritative adhan/iqamah/Jummah values, original source, reviewedBy, publishedBy and revision. Support imported calculations only as **drafts** pending venue confirmation. A scheduled publication never silently changes past prayer records.

### 20.2 Time handling
- Store instant timestamps in UTC and display via the venue's IANA timezone.
- Store mosque-local **civil date** separately from timestamp, especially across DST transitions.
- A 13:15 Jummah local clock time has meaning even if UTC offset changes.
- Use tested timezone/date libraries and avoid relying on server or handset default timezone.
- The Hijri calendar can use a documented display convention, but Eid/Ramadan announcements require explicit human mosque approval.

### 20.3 Qibla
Direction may be calculated from user-granted location (to Kaaba coordinates) with correct geodesic bearing. Check permissions, compass sensor availability and magnetic/true north assumptions. If location unavailable, offer city/manual lookup and say what accuracy cannot be guaranteed. Do not persist individual prayer-location history.

### 20.4 Correction and safety
Urgent schedule changes use a named editor and approver, with timestamp and publication revision. Cache invalidation and display updates are part of success. If an approved time is unavailable, show "Schedule not published" with contact route—not a derived guess.

---

## 21. Education and safeguarding lifecycle

The education domain is a protected school operating area within SILA, not a generic "student" table exposed throughout the community app.

### 21.1 Child enrollment lifecycle
**Application → identity/guardian evidence review → guardian link approval → student profile creation → class allocation → active enrollment → attendance and progress → renewal/withdrawal.**

Approving an application does **not** automatically prove guardianship unless evidence review is complete; approving guardianship does **not** automatically grant access to all future class reports. Relationship, class, audience and status each matter.

### 21.2 Class operations
Cohort capacity is enforced transactionally. Teachers only see assigned rosters. Attendance is a dated record with original marker, latest revision, reason and correctedBy. Student reports are drafts until published to specified recipient class (student, approved guardian, school staff). The approval policy is configured by the school.

### 21.3 Financial boundaries
Invoice issued to an explicitly authorized payer; tuition is allocated by organization, student, period and program. Refunds/waivers/concessions are reasoned and audited. Teachers cannot browse full guardian payment histories. A student ID should not expose child name, address or birthdate by inference.

### 21.4 Child-facing experience
Age-appropriate text and minimum features; no direct chats with strangers, public leaderboard, unrestricted location, unmoderated photos or student discovery by name. Files and school communications are subject to written safeguarding policy and independent review.

---

## 22. Notifications, queues and offline operation

### 22.1 Delivery design
Every consequential server transaction adds an **outbox event** in the same DB transaction; the worker leases it, selects an allowed channel based on consent and purpose, sends through provider and records actual provider acknowledgment. Retry with exponential backoff and jitter; dead-letter after a bounded policy; page on critical failures; dedupe provider callback IDs. Never deliver stale guardian-only content after permission revocation.

### 22.2 Notification examples
| Event | Channel | Payload rule |
| --- | --- | --- |
| Prayer schedule changed | Opted-in push, in-app, display | Generic notice + updated public link |
| RSVP confirmed | In-app + optional email/push | Event title and safe details |
| Gathering canceled | Essential in-app/transactional message | Clear affected schedule |
| Shift assigned | In-app + opted-in reminder | Title and safe link |
| Child report published | In-app, generic push only | No child/report text on lock screen |
| Care case response available | Private in-app, generic email | No case content |
| Donation verified | In-app and permitted receipt email | Full receipt only via authenticated link or secure delivery |
| Refund changed | In-app + transactional notice | Status and verified reference |
| Privilege revoked | Security notification, session invalidation | No internal risk metadata |

### 22.3 Offline policy
| Feature | Offline experience |
| --- | --- |
| Published prayers / public venue info | Last verified snapshot with date, source and **STORED/OFFLINE** label |
| Public gatherings | Read-only previously opened records, may be stale |
| Qibla | Locally calculated if permitted location available, with warning |
| Draft non-sensitive RSVP form | Local draft only; cannot falsely claim reservation |
| Private child or care records | No default unencrypted offline caching |
| Payments / refunds / role grants / enrollment decisions | **Online-only**, no fabricated success |
| Notifications | Previously downloaded own items only, guarded by current session and data policy |

Offline sync uses explicit version and conflict resolution; sensitive revocations cause cache purge. An internet reconnection does not automatically replay a donation or irreversible action without user/protocol safeguards.

---

## 23. Internationalization, inclusivity and content design

### 23.1 English and Arabic are equal product languages
Internationalization is architectural, not a late text swap:
- Centralized message catalog, typed keys and review workflow.
- RTL-aware flex, leading/trailing padding, icons, reading order and motion direction.
- Bidi isolation for URLs, email addresses, amounts, dates and named entities inside Arabic.
- Locale-specific number/date/currency formatting with explicit timezone.
- Arabic font shaping, line height, mark/diacritic correctness and numerals validated on real iOS/Android devices.
- Editors enter **separately approved translations** of public announcements; automatic translation may be a private suggestion only, never an unreviewed mosque statement.
- Complete forms, accessibility labels, validation errors, empty states, receipts and emails localized before declaring language complete.
- Text expansion tolerance and dynamic type; do not assume Arabic uses fewer characters.
- Allow bilingual content and organization-approved transliteration without culturally inappropriate defaults.

### 23.2 Accessibility acceptance standard
Target **WCAG 2.2 AA** for applicable web interfaces and corresponding native mobile accessibility behaviors: semantics and roles, headings, keyboard-only traversal, logical focus, sufficient contrast, non-color status, scalable text, high-contrast/dark options, reduce motion, captioned content, helpful errors, touch targets and labels. Include VoiceOver, TalkBack, hardware keyboard, switch control and a motor accessibility pass.

Automated accessibility scanners are necessary but insufficient: manual assistive-tech journeys must be passed and recorded for every key flow. Official WCAG: https://www.w3.org/TR/WCAG22/.

### 23.3 Content voice
Warm, plain, precise, never patronizing. Use "A place is available" rather than artificial urgency. Do not call someone a donor hero or imply that payments measure faith. Say **"Awaiting payment confirmation"**, **"Request submitted; not yet approved"**, **"Published by your mosque"**, and **"We cannot load this record now; retry safely"**.

---

## 24. Observability, reliability, scaling and backups

### 24.1 Operational telemetry
Log structured traceId, safe actor pseudonym, organizationId, action, latency, policy outcome and error code. Mask child details, care narratives, tokens and donation payloads. Monitor API latency/error budgets; database slow queries; provider callback lag; outbox lag; job retries; refund exception queues; cache invalidation; permission denials; anomalous financial mismatches.

### 24.2 Reliability patterns
- Idempotent commands and webhook inbox (unique provider event IDs).
- Outbox/inbox transactional messaging; no best-effort email inside business transaction.
- Bounded retries with jitter and circuit breaking for external providers.
- Timeouts at HTTP, DB and queue boundaries; graceful degradation for optional integrations.
- Graceful shutdown and worker lease expiry recovery.
- Readiness/liveness separated; no sensitive config details on public health route.
- Connection pool limits; load test database locks for capacity/waitlist transactions.
- Files scan in quarantine; no public upload bucket by default.
- Feature flags and tenant-specific rollout; incident rollback policy.
- Schema migrations are reviewed, additive, reversible where possible and backup-tested.

### 24.3 Backups, disaster recovery and continuity
Define RPO/RTO with organization before release. Use encrypted automated backups, offsite retention, access-separated credentials and **monthly sampled restore drills** plus a full prelaunch restore test. Practice a payment-webhook backlog replay, accidental guardian grant revocation, school content leak response and stale prayer schedule correction. Recovery credentials should not be held by one individual without documented continuity.

### 24.4 Performance and cost
Monitor request fan-out and the query plan for heavy admin lists; precompute non-sensitive daily venue aggregates; use cursor pagination; cache immutable public content by revision; optimize image dimensions and lazy load assets. Avoid synchronous report generation inside an interactive request. Build cost forecasts for provider mail/push, storage, payment fees, platform builds, monitoring and DB growth.

---

# PART V — DELIVERY, VERIFICATION AND BUSINESS READINESS

## 25. Development workflow and engineering standards

### 25.1 Work method
Use **small vertical slices**, each containing real UX, typed API, domain policy, database migration, integration test, telemetry and documentation. Never count a UI-only placeholder as a completed feature. Prefer a readable monolith to a clever abstraction. Establish a short architecture decision record (ADR) before unusual infrastructure additions.

For each feature:
1. Define problem, persona and measurable outcome.
2. Map interaction states and sensitive fields.
3. Model resources and access rules; document threat scenarios.
4. Write contract and policy tests **before** implementation where feasible.
5. Implement database constraint and migration; generate API/types.
6. Build use case and actual API; test transaction/concurrency/error paths.
7. Build native and/or web UI with accessibility and RTL states.
8. Add queue/notification and operational owner when needed.
9. Run end-to-end and negative authorization tests.
10. Observe on staging with safe seeded/fake data only.
11. Obtain product/security/finance/safeguarding approval as applicable.
12. Release behind a rollout gate, monitor, rollback if necessary.

### 25.2 Code quality standards
- Strict TypeScript, no unchecked casts or "any" creeping into public contracts; runtime validation for untrusted input and provider responses.
- Typed domain errors, discriminated state unions, no duplicated status semantics.
- Use explicit dependency injection/seams for time, random IDs, third-party services and permission checks in tests.
- No API endpoint directly mutating a dozen unrelated tables without an application use case and transaction design.
- No circular imports between modules; contracts → domain → application → infrastructure and transport are one-way boundaries.
- Domain models never expose raw credentials, payment provider secrets or protected case files.
- Generated SDK clients come from OpenAPI; avoid handwritten fetch-response duplication across apps.
- UTC instants and IANA timezones; test DST and leap-day cases.
- Currency library/formatting handles integer minor units, decimal input validation and currencies with differing minor units.
- Every public error has a code and localization key; failures are observable with a safe request ID.
- No console logging of secrets or PII, no local development credentials in Git.
- Dependency pinning via lockfile, signed CI artifacts where available, reproducible builds and license inventory.
- PRs show acceptance mapping and screenshots/accessibility evidence for UI changes.

### 25.3 Branch, release and ownership discipline
Only edit the agreed Git branch(es); **current work belongs to development** until the owner approves a branching or release policy. Every commit links to a capability and contains verified scope. Use protected reviews on finance/auth/safeguarding areas; do not force-push or erase history to hide vulnerabilities. Separate environment variables and encryption keys for development, preview, staging and production.

### 25.4 Developer environment: new installation
A contributor should be able to clone the repo, copy **example** environment files, start local Postgres/object-store substitutes, run versioned migrations on a disposable DB, seed only demonstrably fictional records, start API/worker/web/mobile and run one test command. Never depend on production data to develop or showcase UI.

### 25.5 Repository conventions
- Root command groups: typecheck, lint, format-check, unit, integration, contract, a11y, e2e, db:migrate, db:status, web:build, mobile:build-validation.
- CI rejects missing schema migration, insecure permission changes without tests, drift between contracts and generated clients, critical vulnerability findings, broken locale keys or unsupported runtime versions.
- Ensure test names express intent ("guardian from Org B cannot see Child A"), not implementation details ("should be 403").
- Use structured fixtures via factories; no arbitrary real names, addresses, bank/card data or child records.

---

## 26. Testing strategy: correctness is a release feature

### 26.1 Test pyramid
| Layer | What it proves | Environment |
| --- | --- | --- |
| Pure unit | Timezone conversion, state machine, amount validation, policy utilities | In-process deterministic tests |
| Domain/service | Correct authorization and state changes | Mock services + real policy inputs |
| Database integration | FK, unique keys, RLS/tenant scope, locks, financial posting | Disposable PostgreSQL via migrations |
| API contract | Every documented request, error and result | Running API + generated client |
| Provider contract | Signed webhooks, retries, out-of-order and duplicate events | Official sandbox plus synthetic adversarial fixtures |
| Native E2E | Navigation, permission prompts, accessibility and auth | Real devices + iOS/Android simulator |
| Browser E2E | Full steward and public flows | Multiple browsers and sizes |
| Security | Token replay, scope bypass, SSRF/upload abuse, privilege escalation | Automated + independent manual review |
| Accessibility | VoiceOver, TalkBack, keyboard, contrast, RTL, scaling | Manual and automated |
| Performance/resilience | p95, degraded providers, reconnection, failover | Staging load/chaos exercise |
| Migration/restore | Apply new schema, safe backfill, rollback strategy, restore | Staging snapshot with sanitized data |
| Human UAT | Actual staff/guardian/teacher understand and complete work | Facilitated test scripts |

### 26.2 Mandatory negative tests
1. Guest cannot access any private API; public metadata does not leak email or child details.
2. Member A cannot access member B's receipt, invoice, event ticket, account or export by guessed ID.
3. Organization A administrator cannot read organization B user or finance records.
4. Guardian with revoked or unapproved link cannot read student data via list, detail, search, cached query or document URL.
5. Teacher can see only assigned cohorts and authorized fields; former teacher loses access on revocation.
6. A care coordinator cannot view unassigned cases; general stewards do not get a private care list by default.
7. Staff cannot self-grant permission, self-approve own refunds or evade approval with stale requests.
8. Expired/replayed MFA, invitation and reset tokens fail; privilege grants require fresh assurance.
9. Two parallel last-seat reservations create **one** confirmed seat, not two.
10. Payment redirect alone cannot mark paid; invalid signature/amount/currency rejects posting.
11. Duplicate and reordered provider events cannot double-charge or double-journal.
12. Partial refunds, chargebacks, disputed payments and fees reconcile to appropriate accounts.
13. Failed provider request does not say completed and does not silently erase pending intent.
14. A private unpublished prayer schedule or draft notice never appears in public API/cache/kiosk/search.
15. Cross-organization search/filter/pagination cannot reveal records via count side-channels.
16. Switching users/organizations empties private cache, queued requests, old deep links and push token associations.
17. Offline mode cannot submit an irreversible payment or guardian approval and report success.
18. Malicious upload MIME, oversize file, malware signature and signed URL reuse are rejected.
19. Canceled gatherings invalidate affected check-in rights and notify only appropriate audience.
20. Arabic RTL, large text, screen-reader controls and keyboard focus work in every high-value flow.

### 26.3 Every-control acceptance checklist
For each visible button, menu, icon, search filter, date picker, navigation link, table action, slider and form submit, record:
- **Action:** What exactly changes or opens?
- **Eligibility:** Who can use it and against which resource?
- **Result:** Which durable server state or new screen proves success?
- **Pending:** How is the in-progress state communicated?
- **Errors:** How are network, denied permission, validation, conflict and provider failures handled?
- **Retry:** Is retry safe and idempotent?
- **Accessibility:** Label, focus, semantic status, touch target, keyboard and RTL.
- **Telemetry:** How can support diagnose failure without sensitive data?
- **Tests:** Unit/contract/E2E identifier, screenshot and reviewer.

A control with no real handler must be removed, genuinely disabled with an explanation, or explicitly labeled "not available" in a staging-only environment—never launched as a dead button.

---

## 27. Feature acceptance register

Each row is a **must-pass product requirement**, not a claim that code currently implements it.

| ID | Capability | Surface | Primary actor | Definition of working |
| --- | --- | --- | --- | --- |
| F-001 | First-run locale + mosque selection | Mobile | Guest | Switch and persist venue; correct data, no location required |
| F-002 | Prayer/day schedule | Mobile/Public/Display | Everyone | Venue-authorized times, local date, source and missing state |
| F-003 | Jummah and corrections | All | Guest/editor | Multiple sessions, versions, approval and cache invalidation |
| F-004 | Qibla direction | Mobile | Guest | Permission-aware, accuracy caveat, manual fallback |
| F-005 | Confirmed Eid/Ramadan notices | All | Everyone/editor | Only approved and attributed dates are shown |
| F-006 | Emergency venue notice | All | Editor | Authorized revision immediately visible and actionable |
| F-007 | Public gatherings catalog | Mobile/Public | Guest | Search/date/location/accessibility filter and accurate content |
| F-008 | Gathering details | Mobile/Public | Guest | Real audience, capacity, venue, policy and times |
| F-009 | RSVP and cancellation | Mobile/API | Member | Correct capacity, waitlist, own state, safe duplicate handling |
| F-010 | Check-in | Steward | Host | Assigned host only, factual attendance and correction trail |
| F-011 | Circle discovery and join request | Mobile | Guest/member | Public details, private membership review |
| F-012 | Circle stewardship | Steward | Host | Moderated membership, updates and scoped roster |
| F-013 | Learning catalog | Mobile/Public | Guest | Correct age, venue, instructor policy and prerequisites |
| F-014 | Guardian application | Mobile | Guardian | Valid consent, status and reviewer evidence workflow |
| F-015 | Verified dependent link | Steward | Safeguarding reviewer | Explicit validation, approval, revocation and audit |
| F-016 | Cohort enrollment/capacity | Steward | School staff | Atomic seat assignment and defined waitlist |
| F-017 | Attendance | Steward | Assigned teacher | Current session only, versioned corrections |
| F-018 | Assignments and submissions | Mobile/Steward | Teacher/student | Class-scoped publication, own work and due-date rules |
| F-019 | Progress report | Mobile/Steward | Teacher/guardian | Draft/approved publication and field-level access |
| F-020 | Service opportunities | Mobile | Member | Published, eligibility-scoped shifts |
| F-021 | Service application review | Steward | Coordinator | Decision, reason, audit and applicant state |
| F-022 | Shift scheduling and check-in | Both | Coordinator/volunteer | No overlaps; real times and completion |
| F-023 | Private care intake | Mobile/API | Eligible applicant | Consent and safe confidential acknowledgment |
| F-024 | Case review | Steward | Named care team | Minimal case data, audit, human owner, closure |
| F-025 | Causes and transparency | Mobile/Public | Everyone | Reviewed program, truthful allocation disclosures |
| F-026 | One-time contribution | Mobile/API | Member/guest if allowed | Provider checkout + webhook state |
| F-027 | Recurring contribution | Mobile/API | Donor | Explicit schedule, cancel, receipts, failure handling |
| F-028 | Receipt | Mobile/Steward | Donor/finance | Unique verified payment and refund history |
| F-029 | Tuition invoice | Both | Guardian/finance | Only approved payer; true ledger status |
| F-030 | Refund request and approval | Steward | Finance maker/checker | Distinct actors and provider-confirmed outcome |
| F-031 | Payout/settlement reconciliation | Steward/Worker | Finance | Provider totals, fees, disputes and exceptions match |
| F-032 | Budget and expense control | Steward | Finance | Allocations separated from actual payments; maker/checker |
| F-033 | Announcements/content | All | Editor | Draft, preview, translated review, publish revision |
| F-034 | Public pages and SEO | Public | Guest | Indexable, accessible official mosque information |
| F-035 | Read-only mosque display | Display | Everyone | Only published venue records with stale-state handling |
| F-036 | Search | Mobile/Public | Everyone | No private index entries, scoped filters |
| F-037 | Signup/contact verification | Both | Person | Real session, confirmed identity, generic recovery |
| F-038 | MFA/passkeys and recovery | Both | Privileged users | Step-up, rotation, replay and recovery review |
| F-039 | Organization role grants | Steward | Admin | Scope/expiry, independent audit, revocation |
| F-040 | Personal dashboard | Mobile | Member | Own commitments, truthful status changes |
| F-041 | Settings and localization | Mobile/Steward | User | Complete English/Arabic and native RTL behaviors |
| F-042 | Preferences and notices | Mobile/API | User | Opt-in separation and actual delivery proof |
| F-043 | Privacy export/deletion request | Mobile/Steward | User/privacy team | Scope-safe export and governed retention decisions |
| F-044 | Audit and traceability | Steward/API | Auditor | Event actor, result, diff, request ID, tamper protection |
| F-045 | Backup/restore and incident ops | Ops | Maintainer | Recovery drills and recorded SLA/SLO monitoring |
| F-046 | Public and privileged accessibility | All | All | WCAG/assistive-tech/manual UAT gates passed |
| F-047 | Dynamic content revisions | All | Editor | No stale unpublished leak; affected users notified |
| F-048 | Multi-venue context | All | Member/staff | Venue scope and tenant-safe cache/state separation |
| F-049 | Non-predatory product analytics | Steward | Leadership | Aggregates, consent, small-group suppression |
| F-050 | Operational support tooling | Steward/Ops | Approved support | Case notes, trace IDs and time-limited audited access |

**Completeness means these 50 high-level capabilities are decomposed into acceptance tests, developed with required edge cases, and signed off.** Do not score a feature at 100% if only its happy-path demo works.

### 27.1 P0 launch slice
F-001–F-010; F-013–F-019; F-020–F-022; F-025–F-026; F-028–F-030; F-033–F-040; F-041, F-044, F-045, F-046, F-048.

### 27.2 Conditional P0 by organization
F-023/F-024 only if an independently reviewed care program, trained staff and approved privacy/retention policy exist. Otherwise **ship hidden and unavailable, not an empty dangerous module**. F-027 recurring contributions requires explicit cancellation, mandate and failed-payment implementation; if unavailable, allow one-time giving only. F-031 is required for a real-money production launch, even if its UI is limited to authorized finance users.

### 27.3 Post-launch extensions
Deeper learning-path progress, integrations with member-approved calendars, facility scheduling beyond events, additional locales, public-facing programs with multi-venue waitlists, finance exports, and new organization integrations. Marketplace hiring or paid rental is a new product evaluation, **not a guaranteed inherited feature**.

---

## 28. Delivery roadmap: build from zero with gates

### Phase 0 — Product discovery and legal validation
**Output:** Confirm mosque operational model, interview guests/parents/teachers/hosts/finance; finalize naming and bilingual vocabulary; prioritize ten most valuable tasks; approve safeguarding, financial and privacy operating owners.

**Exit gate:** Signed product charter; initial deployment geography/currency/language; agreed threat model, scope and non-goals; design principles accepted.

### Phase 1 — Identity and design foundation
**Output:** SILA design tokens, typography and bilingual directionality; reusable mobile/web components; navigation prototypes; identity and organization membership model; permission system skeleton; auth and recovery.

**Exit gate:** EN/AR task walkthroughs, access policy spec, CI/lint/typecheck, mobile builds, public guest prayer stub with **explicit missing data**.

### Phase 2 — Worship and trusted public site
**Output:** Venue setup, prayer source workflows, approved schedules and Jummah, publication revisions, today app, public site, display, search index for published content.

**Exit gate:** Correct date/time and urgent change propagation; zero unpublished schedule leakage; accessible guest journeys.

### Phase 3 — Gatherings and circles
**Output:** Event catalog, RSVP, capacity/waitlists, cancellations, authorized check-in, circle request/review and host tools.

**Exit gate:** Parallel last-seat tests, cancellations and waiting-list promotion tests; verified host scoping.

### Phase 4 — Learning and protected family
**Output:** Paths and cohorts, guardian verification, enrollment queue, teacher assignment, attendance, reports, guardian/student access.

**Exit gate:** Child privacy review passed; custody change access revocation validated across API, cached state, files and notifications.

### Phase 5 — Care and service
**Output:** Volunteer scheduling/check-in; optional confidential care programs enabled only after separate safeguarding and retention approval.

**Exit gate:** Safe volunteering flows; case confidentiality red-team exercises if care enabled.

### Phase 6 — Contributions, tuition and treasury
**Output:** Provider checkout, verified webhooks, immutable receipts, journal posting, invoices, refund maker/checker, partial refunds, disputes, payout settlement reconciliation.

**Exit gate:** Sandbox plus controlled live reconciliation; zero unmatched or double-posted charges in pilot; approved accounting policies and customer notices.

### Phase 7 — Messaging, resilience and operations
**Output:** Durable notifications and consent, localization completion, offline read-only snapshots, backup/restore, provider alerts, key rotation runbooks, import/export dry-run tools.

**Exit gate:** Alert drills, queue retries, provider outages, iOS/Android device matrix and WCAG audits passed.

### Phase 8 — Quality assurance and limited pilot
**Output:** Staging acceptance walkthroughs with actual staff, bilingual users and families using fictional/synthetic records; performance, security and safeguarding testing.

**Exit gate:** No critical/high security bugs; all P0 flows passed with evidence; real-time operational owners trained; incident response tested.

### Phase 9 — Controlled production launch
**Output:** Verified domains, app signing, legal policies, monitoring, backups, app-store review, secrets manager, supervised data imports, limited organization rollout.

**Exit gate:** Signed launch readiness checklist with owners. No undeclared open blockers, no dummy checkouts or unpublished schedules masquerading as real. Rollback and contact plan published.

### Phase 10 — Sustain and extend
**Output:** Monthly access review, on-call rotation, observed SLOs, dependency upgrades, privacy retention jobs, roadmap feedback and evidence-based feature selection.

**Exit gate:** Product operations are staffed, not just coded.

### 28.1 Suggested sequencing and parallel work
Design + permission model can run in parallel, but **no private UI ships before authorization semantics exist**. Worship can be developed independently of financial provider integration; payments depend on ledger and webhook policy; education depends on GuardianLink and school approvals; care cannot launch ahead of trained operators and retention policy. Every parallel team shares contracts and tokens, not duplicated models.

---

## 29. Delivery evidence and definition of done

A capability is **done** only if all apply:
1. Product requirement and acceptance criteria are approved.
2. UI design has mobile + relevant web, both languages and error/empty/loading/disabled states.
3. Accessible semantics and touch/keyboard/screen-reader checks pass.
4. Server ownership, tenant scope and field-level permissions have negative tests.
5. Schema constraints and reversible migration are reviewed.
6. End-to-end happy, failure and concurrency journeys pass.
7. Provider events are handled securely and idempotently if involved.
8. Logs, traces, monitoring, support error IDs and runbook links exist.
9. Privacy classifications, consent and retention handling are approved.
10. Feature is tested in a realistic staging environment using non-sensitive data.
11. Applicable subject matter expert signs off: worship editor, teacher/safeguarding, finance, legal or security.
12. Rollback plan, feature flag and operator training exist.
13. Documentation, release note and multilingual messaging are correct.
14. No dead buttons, sample fake records, silent errors or misleading statuses remain.
15. A product owner confirms the full experience meets the intended member need.

A green compile job is not "100%". A merged route is not a finished workflow. A sandbox payment is not reconciled live finance. An Arabic button is not fully translated RTL support.

### 29.1 Traceability record template
~~~yaml
feature_id: F-009
feature_name: Gathering RSVP
owner: Community Operations
surfaces: [mobile, public, steward, api]
data_classification: member-private
capabilities: [reserve:gathering, cancel:own-reservation]
entry_points: [Gather search, gathering detail, My commitments]
states: [available, full, waitlisted, confirmed, canceled, ended]
tests:
  - capacity-concurrency
  - cross-org-denial
  - duplicate-idempotency
  - canceled-event-access
  - rtl-screenreader
  - offline-no-false-success
operational_runbook: docs/runbooks/gatherings.md
status: planned
acceptance_owner: community-director
~~~

### 29.2 Audit evidence register
For every release, archive: commit SHA, lockfile hash, build ID, migration set, migration dry-run output, dependency findings, security test results, contract diff, accessibility results, payment reconciliation reports, localization review, iOS/Android device results, operational approval and rollback reference.

---

## 30. Decisions the organization must approve

| Decision | Working recommendation | Consequence if unresolved |
| --- | --- | --- |
| Public name and logo | SILA as placeholder; clearance before use | Brand remains internal only |
| Initial mosque and geography | One operating org and venues, org-scoped model | Tenant configuration remains blocked |
| Prayer authority | Venue-approved timetable, import drafts only | No published prayer times |
| Arabic/English wording | Professional bilingual editorial review | Translation cannot be marked done |
| Joining policy | Guest public, verified member for commitment | RSVP/circle onboarding uncertainty |
| Child account age bands | School policy + legal review | Student login/enrollment launch blocked |
| Guardian evidence | Manual authorized verification and revocation | Private school dashboard blocked |
| Care program | Opt-in only with trained case team | Care module remains disabled |
| Donation minimum/currencies | USD provisional, server-configured | Live checkout blocked |
| Recurring donations | Only when provider mandate/cancellation finished | Offer one-time only |
| Finance accounting policy | Finance sign-off on chart/fees/refunds | Real payment launch blocked |
| Provider choices | Hosted PCI-scope-reducing checkout | No live payments |
| Email/push sender | Verified domain, templates, preferences | Notifications cannot claim delivery |
| Content approval | Two-person for critical schedule changes | Publishing authority uncertain |
| Organization hierarchy | One org pilot, multi-tenant-safe data now | Cross-tenant expansion blocked |
| Data retention/deletion | Written policy per sensitive domain | Privacy requests cannot be closed safely |
| Hosting and region | Data residency, cost and SLA review | Production infrastructure undecided |
| Incident response | Named 24/7 contact for urgent changes | Public launch unsafe |
| App-store ownership | Organization-owned Apple/Google accounts | Public distribution blocked |
| Use of analytics | Small safe aggregate only | Opt-in/metrics defaults not final |

**These are explicit sign-off gates, not requests for the developer to invent legal or financial policies.**

---

## 31. Proposed first implementation tickets

The first ten tickets should build a **real product spine**, not isolated decorative screenshots.

| Ticket | Deliverable | Test required |
| --- | --- | --- |
| SILA-001 | Monorepo, lint, types, CI and migrations on fresh Postgres | One-command clean setup |
| SILA-002 | Token-driven EN/AR shared components and layout | Screenshots + RTL reader walkthrough |
| SILA-003 | Organization/venue context with guest experience | Switch without leaking previous venue |
| SILA-004 | Auth/session/recovery and invitation flow | Replay, expiration and session revocation |
| SILA-005 | Organization membership and scoped policy engine | Cross-tenant adversarial matrix |
| SILA-006 | Prayer schedules/import draft/publication pipeline | DST/source/override/correction tests |
| SILA-007 | Today and public worship experience | Guest works offline-stale with clear label |
| SILA-008 | Steward overview and worship approval queue | Authorized edit + denied review tests |
| SILA-009 | Gathering models, discover/read and event detail | Published-only server-side filter |
| SILA-010 | RSVP + cancellation + check-in + notifications | Concurrency/idempotency, E2E |

Then proceed to protected learning, volunteering and treasury only when their prerequisite modules are approved. All work should land on the agreed repository branch and use this document's acceptance register.

---

## 32. Product design deliverables before build

A designer/product engineer must produce:
- Brand exploration: two non-copycat visual territories, rationale, Arabic wordmark proofing and accessible logo variants.
- Navigation map with every guest/member/steward/dependent/teacher state.
- Component tokens and Figma/Storybook synchronization policy.
- Key screens in both languages and themes: Today, prayers, gathering, RSVP, learning catalog, child enrollment, give, receipts, You, Steward queue, critical approvals.
- Interaction prototype for J01–J14 showing keyboard, loading, error, missing data, confirmation and recovery.
- Copy deck with localized notifications and validation errors.
- Design QA plan for voice/read order, high contrast, dynamic type, reduced motion and platform-safe areas.
- Asset provenance register and licensed/consented photography records.
- UX research plan with guests, elders, youth, guardians, teachers, volunteers and people with disabilities.

**Visual acceptance:** no crowded dashboards, broken Arabic baseline, truncated invoice amount, poor focus indication, unreadable glass overlay, decorative fake statistics or inaccessible icon-only control.

---

## 33. Product security review checklist

Every release/security reviewer should verify:
- [ ] Session tokens and secrets are securely stored/rotated with revocation tested.
- [ ] Admin finance and sensitive data operations require fresh privileged assurance.
- [ ] All routes enforce effective organization/scope policy, not UI role checks.
- [ ] Guardian and student access is explicit, expiring/revocable and negative-tested.
- [ ] No confidential case information in email, logs, search, push, display or analytics.
- [ ] Payment webhooks verify raw signed payload and store immutable events.
- [ ] Refunds and journal entries reconcile exactly once and cannot be self-approved.
- [ ] Object storage has private access, scanning and short-lived policy-scoped URLs.
- [ ] Data retention, deletion exceptions and consent are configured and audited.
- [ ] Dependency, image and infrastructure scans are reviewed; high findings resolved.
- [ ] Device, browser, RTL and assistive-technology acceptance evidence exists.
- [ ] Database restore and urgent mosque schedule correction drills succeed.
- [ ] Support and incident responders know escalation, key custody and access limits.
- [ ] There are no placeholder donation links or hard-coded people/school data in production.

All checkboxes are **unchecked until evidence exists**.

---

## 34. External references and standards (verify current versions during implementation)

**Design and accessibility**
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Android design and accessibility guidance: https://developer.android.com/design
- Unicode bidirectional text reference: https://unicode.org/reports/tr9/

**Security and privacy**
- OWASP ASVS: https://asvs.owasp.org/
- OWASP Mobile MASVS: https://mas.owasp.org/MASVS/
- OWASP Mobile Application Security Testing Guide: https://mas.owasp.org/MASTG/
- NIST Secure Software Development Framework: https://csrc.nist.gov/Projects/ssdf

**Platform and integration**
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo authentication and protected navigation: https://docs.expo.dev/router/advanced/authentication/
- React Native: https://reactnative.dev/
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/
- OpenAPI Specification: https://spec.openapis.org/oas/latest.html
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests

These are learning and engineering references, not certificates or proof of compliance. Technology versions and provider policies should be checked at the time of implementation.

---

## 35. The final standard for SILA

The program is finished **only** when a person can open it, understand it, trust it and complete the task they came for; a teacher cannot accidentally disclose another child's records; a treasurer cannot fake a payment or approve their own refund; a steward can correct a worship schedule without confusion; a volunteer knows their true shift; a person asking for help is treated with dignity; Arabic and English are equally usable; and the organization can restore, maintain and operate the system without the original developer.

**The goal is not to reproduce the old app with new file names. The goal is to build the right product, with a new concept, original brand, clear interaction language, coherent architecture, strict domain boundaries and measurable correctness.**

**Owner approval status:** Proposed concept, awaiting approval.  
**Engineering implementation status:** Not asserted; this file is a specification, not an implementation certificate.  
**Repository action authorized by this request:** Replace only the content of root document.md on development. Do not delete code, create project files, change branches, deploy services or claim production completion solely from this document.

**End of SILA product blueprint.**

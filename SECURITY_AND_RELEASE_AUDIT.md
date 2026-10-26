# Masjid Community — Release Audit and Verification Matrix

**Last reviewed:** 2026-10-26. **Release status: NOT READY.** Draft PR #2 deliberately remains unmerged.

## What has been done
- Repository structure inventoried: 316 files in the initial development branch tree, approximately 283 TypeScript/TSX source files. **Not every function has been individually tested.**
- Web staff routes and dashboard components: corrected dozens of numeric Prisma ID/type inconsistencies; added backend access checks for staff dashboard and scoped student records, notifications, and parent portal.
- Auth: replaced unsigned mobile session tokens with authenticated, expiring tokens; added authenticated native profile endpoints and revalidation of cached sessions. Added one-time hashed email verification with verified-parent access enforcement and an explicit Resend provider. Production delivery and link redemption still need end-to-end testing.
- Mobile/service endpoints: prayer times, public announcements, jobs and applications, volunteering, proposals and votes, school classes, class schedules, instructor-assessed progress, assignments, attendance, verified parent access, rental bookings, leaderboards, and public event listings/detail/RSVP are now partly wired to persisted endpoints.
- Payments: removed fake donation success confirmation, fake fundraising totals, fake recurring subscriptions, and fabricated tax receipts from key mobile flows. Added Stripe Checkout, signed webhook path, per-account donation history and recurring-subscription management; donation ownership, proposal votes, email verification and school invoice billing have **additive database migration scripts**.
- Administration: replaced the fake native user list with role-restricted searchable pagination and audited account status/role updates; built a web school-billing dashboard for invoicing, invoice review and safe void actions.
- School billing: removed fabricated parent tuition invoices and built real parent-scoped invoice read/checkout flows, with amount-bound Stripe webhook confirmation, retry idempotency and refund status.
- Design system: responsive web dashboard and form controls, light/dark design tokens, focus and reduced-motion behavior, phone and tablet-centered mobile screen layouts, actionable 44px+ touch targets where modified, and a less cluttered layout.
- CI: PostgreSQL 16 ephemeral test DB, guarded CI-only admin seed, Prisma validation, web/mobile tests and TypeScript checks, Next.js build, and Chromium Playwright browser checks configured for 390px phone, 820px iPad and 1440px desktop widths.

## Verified vs. pending

| Area | Most recent evidence / limitations |
| --- | --- |
| Mobile unit tests | **81/81 passed** in an earlier complete run; latest feature edits require a fresh complete run. |
| Staff unit tests | **33/33 passed** in an earlier complete run; latest edits require a fresh complete run. |
| Prisma schema / TypeScript / Next.js build | Passed in previous green CI runs (e.g. run `40383357529`) prior to the newest changes. |
| PostgreSQL integration | Local CI database creation succeeded; comprehensive CRUD, authorization, migrations, and real data behavior not yet certified. |
| Chromium responsive/browser testing | **Not yet passed.** The browser harness now starts the server and previously exposed a Next.js route collision and mobile navigation/login failure paths; corrections were committed. Fresh E2E tests, including parent verification and invoice creation, remain pending. |
| Real Stripe payments | **Not tested in Stripe test mode end-to-end.** Subscriptions, webhook retries/idempotency, refunds and customer receipts need a staging pass. |
| iOS/iPadOS/Android | **Not built or manually tested on physical devices.** Browser viewport tests are not substitutes for native device validation. |
| Email, notifications, offline state | Resend delivery requires production sender/API configuration and testing; push notifications and offline behavior remain unverified. |

## Known unfinished features and critical work

- **Security:** The public Git history contains previously committed credentials; deleting HEAD copies does not revoke them. Rotate all database passwords, NextAuth secrets, email and payment-provider credentials that were real, and affected seed-user passwords. Reconfigure secure environment variables and review logs. Do not commit replacements.
- **Financial integrity:** Existing guest payments are not retroactively linked to user accounts (email alone is insufficient proof). Configure and verify Stripe receipt URLs. Test recurring cancellations and invoice renewals. Some accounting/CRM screens still contain sample financial records; these must be replaced or disabled before production. School parent invoices are now database-backed but have not passed Stripe test-mode payment verification.
- **Remaining screen mocks:** Mobile admin job/volunteer/audit screens, CRM analytics and workflows, finances budgets/expenses, school resources and some other routes still contain mock values or incomplete actions. Native user management, tuition invoices, school progress and class schedules have been converted to database-backed workflows but require fresh CI and device testing. This PR does **not** certify all features complete.
- **Database deployment:** Review and apply additive `Donation.userId`, `ProposalVote`, `EmailVerificationToken`, and `SchoolInvoice` migration scripts against a backed-up staging database, then production after approval. CI `prisma db push` is not production migration review.
- **Build assets:** Existing Expo icons/splash files have placeholder-size image files and need real production PNGs and app-store build validation.
- **Security hardening:** Audit every private route; use distributed rate limits (the in-memory map is not a durable serverless rate limiter); verify file uploads, outbound email, consent, role permissions, and risks around children’s information.
- **Responsive design:** Complete visual regression tests at narrow phones, tablets/iPads, large desktops; include keyboard, VoiceOver, TalkBack, dynamic type, light/dark, and landscape orientation.

## Required release gates

1. Rotate compromised credentials and confirm production secrets are configured privately.
2. Obtain a **green fresh CI run** covering Prisma, staff/mobile unit tests, TypeScript and Next build.
3. Pass Chromium Playwright tests for phone, tablet and desktop; compare rendered pages with actual design requirements.
4. Replace/disable remaining production mocks and implement their real backend data and authorization.
5. Pass Stripe sandbox payment/webhook/subscription and secure email-provider flows with staging DB.
6. Validate iOS/iPadOS/Android native app builds, Expo assets, accessibility and notifications on physical devices.
7. Review and merge draft PR only after all the above are satisfied.

**Do not claim 100% functionality, flawless design or safe live deployment from unit tests and code review alone.**

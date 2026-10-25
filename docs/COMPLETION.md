# Completion checklist

Reviewed against the `development` branch starting at `1ac0bf8ac20e9d64364442b5b0d61bf7b9bdd772` on October 25, 2026.

## Implemented in this branch

- Redesigned responsive staff sign-in page with consistent blue styling, accessible labels, autocomplete, and error announcements.
- Improved dashboard spacing, mobile width handling, shared brand tokens, keyboard focus, reduced-motion behavior, and theme persistence.
- Added labels, current-page indicators, missing navigation icons, mobile focus trapping, Escape-to-close, focus restoration, and matching role-based route/navigation access.
- Replaced unsigned mobile login tokens with expiring encrypted tokens and database checks for current account status and role. Restoring a mobile session now verifies it with the server, and expired access clears the signed-in UI.
- Added current-user and whitelisted profile update endpoints. Failed profile saves no longer claim a local edit was saved remotely.
- Corrected numeric database IDs in route parameters, filters, session helpers, and dashboard controls. Enabled TypeScript build checking instead of ignoring errors.
- Removed embedded database/authentication credentials and tracked environment files. Added safe templates and seed password requirements.
- Added initial PostgreSQL migration, local Docker configuration, database commands, and a readiness endpoint.
- Unified mobile service URLs and bearer authentication. Backend origins and URLs ending in `/api` both work.
- Connected home and prayer screens to the public prayer API, with calendar range support, missing-data states, and explicit demo fallback control. Removed invented iqamah offsets.
- Corrected announcement, jobs, worker, volunteer, and rental identifier handling in the primary API service. Rental detail no longer invents an item when none is returned.
- Added public database-backed event listing and authenticated event registration with capacity checks. Mobile event screens wait for API responses rather than timer-based success.
- Added private application, booking, and donation-history endpoints scoped to the signed-in account. Corrected job and volunteer submission paths and numeric IDs.
- Restricted student lookup/application lists to staff or the signed-in parent; restricted uploads and notification mutations to the appropriate account.
- Replaced the mobile donation screen's unconditional success alert with a Stripe Checkout handoff, validated dollar amounts, recurring frequency, and cancellation/return pages.
- Added account/token/URL regression tests, a PostgreSQL-backed CI workflow, and browser smoke tests with screenshot artifacts.

## Verification performed locally

- Staff TypeScript checks pass.
- Mobile TypeScript checks pass.
- Staff unit tests pass (46 tests at the first full regression run; additional API contract tests may increase this count).
- Mobile unit tests pass (83 tests), after updating the old test runner to the version already used by staff-web.
- Production staff build and Expo web export completed. The restricted runtime required a temporary, uncommitted shim for unavailable system memory statistics during the local Next.js build.
- Prisma initial migration SQL generated from the schema without connecting to an existing database.

No live deployment database was modified. Applying the migration, guardian/role integration tests, and real payment/email tests require a configured test environment. Browser installation failed in this environment because the downloaded archive was incomplete, so visual screenshots and browser smoke tests are pending CI or a local browser. Native device QA is also pending.

## Still required before the whole app is complete

| Area | Remaining work and acceptance condition |
| --- | --- |
| Mobile admin screens | Users, jobs, volunteers, announcements, audit logs, and settings still contain local data or simulated actions. Connect each list/action to the staff API and verify role restrictions and errors. |
| School and parent extensions | Attendance check-in, grades, teacher/parent dashboards, report cards, tuition payments, class details, and resources contain sample data or reference missing endpoints/models. Define persisted records, connect ownership/teacher assignments, and verify each flow. |
| CRM extensions | Donors/campaigns/pledges, facilities, tasks, volunteer shifts/teams/hours, and analytics reference endpoints not yet implemented in staff-web. Add the required schema/contracts and replace local reporting data. |
| Proposals | Detail/comments/voting screens still simulate records or votes. Add persisted voting/comment contracts and permission checks; the current list exposes a placeholder vote count. |
| Donation history, receipts, subscriptions | Connect remaining sample screens to verified Stripe/database data, add customer receipt links and subscription management, and verify recurring webhook idempotency and accounting. |
| Extended authentication | Social sign-in, token refresh, and code-based password reset service methods reference absent routes. The existing backend implements link-based reset; complete its pages/delivery or align the mobile flow. |
| Notifications | Confirm device-token ownership, notification list response shapes, persisted read status, delivery permissions, and push behavior on Android/iOS. |
| Qibla and prayer calendar | Verify compass/location behavior on real devices, masjid timezone behavior when users travel, future dates, midnight rollover, and configured iqamah times. |
| Media | Replace ephemeral local uploads with durable storage before serverless production use; verify file type/size validation and access controls. |
| Public submissions | Add full server-side validation, abuse limits, duplicate prevention, and concurrency checks across enrollment, volunteer, rental, job, contact, and proposal submissions. Partial validation and ID/rental-date corrections are included here. |
| Design acceptance | Review every remaining screen at phone/tablet/desktop widths, large text, keyboard/screen reader operation, dark mode, and loading/empty/error states. Existing static-color mobile screens need further theme alignment. |
| Deployment | Rotate exposed historical credentials, connect a test database, apply/baseline migrations, configure email/Stripe/storage, run CI/browser tests, and verify native builds. |

This checklist intentionally does not label sample-only screens or untested external integrations as finished. It is the remaining release scope, not a claim of production readiness.

## Next implementation batch: jobs and deployment foundation

Added Community navigation for jobs/events/applications/workers/news/projects, job detail navigation, correct salary-period display, loading/retry/unavailable states, and truthful submission feedback. Job submission now derives identity from the signed-in session, rejects expired jobs, validates input, and checks duplicate applications inside serializable transactions with conflict retries. Email failure no longer reports an already committed application as failed.

Removed seed password logging and database push/demo seeding from root deployment builds. Added `npm run admin:create` for explicit administrator creation without demo records. This command has not been run against a live database.

Eight focused job validation/API tests passed; staff and mobile type checks completed without diagnostics. Database concurrency integration tests, device/visual review, complete jobs staff CRUD/saved-job behavior, and live deployment checks are pending. See `FEATURE-AUDIT.md` and `../accomplish.md`.

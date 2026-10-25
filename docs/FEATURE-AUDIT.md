# Feature and route audit

This inventory is generated from the current source tree. A route existing does not mean its workflow is complete. Sample/timer markers are review leads, not proof of correctness or incorrectness.

## Findings from the first implementation batch

| Area | Finding | Current action / remaining evidence |
| --- | --- | --- |
| Jobs discovery | Community had no Jobs link; list offered email instead of the existing detail/application flow | Added reachable Jobs and application history links and routed listings into details |
| Job submission | Failure handler claimed success; server trusted applicant identity | Removed fake success; added session-derived identity, validation, expiry and duplicate checks |
| Jobs salary | List guessed hourly/yearly from amount; details always said yearly | Use the API salary period |
| Deploy builds | Root config pushed schema and seeded data during build | Build now only builds; document root directory and separate migrations |
| Staff access | No live credentials verified; seed printed a password | Removed logging; added explicit admin provisioning command; live setup remains blocked on configured database/access |
| School / proposals / notifications / CRM | Sample-only or simulated behavior remains | Complete each workflow; do not release as production-complete |

## App route inventory

| Source | Review lead |
| --- | --- |
| `masjid-mobile/app/(auth)/login.tsx` | Manual workflow review required |
| `masjid-mobile/app/(auth)/register.tsx` | API usage |
| `masjid-mobile/app/(tabs)/community.tsx` | API usage |
| `masjid-mobile/app/(tabs)/index.tsx` | API usage |
| `masjid-mobile/app/(tabs)/prayers.tsx` | API usage |
| `masjid-mobile/app/(tabs)/profile.tsx` | Manual workflow review required |
| `masjid-mobile/app/(tabs)/school.tsx` | API usage |
| `masjid-mobile/app/(tabs)/settings.tsx` | API usage |
| `masjid-mobile/app/admin/announcements.tsx` | timer |
| `masjid-mobile/app/admin/audit-logs.tsx` | Manual workflow review required |
| `masjid-mobile/app/admin/index.tsx` | Manual workflow review required |
| `masjid-mobile/app/admin/jobs.tsx` | Manual workflow review required |
| `masjid-mobile/app/admin/settings.tsx` | Manual workflow review required |
| `masjid-mobile/app/admin/users.tsx` | Manual workflow review required |
| `masjid-mobile/app/admin/volunteers.tsx` | Manual workflow review required |
| `masjid-mobile/app/announcements/[id].tsx` | API usage |
| `masjid-mobile/app/applications/index.tsx` | API usage |
| `masjid-mobile/app/blog/[id].tsx` | API usage |
| `masjid-mobile/app/blog/index.tsx` | API usage |
| `masjid-mobile/app/construction/index.tsx` | API usage |
| `masjid-mobile/app/crm/donations.tsx` | Manual workflow review required |
| `masjid-mobile/app/crm/facilities.tsx` | Manual workflow review required |
| `masjid-mobile/app/crm/index.tsx` | timer |
| `masjid-mobile/app/crm/reports.tsx` | mock data |
| `masjid-mobile/app/crm/tasks.tsx` | Manual workflow review required |
| `masjid-mobile/app/crm/volunteers.tsx` | Manual workflow review required |
| `masjid-mobile/app/donate.tsx` | API usage |
| `masjid-mobile/app/donations/history.tsx` | API usage |
| `masjid-mobile/app/donations/receipts.tsx` | Manual workflow review required |
| `masjid-mobile/app/donations/recurring.tsx` | Manual workflow review required |
| `masjid-mobile/app/events/[id].tsx` | API usage |
| `masjid-mobile/app/events/index.tsx` | API usage |
| `masjid-mobile/app/finances/index.tsx` | API usage |
| `masjid-mobile/app/jobs/[id].tsx` | API usage |
| `masjid-mobile/app/jobs/apply/[id].tsx` | API usage |
| `masjid-mobile/app/jobs/index.tsx` | API usage |
| `masjid-mobile/app/jobs/saved.tsx` | API usage |
| `masjid-mobile/app/kiosk.tsx` | Manual workflow review required |
| `masjid-mobile/app/notifications.tsx` | mock data, API usage |
| `masjid-mobile/app/onboarding.tsx` | Manual workflow review required |
| `masjid-mobile/app/prayers/calendar.tsx` | API usage |
| `masjid-mobile/app/prayers/qibla.tsx` | Manual workflow review required |
| `masjid-mobile/app/profile/edit.tsx` | API usage |
| `masjid-mobile/app/proposals/[id].tsx` | timer |
| `masjid-mobile/app/proposals/index.tsx` | mock data, API usage |
| `masjid-mobile/app/proposals/voting.tsx` | Manual workflow review required |
| `masjid-mobile/app/rentals/[id].tsx` | API usage |
| `masjid-mobile/app/rentals/book.tsx` | API usage |
| `masjid-mobile/app/rentals/index.tsx` | API usage |
| `masjid-mobile/app/rentals/my-bookings.tsx` | API usage |
| `masjid-mobile/app/school/applications.tsx` | API usage |
| `masjid-mobile/app/school/attendance-checkin.tsx` | timer |
| `masjid-mobile/app/school/attendance.tsx` | timer |
| `masjid-mobile/app/school/classes/[id].tsx` | timer |
| `masjid-mobile/app/school/classes/index.tsx` | timer |
| `masjid-mobile/app/school/enroll.tsx` | API usage |
| `masjid-mobile/app/school/grades.tsx` | Manual workflow review required |
| `masjid-mobile/app/school/leaderboard.tsx` | API usage |
| `masjid-mobile/app/school/parent/index.tsx` | Manual workflow review required |
| `masjid-mobile/app/school/parent/payments.tsx` | Manual workflow review required |
| `masjid-mobile/app/school/parent/report-card.tsx` | Manual workflow review required |
| `masjid-mobile/app/school/resources.tsx` | Manual workflow review required |
| `masjid-mobile/app/school/schedule.tsx` | Manual workflow review required |
| `masjid-mobile/app/school/student.tsx` | API usage |
| `masjid-mobile/app/school/teacher/index.tsx` | Manual workflow review required |
| `masjid-mobile/app/workers/[id].tsx` | API usage |
| `masjid-mobile/app/workers/index.tsx` | mock data, API usage |

## Staff pages

- `staff-web/src/app/dashboard/applications/page.tsx`
- `staff-web/src/app/dashboard/assignments/page.tsx`
- `staff-web/src/app/dashboard/attendance/page.tsx`
- `staff-web/src/app/dashboard/audit-logs/page.tsx`
- `staff-web/src/app/dashboard/blog/page.tsx`
- `staff-web/src/app/dashboard/classroom/page.tsx`
- `staff-web/src/app/dashboard/construction/page.tsx`
- `staff-web/src/app/dashboard/contact/page.tsx`
- `staff-web/src/app/dashboard/donations/page.tsx`
- `staff-web/src/app/dashboard/error-logs/page.tsx`
- `staff-web/src/app/dashboard/events/page.tsx`
- `staff-web/src/app/dashboard/finances/page.tsx`
- `staff-web/src/app/dashboard/gamification/page.tsx`
- `staff-web/src/app/dashboard/jobs/page.tsx`
- `staff-web/src/app/dashboard/kiosk/page.tsx`
- `staff-web/src/app/dashboard/media/page.tsx`
- `staff-web/src/app/dashboard/newsletter/page.tsx`
- `staff-web/src/app/dashboard/page.tsx`
- `staff-web/src/app/dashboard/prayers/page.tsx`
- `staff-web/src/app/dashboard/proposals/page.tsx`
- `staff-web/src/app/dashboard/rentals/bookings/page.tsx`
- `staff-web/src/app/dashboard/rentals/page.tsx`
- `staff-web/src/app/dashboard/search/page.tsx`
- `staff-web/src/app/dashboard/settings/page.tsx`
- `staff-web/src/app/dashboard/students/page.tsx`
- `staff-web/src/app/dashboard/users/page.tsx`
- `staff-web/src/app/dashboard/volunteers/page.tsx`
- `staff-web/src/app/dashboard/workers/page.tsx`
- `staff-web/src/app/donate/cancel/page.tsx`
- `staff-web/src/app/donate/success/page.tsx`
- `staff-web/src/app/kiosk/tv/page.tsx`
- `staff-web/src/app/page.tsx`

## API handlers

- `staff-web/src/app/api/applications/mine/route.ts`
- `staff-web/src/app/api/assignments/[id]/route.ts`
- `staff-web/src/app/api/assignments/route.ts`
- `staff-web/src/app/api/audit-logs/route.ts`
- `staff-web/src/app/api/auth/2fa/route.ts`
- `staff-web/src/app/api/auth/[...nextauth]/route.ts`
- `staff-web/src/app/api/auth/change-password/route.ts`
- `staff-web/src/app/api/auth/forgot-password/route.ts`
- `staff-web/src/app/api/auth/login/route.ts`
- `staff-web/src/app/api/auth/me/route.ts`
- `staff-web/src/app/api/auth/profile/route.ts`
- `staff-web/src/app/api/auth/register/route.ts`
- `staff-web/src/app/api/auth/reset-password/route.ts`
- `staff-web/src/app/api/auth-login/route.ts`
- `staff-web/src/app/api/backup/route.ts`
- `staff-web/src/app/api/blog/[id]/route.ts`
- `staff-web/src/app/api/blog/categories/[id]/route.ts`
- `staff-web/src/app/api/blog/categories/route.ts`
- `staff-web/src/app/api/blog/route.ts`
- `staff-web/src/app/api/classroom/attendance/route.ts`
- `staff-web/src/app/api/classroom/classes/[id]/route.ts`
- `staff-web/src/app/api/classroom/classes/route.ts`
- `staff-web/src/app/api/classroom/students/[id]/route.ts`
- `staff-web/src/app/api/classroom/students/route.ts`
- `staff-web/src/app/api/construction/[id]/route.ts`
- `staff-web/src/app/api/construction/route.ts`
- `staff-web/src/app/api/contact/[id]/route.ts`
- `staff-web/src/app/api/contact/route.ts`
- `staff-web/src/app/api/donations/checkout/route.ts`
- `staff-web/src/app/api/donations/mine/route.ts`
- `staff-web/src/app/api/donations/route.ts`
- `staff-web/src/app/api/events/[id]/route.ts`
- `staff-web/src/app/api/events/route.ts`
- `staff-web/src/app/api/events/rsvp/[id]/route.ts`
- `staff-web/src/app/api/events/rsvp/route.ts`
- `staff-web/src/app/api/finances/categories/[id]/route.ts`
- `staff-web/src/app/api/finances/categories/route.ts`
- `staff-web/src/app/api/finances/expenses/[id]/route.ts`
- `staff-web/src/app/api/finances/expenses/route.ts`
- `staff-web/src/app/api/finances/reports/route.ts`
- `staff-web/src/app/api/finances/route.ts`
- `staff-web/src/app/api/health/route.ts`
- `staff-web/src/app/api/jobs/[id]/route.ts`
- `staff-web/src/app/api/jobs/route.ts`
- `staff-web/src/app/api/kiosk/[id]/route.ts`
- `staff-web/src/app/api/kiosk/content/route.ts`
- `staff-web/src/app/api/kiosk/emergency/route.ts`
- `staff-web/src/app/api/kiosk/route.ts`
- `staff-web/src/app/api/kiosk/schedule/route.ts`
- `staff-web/src/app/api/kiosk/tv-data/route.ts`
- `staff-web/src/app/api/logs/errors/route.ts`
- `staff-web/src/app/api/media/route.ts`
- `staff-web/src/app/api/newsletter/route.ts`
- `staff-web/src/app/api/notifications/[id]/read/route.ts`
- `staff-web/src/app/api/notifications/register/route.ts`
- `staff-web/src/app/api/notifications/route.ts`
- `staff-web/src/app/api/portal/students/route.ts`
- `staff-web/src/app/api/prayers/[id]/route.ts`
- `staff-web/src/app/api/prayers/route.ts`
- `staff-web/src/app/api/proposals/[id]/route.ts`
- `staff-web/src/app/api/proposals/comments/[id]/route.ts`
- `staff-web/src/app/api/proposals/comments/route.ts`
- `staff-web/src/app/api/proposals/route.ts`
- `staff-web/src/app/api/public/announcements/route.ts`
- `staff-web/src/app/api/public/blog/route.ts`
- `staff-web/src/app/api/public/construction/route.ts`
- `staff-web/src/app/api/public/contact/route.ts`
- `staff-web/src/app/api/public/events/route.ts`
- `staff-web/src/app/api/public/finances/route.ts`
- `staff-web/src/app/api/public/jobs/route.ts`
- `staff-web/src/app/api/public/newsletter/route.ts`
- `staff-web/src/app/api/public/prayers/route.ts`
- `staff-web/src/app/api/public/proposals/route.ts`
- `staff-web/src/app/api/public/rentals/book/route.ts`
- `staff-web/src/app/api/public/rentals/bookings/route.ts`
- `staff-web/src/app/api/public/rentals/route.ts`
- `staff-web/src/app/api/public/students/[studentId]/route.ts`
- `staff-web/src/app/api/public/students/route.ts`
- `staff-web/src/app/api/public/volunteers/route.ts`
- `staff-web/src/app/api/public/workers/route.ts`
- `staff-web/src/app/api/rentals/[id]/route.ts`
- `staff-web/src/app/api/rentals/bookings/[id]/route.ts`
- `staff-web/src/app/api/rentals/bookings/route.ts`
- `staff-web/src/app/api/rentals/route.ts`
- `staff-web/src/app/api/search/analytics/route.ts`
- `staff-web/src/app/api/search/route.ts`
- `staff-web/src/app/api/settings/route.ts`
- `staff-web/src/app/api/student-reports/[id]/route.ts`
- `staff-web/src/app/api/student-reports/route.ts`
- `staff-web/src/app/api/students/route.ts`
- `staff-web/src/app/api/upload/route.ts`
- `staff-web/src/app/api/users/[id]/route.ts`
- `staff-web/src/app/api/users/preferences/route.ts`
- `staff-web/src/app/api/users/route.ts`
- `staff-web/src/app/api/volunteers/[id]/route.ts`
- `staff-web/src/app/api/volunteers/applications/[id]/route.ts`
- `staff-web/src/app/api/volunteers/route.ts`
- `staff-web/src/app/api/webhooks/stripe/route.ts`
- `staff-web/src/app/api/workers/[id]/route.ts`
- `staff-web/src/app/api/workers/route.ts`

## Required next evidence

- Map each app service method to an API handler and persisted model; complete role and status-transition matrix.
- Run real PostgreSQL concurrency and ownership tests, including competing job applications.
- Inspect deployed staff and mobile builds and verify the owner login with a provisioned account.
- Review touched screens on phone web, iOS, and Android; screenshot and accessibility review remain pending.
- Finish the feature backlog in accomplish.md before release.

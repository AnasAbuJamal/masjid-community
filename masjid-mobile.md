# Masjid Mobile - Feature Gap Analysis

> Comparison between **staff-web** (backend/admin) and **masjid-mobile** (Expo app)

---

## ✅ ALREADY BUILT IN MASJID-MOBILE

### Authentication & User
- Email/password login & registration
- Social login (Google/Apple)
- Onboarding flow for first-time users
- Profile management (view/edit)
- Password change/reset
- Token refresh
- Role-based UI (admin, staff, member, student)

### Prayer Times
- Today's prayer times display (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)
- Jummah (Friday) times
- Next prayer highlighting
- Prayer calendar (monthly view)
- Qibla direction compass
- Prayer notifications/scheduling
- Ramadan prayer times with iftar/suhoor

### Donations & Giving
- Donation modal with campaign selection (General, Expansion, Ramadan)
- Preset amounts + custom amount
- Stripe payment integration
- Donation history
- Recurring donations
- Tax receipts generation & sharing
- Anonymous donations option
- Donation goal progress with % funded and remaining amount

### Blog / News
- Blog listing screen with tag filtering
- Full article detail view with author, date, tags
- Article categories/tags with filterable chips
- Skeleton loading states
- Mock data with fallback for offline

### Construction Projects
- Construction project listing with progress bars
- Visual progress indicators with color coding (red/yellow/blue/green)
- Urgent project flags with red badge
- Project summary stats (total count, urgent count)
- Tap to view description

### Gamification / Leaderboard
- Student leaderboard sorted by points
- Top 3 podium display with champion highlight
- Level badges (Bronze, Silver, Gold, Champion) with icons + colors
- Total points, student count, and average attendance stats
- Attendance percentage shown per student

### Finances
- Financial summary with raised/spent/balance/goal display
- Progress bar toward fundraising goal
- Monthly donation/expense records with net calculation
- Color-coded income vs expense display

### Islamic School (Classes & Enrollment)
- **Class listing** with filtering by type (Quran, Arabic, Islamic Studies, Youth)
- **Class enrollment** with capacity tracking and waitlist
- **Class detail pages** with description, teacher info, requirements
- **Class schedule** with weekly view and time slots
- **Attendance check-in** for students to check in to active classes
- Weekly attendance overview with percentage
- Programs overview (Quran, Arabic, Islamic Studies, Youth)
- Student lookup (by ID)
- Link children to account ("My Children")
- Homework/assignments view with completion status and ratings
- Attendance tracking & history
- Grades & progress view
- Teacher directory with contact info
- Leaderboard button to access gamification

### Community Features
- Volunteer opportunities listing
- My Events tab showing signed-up volunteer opportunities
- Community proposals listing, voting, and creation form with category selection
- **Proposal detail view** with budget, timeline, milestones
- **Proposal comments** for community discussion
- Events (browse & register) with category filtering
- Workers/contractors directory
- Worker detail pages with bio, skills, experience, education, certifications
- Call, email, and portfolio contact options

### Job Board
- Job listings (full-time, part-time, contract, volunteer)
- Job details view with salary, location, employment type
- Saved/bookmarked jobs
- In-app job application form with cover letter
- Apply via email (fallback)
- **Job management (admin)** — create, edit, delete job postings

### My Applications
- Job applications tracking with status (submitted/reviewed/shortlisted/hired/declined)
- Volunteer applications tracking with status (pending/approved/rejected)
- **Volunteer application approval (admin)** — approve/reject workflow for volunteers

### Announcements
- Announcement listings
- Announcement detail view
- Push notifications for announcements
- **Announcement creation (admin)** — create announcements with type, priority, scheduling, kiosk display option

### Notifications
- Push notification center
- Mark as read
- Notification preferences (prayer, donation, announcement, job, general)
- Notification channels (Android)

### Settings & Preferences
- Theme selection (Light, Dark, System)
- Prayer notification toggle
- Announcement notification toggle
- Donation notification toggle
- Profile settings
- Kiosk / TV mode for displaying announcements on TV screens
- Admin dashboard with stats and quick actions
- Admin settings for site configuration
- User management (admin only)

### Admin / Staff Features
- **Admin dashboard** with stats, quick actions, pending items, recent activity
- **User management** with role filtering and status badges
- **Job management** — create, edit, delete job postings
- **Announcement creation** — create with type, priority, scheduling, kiosk option
- **Volunteer approval** — approve/reject volunteer applications
- **Audit logs** — view all system activity with filtering

### Navigation & UX
- 6-tab bottom navigation (Home, Prayers, School, Community, Profile, Settings)
- Modal screens (Donate, Notifications, Onboarding)
- Deep linking support
- Offline caching
- Background data sync
- Skeleton loading states
- Quick action cards on home screen (Donate, News, Events, Projects, Finances, Qibla)
- Hijri date display with Islamic occasions
- Events calendar with category filtering

---

## ❌ MISSING / NOT YET BUILT IN MASJID-MOBILE

### Prayer Times
- [ ] **Prayer time management (admin)** — no CRUD for admins to manage prayer times

### Classroom / Islamic School
- [ ] **Assignment creation** — teachers can't create assignments
- [ ] **Parent contact info** — no parent contact display for student profiles

### Admin / Staff Features
- [ ] **Image/media upload** — no upload functionality for cover images
- [ ] **In-app notification creation** — no ability to send notifications

---

## 📊 FEATURE COVERAGE SUMMARY

| Module | staff-web | masjid-mobile | Coverage |
|--------|-----------|---------------|----------|
| Authentication | Full CRUD + audit | Login/Register/Profile/Edit | 75% |
| Prayer Times | Full CRUD | View + Calendar + Qibla + Ramadan | 60% |
| Blog/News | Full CMS | List + Detail + Tags | 60% |
| Donations | Stripe + records | Stripe + history + anonymous + goal progress | 90% |
| Construction | Full CRUD + progress | Browse + Progress bars | 60% |
| Classroom | Classes + students + attendance | Classes + enrollment + schedule + attendance | 85% |
| Gamification | Points + levels + leaderboard | Leaderboard + Podium + Badges | 70% |
| Finances | Records + summary | Summary + Records | 50% |
| Volunteers | Full CRUD + applications | Browse + signup + My Events + Applications + Admin approval | **100%** |
| Proposals | Full lifecycle | Browse + vote + create + detail + comments | 80% |
| Jobs | Full CRUD + applications | Browse + saved + apply form + Admin CRUD | **100%** |
| Workers | Review + approve | Directory + Detail pages | 50% |
| Announcements | Full CMS + kiosk | View + notifications + Kiosk mode + Admin creation | **100%** |
| Admin/Staff | Full management | Dashboard + Settings + User Management + Jobs + Announcements + Volunteers + Audit Logs | **90%** |
| Audit Logs | Full logging + viewer | Viewer with filters | **100%** |
| Settings | General/Kiosk/Notif/Security | Theme + notif toggles + Kiosk + Admin | 50% |

---

## 🎯 PRIORITY RECOMMENDATIONS

### All Priority Items — ✅ COMPLETE

All high, medium, and low priority items have been built:
- Blog listing + detail view
- Construction project tracker
- Gamification leaderboard
- Edit profile form
- Financial summary
- Worker detail pages
- Job application form
- My Applications screen
- Events listing with categories
- Proposal detail view + comments
- Kiosk/TV mode
- Anonymous donations + goal progress
- Class listing + enrollment + schedule
- Attendance check-in
- Admin dashboard + settings + user management
- **Job management (admin CRUD)**
- **Announcement creation (admin)**
- **Volunteer approval workflow (admin)**
- **Audit logs viewer**

### Remaining (Nice to Have)
1. Prayer time management (admin)
2. Assignment creation (teacher)
3. Image/media upload

---

## 🆕 NEWLY BUILT

### Files Created (Session 1 — High Priority)
- `app/blog/index.tsx` — Blog listing screen with tag filter chips, skeleton loading
- `app/blog/[id].tsx` — Full article detail view with author, date, tags, paragraphs
- `app/construction/index.tsx` — Project tracker with color-coded progress bars, urgent badges
- `app/school/leaderboard.tsx` — Gamification leaderboard with top-3 podium, level badges
- `app/profile/edit.tsx` — Edit profile form with first name, last name, phone

### Files Created (Session 2 — Medium Priority)
- `app/finances/index.tsx` — Financial summary with raised/spent/balance/goal, monthly records
- `app/workers/[id].tsx` — Worker detail page with bio, skills, experience, education, certs
- `app/workers/index.tsx` — Worker directory rewritten with API, link to detail pages
- `app/applications/index.tsx` — My Applications with jobs/volunteers tabs, status tracking
- `app/jobs/apply/[id].tsx` — In-app job application form with cover letter
- `app/proposals/index.tsx` — Proposals rewritten with API, category selection, improved UX

### Files Created (Session 3 — Completion)
- `app/events/index.tsx` — Events listing with categories (religious, educational, youth, family, community)
- `app/proposals/[id].tsx` — Proposal detail view with budget, timeline, milestones, and comments
- `app/kiosk.tsx` — Kiosk/TV mode for displaying announcements on TV screens
- `app/donate.tsx` — Added anonymous donation toggle and donation goal progress display
- `app/(tabs)/index.tsx` — Hijri date integration with Islamic occasions

### Files Created (Session 4 — Classroom & Admin)
- `app/school/classes/index.tsx` — Class listing with type filtering and enrollment status
- `app/school/classes/[id].tsx` — Class detail with enrollment, teacher info, requirements
- `app/school/schedule.tsx` — Weekly class schedule view
- `app/school/attendance-checkin.tsx` — Student attendance check-in with weekly overview
- `app/admin/index.tsx` — Admin dashboard with stats, quick actions, pending items
- `app/admin/settings.tsx` — Admin site settings (general, kiosk, notifications, security, data)
- `app/admin/users.tsx` — User management with role filtering and status badges

### Files Created (Session 5 — Complete Admin Features)
- `app/admin/audit-logs.tsx` — Audit logs viewer with action/entity filtering
- `app/admin/jobs.tsx` — Job management (create, edit, delete job postings)
- `app/admin/announcements.tsx` — Create announcements with type, priority, scheduling, kiosk option
- `app/admin/volunteers.tsx` — Volunteer application approval workflow

### Files Modified
- `app/_layout.tsx` — Added routes for all new screens
- `app/(tabs)/school.tsx` — Added links to classes and schedule
- `app/(tabs)/settings.tsx` — Added Kiosk/TV mode access
- `app/(tabs)/community.tsx` — Added events tab
- `app/proposals/index.tsx` — Links to proposal detail pages
- `app/admin/index.tsx` — Added links to announcements, jobs, audit logs, volunteers

### API Endpoints Expected from staff-web
| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/api/public/blog` | `{ posts: BlogPost[] }` |
| GET | `/api/public/blog?slug=...` | `{ post: BlogPost }` |
| GET | `/api/public/construction` | `{ projects: ConstructionProject[] }` |
| GET | `/api/public/gamification` | `{ students: GamificationStudent[] }` |
| GET | `/api/public/proposals` | `Proposal[]` |
| GET | `/api/public/proposals/:id` | `Proposal` with milestones |
| POST | `/api/public/proposals` | Create new proposal |
| POST | `/api/public/proposals/:id/vote` | Vote on proposal |
| GET | `/api/public/proposals/:id/comments` | `Comment[]` |
| POST | `/api/public/proposals/:id/comments` | Create comment |
| GET | `/api/public/finances` | `{ records: FinancialRecord[] }` |
| GET | `/api/public/finances/summary` | `FinancialSummary` |
| GET | `/api/public/workers` | `{ workers: WorkerProfile[] }` |
| GET | `/api/public/workers/:id` | `WorkerProfile` |
| GET | `/api/school/classes` | `ClassSession[]` |
| POST | `/api/school/classes/:id/enroll` | Enroll in class |
| GET | `/api/school/schedule` | Weekly schedule |
| POST | `/api/school/attendance/checkin` | Check in to class |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/users` | User list |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/settings` | Site settings |
| PUT | `/api/admin/settings` | Update settings |
| GET | `/api/admin/audit-logs` | Audit logs |
| GET | `/api/admin/jobs` | Job listings |
| POST | `/api/admin/jobs` | Create job |
| PUT | `/api/admin/jobs/:id` | Update job |
| DELETE | `/api/admin/jobs/:id` | Delete job |
| GET | `/api/admin/announcements` | Announcements |
| POST | `/api/admin/announcements` | Create announcement |
| GET | `/api/admin/volunteers/applications` | Volunteer applications |
| PUT | `/api/admin/volunteers/applications/:id` | Approve/reject application |
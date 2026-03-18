# Staff Web - Analysis & Completion Status

## Overview

**staff-web** is a Next.js 16 (Turbopack) staff portal for a mosque (Al-Momineen) management system. It includes authentication, role-based access control, and full CRUD operations for multiple modules.

## Tech Stack

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js (next-auth v4)
- **UI Components**: Radix UI primitives + custom components
- **Styling**: Tailwind CSS v4
- **Payment**: Stripe integration
- **Testing**: Vitest + Testing Library

---

## ✅ Already Built

### Authentication & Core
- Login/Authentication (NextAuth with credentials)
- Role-based access (admin, teacher)
- Dark/Light theme toggle
- Audit logging system
- Session management
- **Role Permission Middleware** (new)

### Dashboard & Stats
- Dashboard with overview stats
- Quick stats cards (students, donations, jobs, etc.)

### Content Management
- Prayer Times CRUD + today's display
- Blog/News CRUD (draft/published/archived)
- Kiosk Announcements CRUD

### School Management
- Classroom (Classes + Students) CRUD
- Assignments CRUD with ratings
- Gamification leaderboard + points system

### Operations
- Construction Projects CRUD with progress
- Volunteers Opportunities + Applications CRUD
- Project Proposals CRUD with comments

### Finance
- Financial Records CRUD
- Donations tracking (Stripe integration)

### Community
- Jobs Board CRUD
- Worker Profiles CRUD
- Users Management CRUD

### Administration
- Audit Logs viewing
- Settings (site configuration)
- TV/Kiosk Display

### Public API Endpoints (for Mobile App)
- `/api/public/prayers` - Get prayer times
- `/api/public/blog` - Get blog posts
- `/api/public/volunteers` - Get/view volunteer opportunities, sign up
- `/api/public/proposals` - Submit community proposals
- `/api/public/jobs` - Get/view jobs, apply
- `/api/public/workers` - Get worker profiles, submit profile
- `/api/public/announcements` - Get kiosk announcements

### Stripe Integration
- `/api/webhooks/stripe` - Handle Stripe events (new)
- `/api/donations/checkout` - Create Stripe checkout session (new)

### Email Notifications
- Email utility with multiple provider support: Resend, SendGrid, Nodemailer, Console
- Templates for: new donations, volunteer signups, proposals, job applications
- Automatic notifications based on settings

### File Upload
- `/api/upload` - Upload images (base64 or URL)
- Used by Blog page for cover images

### Role Permission Enforcement
- Middleware-based route protection (`src/middleware.ts`)
- Admin-only routes: users, prayers, blog, construction, volunteers, proposals, finances, donations, jobs, workers, audit-logs, settings, kiosk
- Teacher routes: classroom, assignments, gamification
- Permission utility functions (`src/lib/permissions.ts`)

### Tests
- Utils tests (formatCurrency, formatDate, slugify, etc.)
- Role config tests
- Audit logging tests
- Auth tests (basic)

---

## Project Structure

```
staff-web/
├── prisma/
│   └── schema.prisma       # Database schema (19 models)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── public/     # Public endpoints for mobile app
│   │   │   ├── webhooks/   # Stripe webhooks
│   │   │   └── ...         # Admin API routes
│   │   ├── dashboard/       # Admin dashboard pages (17 pages)
│   │   ├── kiosk/          # Public kiosk display
│   │   ├── layout.tsx      # Root layout with providers
│   │   └── page.tsx        # Landing/login page
│   ├── components/
│   │   ├── ui/             # Reusable UI components (15+)
│   │   ├── app-sidebar.tsx
│   │   ├── role-guard.tsx
│   │   └── require-role.tsx
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config
│   │   ├── prisma.ts       # Prisma client
│   │   ├── utils.ts        # Utility functions
│   │   ├── theme.tsx       # Dark/light theme
│   │   ├── role-config.ts  # Navigation & roles
│   │   ├── audit.ts        # Audit logging
│   │   ├── email.ts        # Email notifications (new)
│   │   └── permissions.ts  # Role guard utilities (new)
│   └── middleware.ts       # Route protection (new)
├── package.json
├── next.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## API Routes (30+ endpoints)

### Admin API Routes
| Route | Methods | Status |
|-------|---------|--------|
| `/api/auth/[...nextauth]` | GET, POST | ✅ |
| `/api/users` | GET, POST | ✅ |
| `/api/users/[id]` | GET, PUT, DELETE | ✅ |
| `/api/prayers` | GET, POST | ✅ |
| `/api/prayers/[id]` | GET, PUT, DELETE | ✅ |
| `/api/blog` | GET, POST | ✅ |
| `/api/blog/[id]` | GET, PUT, DELETE | ✅ |
| `/api/classroom/classes` | GET, POST | ✅ |
| `/api/classroom/classes/[id]` | GET, PUT, DELETE | ✅ |
| `/api/classroom/students` | GET, POST | ✅ |
| `/api/classroom/students/[id]` | GET, PUT, DELETE | ✅ |
| `/api/assignments` | GET, POST | ✅ |
| `/api/assignments/[id]` | GET, PUT, DELETE | ✅ |
| `/api/construction` | GET, POST | ✅ |
| `/api/construction/[id]` | GET, PUT, DELETE | ✅ |
| `/api/volunteers` | GET, POST | ✅ |
| `/api/volunteers/[id]` | GET, PUT, DELETE | ✅ |
| `/api/proposals` | GET, POST | ✅ |
| `/api/proposals/[id]` | GET, PUT, DELETE | ✅ |
| `/api/finances` | GET, POST | ✅ |
| `/api/donations` | GET | ✅ |
| `/api/donations/checkout` | POST | ✅ (new) |
| `/api/jobs` | GET, POST | ✅ |
| `/api/jobs/[id]` | GET, PUT, DELETE | ✅ |
| `/api/workers` | GET, POST | ✅ |
| `/api/workers/[id]` | GET, PUT, DELETE | ✅ |
| `/api/kiosk` | GET, POST | ✅ |
| `/api/kiosk/[id]` | GET, PUT, DELETE | ✅ |
| `/api/settings` | GET, POST | ✅ |
| `/api/audit-logs` | GET | ✅ |
| `/api/upload` | POST | ✅ (new) |

### Public API Routes (for Mobile App)
| Route | Methods | Status |
|-------|---------|--------|
| `/api/public/prayers` | GET | ✅ (new) |
| `/api/public/blog` | GET | ✅ (new) |
| `/api/public/volunteers` | GET, POST | ✅ (new) |
| `/api/public/proposals` | GET, POST | ✅ (new) |
| `/api/public/jobs` | GET, POST | ✅ (new) |
| `/api/public/workers` | GET, POST | ✅ (new) |
| `/api/public/announcements` | GET | ✅ (new) |

### Webhooks
| Route | Methods | Status |
|-------|---------|--------|
| `/api/webhooks/stripe` | POST | ✅ (new) |

---

## Database Models (19 models)

1. User - Authentication & roles
2. PrayerTime - Prayer schedules
3. BlogPost - News/articles
4. Class - Islamic school classes
5. Student - Class students
6. Assignment - Student homework
7. ConstructionProject - Renovation tracking
8. VolunteerOpportunity - Volunteer slots
9. VolunteerApplication - Signups
10. ProjectProposal - Community proposals
11. ProposalComment - Proposal discussions
12. Donation - Stripe donations
13. SiteSetting - Configuration
14. KioskAnnouncement - Display announcements
15. FinancialRecord - Monthly records
16. FinancialSummary - Dashboard totals
17. JobPosting - Job listings
18. JobApplication - Job applications
19. WorkerProfile - Worker resumes
20. AuditLog - Activity tracking

---

## Setup Requirements

### Environment Variables
```env
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="生成的安全密钥"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_SEED_EMAIL="admin@almomineen.org"
ADMIN_SEED_PASSWORD="AdminPass123!"

# Email (optional - defaults to console logging)
EMAIL_PROVIDER="console|resend|sendgrid|nodemailer"
RESEND_API_KEY="re_..."
SENDGRID_API_KEY="SG...."
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user"
SMTP_PASS="pass"
EMAIL_FROM="noreply@almomineen.org"

# Notification settings (in database)
notification_email="admin1@example.com,admin2@example.com"
notify_new_donation="true"
notify_new_volunteer="true"
notify_new_proposal="true"
```

### Setup Commands
```bash
cd staff-web
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

---

## Completion Estimate

**Current Status**: ~95% complete

All major features have been implemented including:
- Full CRUD operations for all modules
- Authentication and role-based access
- Public API endpoints for mobile app integration
- Stripe payment integration with webhook handling
- Email notification system
- File upload functionality
- Role-based route protection
- Test coverage for core utilities

---

## Quick Reference

| Feature | Status | Priority |
|---------|--------|----------|
| Stripe Webhook | ✅ Complete | High |
| Email Notifications | ✅ Complete | High |
| File Upload | ✅ Complete | High |
| Mobile App CORS | ✅ Complete | Medium |
| Tests | ✅ Complete | Medium |
| Role Permissions | ✅ Complete | Medium |

# 🕌 Masjid Al-Momineen — Staff Management Platform

## Full-Stack Implementation Plan

> **Source of truth:** `v0-masjid-al-momineen-platform-main/` (the v0 prototype)
>
> **Goal:** Transform the static v0 prototype into a production-grade, full-stack web application with a real database, Stripe-powered donations, proper authentication, and role-based access for **Admin** and **Teacher** roles (Imam role is merged into Admin).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Roles & Permissions](#3-roles--permissions)
4. [Database Schema](#4-database-schema)
5. [Authentication & Security](#5-authentication--security)
6. [Stripe Donations Integration](#6-stripe-donations-integration)
7. [Dashboard Modules](#7-dashboard-modules)
8. [API Routes](#8-api-routes)
9. [Frontend Structure](#9-frontend-structure)
10. [Phase-by-Phase Build Order](#10-phase-by-phase-build-order)
11. [Environment Variables](#11-environment-variables)
12. [Deployment Strategy](#12-deployment-strategy)
13. [Testing Plan](#13-testing-plan)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │
│  │  Login   │ │Dashboard │ │ Modules  │ │ Stripe │ │ Kiosk  │  │
│  │  Page    │ │  Home    │ │ (CRUD)   │ │Checkout│ │ TV Mode│  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                     API LAYER (Next.js Route Handlers)           │
│  /api/auth/*  /api/prayers/*  /api/donations/*  /api/users/*     │
│  /api/blog/*  /api/classroom/*  /api/stripe/*   /api/settings/*  │
│  /api/jobs/*  /api/workers/*                                     │
├──────────────────────────────────────────────────────────────────┤
│                     MIDDLEWARE                                    │
│  Rate Limiting • JWT Verification • RBAC • CORS • Audit Logging  │
├──────────────────────────────────────────────────────────────────┤
│                     DATABASE (MongoDB + Prisma)                   │
│  Users • PrayerTimes • BlogPosts • Students • Assignments        │
│  Classes • Donations • ConstructionProjects • Volunteers         │
│  ProjectProposals • SiteSettings • AuditLogs                     │
│  JobPostings • JobApplications • WorkerProfiles                  │
├──────────────────────────────────────────────────────────────────┤
│                     EXTERNAL SERVICES                             │
│  Stripe (Donations) • SendGrid/Resend (Email) • Cloudinary (CDN) │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router, Server Actions, Turbopack)  |
| **Language**   | TypeScript 5.7+                                     |
| **UI Library** | shadcn/ui + Radix UI + Tailwind CSS 3.4             |
| **Charts**     | Recharts 2.x                                        |
| **Database**   | MongoDB Atlas (free tier → M10+ for production)     |
| **ORM**        | Prisma 6.x (MongoDB adapter)                        |
| **Auth**       | NextAuth.js v5 (Auth.js) with Credentials provider  |
| **Payments**   | Stripe (Checkout Sessions + Webhooks)                |
| **Email**      | Resend (transactional emails, optional)              |
| **File Upload**| Cloudinary or UploadThing (blog images, avatars)     |
| **Validation** | Zod (already in the v0 prototype)                   |
| **Forms**      | React Hook Form + @hookform/resolvers (already in v0)|
| **State**      | React Server Components + minimal client state       |
| **Deployment** | Vercel (recommended) or Docker + Cloud Run           |

---

## 3. Roles & Permissions

> **Change from v0:** The `imam` role is **removed**. Imam functionality is merged into `admin`. Only two dashboard roles exist.

### 3.1 Role Definitions

| Role        | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| **Admin**   | Full access to everything. Manages all modules, users, finances, settings, donations. Has all former Imam permissions (prayers, blog, construction, volunteers, proposals, finances). |
| **Teacher** | Limited to school-related modules only: Classroom Tracker, Assignments, Gamification. |

### 3.2 Permission Matrix

| Module               | Admin | Teacher |
| -------------------- | :---: | :-----: |
| Dashboard (Home)     | ✅    | ✅      |
| Prayer Times         | ✅    | ❌      |
| Blog / News          | ✅    | ❌      |
| Classroom Tracker    | ✅    | ✅      |
| Assignments          | ✅    | ✅      |
| Gamification         | ✅    | ✅      |
| Construction         | ✅    | ❌      |
| Volunteers           | ✅    | ❌      |
| Project Proposals    | ✅    | ❌      |
| Finances             | ✅    | ❌      |
| Donations (Stripe)   | ✅    | ❌      |
| Jobs Board (Admin)   | ✅    | ❌      |
| Kiosk / TV Settings  | ✅    | ❌      |
| User Management      | ✅    | ❌      |
| Site Settings        | ✅    | ❌      |
| Audit Logs           | ✅    | ❌      |

### 3.3 Mobile App Roles (context — not built here)

The mobile app has its own user types (`member`, `parent`, `student`) that interact with a public-facing API. The web platform is the **internal staff portal**.

---

## 4. Database Schema

### 4.1 Prisma Models (MongoDB)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────────────
//  USERS & AUTH
// ──────────────────────────────────────

model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  role          UserRole  @default(teacher)
  isVerified    Boolean   @default(false)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  blogPosts     BlogPost[]
  assignments   Assignment[]  @relation("AssignmentTeacher")
  auditLogs     AuditLog[]
}

enum UserRole {
  admin
  teacher
}

// ──────────────────────────────────────
//  PRAYER TIMES
// ──────────────────────────────────────

model PrayerTime {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  date      DateTime @unique
  fajr      String
  sunrise   String
  dhuhr     String
  asr       String
  maghrib   String
  isha      String
  jummah1   String?
  jummah2   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ──────────────────────────────────────
//  BLOG / NEWS
// ──────────────────────────────────────

model BlogPost {
  id         String     @id @default(auto()) @map("_id") @db.ObjectId
  title      String
  slug       String     @unique
  body       String
  coverImage String?
  tags       String[]
  status     PostStatus @default(draft)
  authorId   String     @db.ObjectId
  author     User       @relation(fields: [authorId], references: [id])
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

enum PostStatus {
  draft
  published
  archived
}

// ──────────────────────────────────────
//  SCHOOL: CLASSES, STUDENTS, ASSIGNMENTS
// ──────────────────────────────────────

model Class {
  id           String    @id @default(auto()) @map("_id") @db.ObjectId
  name         String
  teacherName  String
  schedule     String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  students     Student[]
}

model Student {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  studentId      String   @unique               // Public ID for lookup (e.g., "STU-2024-001")
  firstName      String
  lastName       String
  classId        String   @db.ObjectId
  class          Class    @relation(fields: [classId], references: [id])
  parentName     String
  parentEmail    String?
  parentPhone    String?
  totalPoints    Int      @default(0)
  currentLevel   Int      @default(1)
  attendanceRate Float    @default(0)
  attendanceStatus AttendanceStatus @default(good)
  photoUrl       String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  assignments    Assignment[]
}

model Assignment {
  id          String           @id @default(auto()) @map("_id") @db.ObjectId
  studentId   String           @db.ObjectId
  student     Student          @relation(fields: [studentId], references: [id])
  teacherId   String           @db.ObjectId
  teacher     User             @relation("AssignmentTeacher", fields: [teacherId], references: [id])
  date        DateTime
  type        AssignmentType
  location    AssignmentLocation
  description String
  status      AssignmentStatus @default(pending)
  rating      Rating           @default(none)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

enum AssignmentType {
  new_lesson
  review
}

enum AssignmentLocation {
  masjid
  home
}

enum AssignmentStatus {
  pending
  completed
}

enum Rating {
  none
  weak
  good
  very_good
  excellent
}

enum AttendanceStatus {
  excellent   // 95-100%
  very_good   // 85-94%
  good        // 75-84%
  needs_improvement // 60-74%
  poor        // below 60%
}

// ──────────────────────────────────────
//  CONSTRUCTION
// ──────────────────────────────────────

model ConstructionProject {
  id              String  @id @default(auto()) @map("_id") @db.ObjectId
  title           String
  description     String?
  progressPercent Int     @default(0)
  isUrgent        Boolean @default(false)
  displayOrder    Int     @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ──────────────────────────────────────
//  VOLUNTEERS
// ──────────────────────────────────────

model VolunteerOpportunity {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  title        String
  description  String
  eventDate    DateTime
  spotsTotal   Int
  spotsFilled  Int      @default(0)
  status       VolunteerStatus @default(open)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  applications VolunteerApplication[]
}

enum VolunteerStatus {
  open
  closed
}

model VolunteerApplication {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  opportunityId   String   @db.ObjectId
  opportunity     VolunteerOpportunity @relation(fields: [opportunityId], references: [id])
  userName        String
  userEmail       String
  userPhone       String?
  skills          String?
  status          ApplicationStatus @default(pending)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ApplicationStatus {
  pending
  approved
  rejected
}

// ──────────────────────────────────────
//  COMMUNITY PROJECT PROPOSALS (Enhanced)
// ──────────────────────────────────────

model ProjectProposal {
  id              String         @id @default(auto()) @map("_id") @db.ObjectId
  title           String
  summary         String                  // short pitch (1-2 sentences)
  description     String                  // full detailed description
  category        ProposalCategory
  submitterName   String
  submitterEmail  String
  submitterPhone  String?
  submitterRole   String?                 // e.g., "Community Member", "Teacher"

  // ── Budget & Cost Breakdown ──
  totalBudget     Float                   // total estimated cost
  budgetItems     Json[]                  // array of { item, description, quantity, unitCost, total }
  fundingSource   String?                 // e.g., "Masjid fund", "External grant", "Community fundraising"
  isFundingSecured Boolean @default(false)

  // ── Implementation Plan ──
  objectives      String[]                // list of goals / expected outcomes
  timeline        Json[]                  // array of { phase, description, startDate, endDate, deliverables }
  estimatedDuration String                // e.g., "3 months", "6 weeks"
  startDate       DateTime?               // proposed start date
  endDate         DateTime?               // proposed end date
  milestones      Json[]                  // array of { title, targetDate, description, status }

  // ── Resources & Requirements ──
  resourcesNeeded String[]                // e.g., ["Room", "Projector", "10 Volunteers"]
  volunteersNeeded Int?                   // number of volunteers required
  skillsRequired  String[]                // e.g., ["Carpentry", "Event Planning"]
  spaceRequired   String?                 // e.g., "Main hall", "Classroom 2"

  // ── Impact & Justification ──
  targetAudience  String?                 // who benefits? e.g., "Youth ages 13-18"
  expectedImpact  String?                 // anticipated community benefit
  communityNeed   String?                 // why is this needed?
  successMetrics  String[]                // how to measure success

  // ── Attachments ──
  attachments     Json[]                  // array of { name, url, type } (PDFs, images, docs)
  coverImage      String?                 // optional proposal cover image

  // ── Admin Review ──
  status          ProposalStatus @default(pending)
  adminNotes      String?                 // internal admin notes
  reviewedBy      String?                 // admin who reviewed
  reviewedAt      DateTime?               // when reviewed
  rejectionReason String?                 // if declined, why
  priority        ProposalPriority @default(normal)

  // ── Progress Tracking (after approval) ──
  currentPhase    String?                 // which phase is active
  actualSpent     Float?                  // actual amount spent so far
  completionPercent Int?     @default(0)
  isCompleted     Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  comments        ProposalComment[]
}

model ProposalComment {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  proposalId  String   @db.ObjectId
  proposal    ProjectProposal @relation(fields: [proposalId], references: [id])
  authorName  String
  authorRole  String                    // "admin", "submitter", "community"
  message     String
  isInternal  Boolean  @default(false)  // admin-only notes
  createdAt   DateTime @default(now())
}

enum ProposalStatus {
  pending
  under_review
  needs_revision       // admin sent back for changes
  approved
  in_progress          // actively being implemented
  completed
  declined
  on_hold
}

enum ProposalPriority {
  low
  normal
  high
  urgent
}

enum ProposalCategory {
  education          // classes, workshops, tutoring
  youth              // youth programs, mentorship
  community_event    // festivals, gatherings, celebrations
  facility           // building improvements, maintenance
  social_services    // food drives, charity, outreach
  technology         // tech upgrades, apps, website
  sports_fitness     // sports leagues, fitness programs
  arts_culture       // art exhibits, cultural events
  environment        // gardens, green initiatives
  other
}

// ──────────────────────────────────────
//  DONATIONS (STRIPE)
// ──────────────────────────────────────

model Donation {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  stripeSessionId   String   @unique
  stripePaymentId   String?  @unique
  donorName         String?
  donorEmail        String?
  amount            Float                // in cents
  currency          String   @default("usd")
  status            DonationStatus @default(pending)
  isRecurring       Boolean  @default(false)
  stripeSubId       String?              // for recurring donations
  campaign          String?              // e.g., "construction", "general", "ramadan"
  isAnonymous       Boolean  @default(false)
  receiptUrl        String?
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum DonationStatus {
  pending
  completed
  failed
  refunded
}

// ──────────────────────────────────────
//  SITE SETTINGS (singleton-ish)
// ──────────────────────────────────────

model SiteSetting {
  id                     String  @id @default(auto()) @map("_id") @db.ObjectId
  key                    String  @unique
  value                  String
  updatedAt              DateTime @updatedAt
}

// ──────────────────────────────────────
//  KIOSK / TV ANNOUNCEMENTS
// ──────────────────────────────────────

model KioskAnnouncement {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  message     String
  type        AnnouncementType @default(general)
  priority    Int      @default(0)           // higher = shown first
  isActive    Boolean  @default(true)
  startsAt    DateTime @default(now())       // when to start showing
  expiresAt   DateTime?                      // auto-hide after this date
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AnnouncementType {
  general
  urgent
  event
  ramadan
  fundraiser
}

// ──────────────────────────────────────
//  FINANCIALS
// ──────────────────────────────────────

model FinancialRecord {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  month     String               // e.g., "Feb 2026"
  year      Int
  donations Float    @default(0)
  expenses  Float    @default(0)
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model FinancialSummary {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  totalSpent      Float    @default(0)
  bankBalance     Float    @default(0)
  totalGoal       Float    @default(0)
  totalRaised     Float    @default(0)
  remainingNeeded Float    @default(0)
  lastUpdated     DateTime @default(now())
}

// ──────────────────────────────────────
//  COMMUNITY JOBS BOARD
// ──────────────────────────────────────

model JobPosting {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  title           String
  company         String
  contactName     String
  contactEmail    String
  contactPhone    String?
  description     String
  requirements    String[]              // e.g., ["3+ years experience", "CDL License"]
  location        String                // e.g., "Atlanta, GA" or "Remote"
  locationType    LocationType @default(on_site)
  employmentType  EmploymentType @default(full_time)
  salaryMin       Float?                // optional salary range
  salaryMax       Float?
  salaryPeriod    SalaryPeriod? @default(yearly)
  category        String                // e.g., "Construction", "IT", "Education"
  isUrgent        Boolean      @default(false)
  status          JobStatus    @default(pending_review) // admin must approve
  expiresAt       DateTime?             // auto-expire old listings
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  applications    JobApplication[]
}

enum LocationType {
  on_site
  remote
  hybrid
}

enum EmploymentType {
  full_time
  part_time
  contract
  temporary
  internship
}

enum SalaryPeriod {
  hourly
  weekly
  monthly
  yearly
}

enum JobStatus {
  pending_review   // submitted, waiting for admin approval
  active           // approved and visible to public
  paused           // temporarily hidden by poster
  expired          // past expiration date
  closed           // filled or manually closed
  rejected         // admin rejected the posting
}

model JobApplication {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  jobId         String   @db.ObjectId
  job           JobPosting @relation(fields: [jobId], references: [id])
  applicantName  String
  applicantEmail String
  applicantPhone String?
  resumeUrl     String?              // uploaded resume/CV
  coverLetter   String?              // short message to employer
  workerProfileId String? @db.ObjectId
  workerProfile WorkerProfile? @relation(fields: [workerProfileId], references: [id])
  status        JobAppStatus @default(submitted)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum JobAppStatus {
  submitted
  reviewed
  shortlisted
  hired
  declined
}

model WorkerProfile {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  fullName      String
  email         String   @unique
  phone         String?
  headline      String               // e.g., "Experienced Electrician | 10+ Yrs"
  bio           String               // about me / summary
  skills        String[]             // e.g., ["Plumbing", "HVAC", "Welding"]
  experience    Json[]               // array of { title, company, startDate, endDate, description }
  education     Json[]               // array of { degree, institution, year }
  certifications String[]            // e.g., ["OSHA 30", "CPR Certified"]
  location      String               // e.g., "Atlanta, GA"
  availability  Availability @default(available)
  portfolioUrl  String?              // optional link to portfolio/website
  photoUrl      String?
  resumeUrl     String?
  isPublic      Boolean  @default(true) // visible in worker directory
  status        ProfileStatus @default(pending_review) // admin must approve
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  applications  JobApplication[]
}

enum Availability {
  available
  open_to_offers
  not_available
}

enum ProfileStatus {
  pending_review
  approved
  rejected
  suspended
}

// ──────────────────────────────────────
//  AUDIT LOGS
// ──────────────────────────────────────

model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  action    String
  email     String?
  userId    String?  @db.ObjectId
  user      User?    @relation(fields: [userId], references: [id])
  details   String?
  ipAddress String?
  success   Boolean
  createdAt DateTime @default(now())
}
```

---

## 5. Authentication & Security

### 5.1 Auth Stack

| Component           | Implementation                                       |
| ------------------- | ---------------------------------------------------- |
| **Library**         | NextAuth.js v5 (Auth.js) with Credentials Provider   |
| **Password Hashing**| bcrypt (replace plain-text comparison from v0)        |
| **Session**         | JWT (stored in httpOnly cookie)                       |
| **Session Timeout** | 30 min inactivity (keep from v0, enforce server-side) |
| **Rate Limiting**   | In-memory map (dev) → Redis/Upstash (prod)           |
| **RBAC**            | Middleware + `canAccess()` utility (2 roles only)     |

### 5.2 Auth Flow

```
1. User visits / (login page)
2. Enters email + password
3. Client calls NextAuth signIn("credentials", { email, password })
4. Server action:
   a. Sanitize input
   b. Check rate limit
   c. Check honeypot
   d. Look up user in MongoDB by email
   e. bcrypt.compare(password, user.passwordHash)
   f. Return JWT session with { id, email, role, name }
5. Middleware validates JWT on every /dashboard/* request
6. RBAC checks role against the route's permission list
```

### 5.3 Security Features (carried from v0 + enhanced)

- ✅ Honeypot field for bot detection
- ✅ Rate limiting (login + API)
- ✅ Session timeout with countdown warning
- ✅ Input sanitization (Zod + custom)
- ✅ Password strength validation (zxcvbn + HaveIBeenPwned API)
- ✅ Audit logging for all auth events
- ✅ RBAC route protection (middleware + client guard)
- 🆕 bcrypt password hashing (replacing plain-text env comparison)
- 🆕 CSRF protection via NextAuth
- 🆕 HTTP-only JWT cookies (replacing client-side state)
- 🆕 Secure headers (CSP, HSTS, X-Frame-Options)

---

## 6. Stripe Donations Integration

### 6.1 Overview

Stripe will handle **all donation processing** — one-time and recurring. No card data ever touches our server.

### 6.2 Donation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  DONOR (Public-facing or in-app link)                               │
│                                                                     │
│  1. Clicks "Donate" → selects amount + campaign + one-time/monthly  │
│  2. POST /api/stripe/create-checkout-session                        │
│  3. Redirected to Stripe Checkout (hosted page)                     │
│  4. Completes payment on Stripe                                     │
│  5. Stripe fires webhook → POST /api/stripe/webhook                 │
│  6. Our server creates Donation record in MongoDB                   │
│  7. Donor redirected to /donate/thank-you                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Stripe API Routes

| Route                                | Method | Description                                      |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `/api/stripe/create-checkout-session`| POST   | Creates a Stripe Checkout Session                |
| `/api/stripe/webhook`               | POST   | Handles Stripe webhook events                    |
| `/api/stripe/portal`                | POST   | Creates a Stripe Customer Portal session (manage recurring) |
| `/api/donations`                    | GET    | List all donations (admin only)                  |
| `/api/donations/stats`              | GET    | Donation statistics & totals (admin only)        |
| `/api/donations/export`             | GET    | Export donations as CSV (admin only)             |

### 6.4 Stripe Webhook Events to Handle

| Event                               | Action                                                |
| ------------------------------------ | ----------------------------------------------------- |
| `checkout.session.completed`         | Create Donation record (status: completed)            |
| `payment_intent.succeeded`          | Update Donation with payment ID + receipt URL         |
| `payment_intent.payment_failed`     | Update Donation status to failed                      |
| `invoice.payment_succeeded`         | Record recurring donation payment                     |
| `customer.subscription.deleted`     | Mark subscription as cancelled                        |
| `charge.refunded`                   | Update Donation status to refunded                    |

### 6.5 Donation Campaigns

Donations can be tagged to specific campaigns:

- `general` — General Fund
- `construction` — Masjid Building Fund
- `ramadan` — Ramadan Giving
- `education` — School & Education Fund
- `zakat` — Zakat Fund
- `sadaqah` — Sadaqah
- `custom` — Custom amount (specify)

### 6.6 Dashboard: Donations Module (Admin Only)

New dashboard page at `/dashboard/donations`:

- **Summary Cards:** Total raised, This month, Active subscriptions, Average donation
- **Donations Table:** Paginated list with filters (date range, campaign, status, amount)
- **Campaign Breakdown:** Bar chart showing donations by campaign
- **Recent Donations Feed:** Real-time-ish list of latest donations
- **Export:** CSV download of donation records
- **Recurring Donors:** List of active subscribers with management links (Stripe portal)

### 6.7 Public Donation Page

A public-facing page at `/donate` (no auth required):

- Campaign selector (dropdown or card grid)
- Amount presets ($25, $50, $100, $250, $500, Custom)
- One-time vs Monthly toggle
- Optional: Donor name, email, anonymous checkbox
- "Donate with Stripe" button → redirects to Stripe Checkout
- Thank you page at `/donate/thank-you`

---

## 7. Dashboard Modules

### 7.1 Module Map (from v0 → production)

| Module                | v0 Status       | Production Changes                                                    |
| --------------------- | --------------- | --------------------------------------------------------------------- |
| **Dashboard Home**    | ✅ Mock data    | Connect to real aggregated DB queries                                 |
| **Prayer Times**      | ✅ Mock data    | CRUD API → MongoDB, CSV import, auto-publish to mobile app            |
| **Blog / News**       | ✅ Mock data    | Full CRUD with rich text editor (Tiptap), image upload, publish/draft |
| **Classroom Tracker** | ✅ Mock data    | Real student management, attendance tracking, class CRUD              |
| **Assignments**       | ✅ Mock data    | CRUD with teacher assignment, student linking, rating system          |
| **Gamification**      | ✅ Mock data    | Points engine, leaderboard from real data, level progression          |
| **Construction**      | ✅ Mock data    | CRUD, drag-to-reorder, urgency toggles, syncs to mobile app          |
| **Volunteers**        | ✅ Mock data    | Kanban board, application management, email notifications             |
| **Proposals**         | ✅ Mock data    | **Enhanced:** public submission, budget breakdown, timeline, milestones, progress tracking (see 7.4) |
| **Finances**          | ✅ Mock data    | Real financial records + Stripe donation integration                  |
| **💰 Donations**      | 🆕 New          | Stripe integration (see Section 6 above)                              |
| **💼 Jobs Board**     | 🆕 New          | Two-sided: employers post jobs, workers publish profiles (see 7.3)    |
| **📺 Kiosk / TV**     | 🆕 New          | Digital signage for lobby TVs — prayer countdown, QR donations, news (see 7.5) |
| **User Management**   | ✅ Mock data    | Real CRUD, bcrypt passwords, role management                         |
| **Site Settings**     | ✅ Mock data    | Key-value store in MongoDB, emergency alerts, kiosk config            |
| **📋 Audit Logs**     | 🆕 New          | Searchable log viewer (admin only)                                    |

### 7.2 Dashboard Home Stats (Real Queries)

```
- Total Members: COUNT from User where role = member (mobile app users)
- Total Students: COUNT from Student where isActive = true
- Active Volunteers: COUNT from VolunteerApplication where status = approved
- Today's Attendance: Attendance records for today
- Monthly Donations: SUM from Donation where month = current, status = completed
- Posts Published: COUNT from BlogPost where status = published
- Construction Progress: AVG(progressPercent) from ConstructionProject
- Pending Applications: COUNT from VolunteerApplication where status = pending
- Active Job Listings: COUNT from JobPosting where status = active
- Worker Profiles: COUNT from WorkerProfile where status = approved
- Pending Proposals: COUNT from ProjectProposal where status = pending
- Active Proposals: COUNT from ProjectProposal where status = in_progress
```

### 7.3 Community Jobs Board (New Module)

A **two-sided community employment hub** managed by the Admin.

#### 7.3.1 Concept

The masjid acts as a trusted community connector:
- **Job Owners / Employers** (community members, local businesses) submit job postings with requirements.
- **Workers / Job Seekers** (community members) publish profiles showcasing their skills and experience.
- **Admin** moderates all content — approves/rejects job postings and worker profiles before they go public.
- **Applicants** can apply to jobs publicly through the platform.

#### 7.3.2 Dashboard: `/dashboard/jobs` (Admin Only)

**Tab 1 — Job Postings:**
- Kanban view: `Pending Review` → `Active` → `Closed` / `Rejected`
- Each card shows: title, company, location, employment type, salary range, # of applicants
- Admin actions: Approve, Reject, Pause, Close, Delete
- Filters: category, location type, employment type, status
- Search by title or company

**Tab 2 — Worker Profiles:**
- Card grid or table of submitted worker profiles
- Status: `Pending Review` → `Approved` → `Suspended` / `Rejected`
- Admin actions: Approve, Reject, Suspend, Delete
- View full profile (experience, skills, certs, resume)
- Filters: skills, availability, location

**Tab 3 — Applications:**
- Table of all job applications across postings
- Columns: Applicant, Job Title, Company, Status, Date Applied
- Admin can view application details and forward to employer
- Status tracking: Submitted → Reviewed → Shortlisted → Hired / Declined

**Summary Stats (top of page):**
- Active Job Listings
- Pending Reviews (jobs + profiles)
- Total Applications This Month
- Workers Available
- Jobs Filled This Month

#### 7.3.3 Public Pages (No Auth Required)

**`/jobs` — Public Job Board:**
- Filterable/searchable list of approved job postings
- Filter by: category, location type, employment type, salary range
- Job detail page with full description, requirements, salary, and "Apply Now" button
- Application form: name, email, phone, optional resume upload, cover letter, link to existing worker profile

**`/jobs/post` — Submit a Job Posting:**
- Form for employers to submit a new job posting
- Fields: title, company, contact info, description, requirements, location, type, salary range, category
- Submitted as `pending_review` → Admin must approve before it goes live
- Confirmation message: "Your job posting has been submitted for review."

**`/workers` — Worker Directory:**
- Grid view of approved worker profiles
- Filter by: skills, availability, location
- Each card shows: photo, name, headline, key skills, availability badge
- Click to view full profile with experience timeline, education, certifications

**`/workers/register` — Create Worker Profile:**
- Form for workers to create their profile
- Fields: name, email, phone, headline, bio, skills (tag input), experience (dynamic list), education, certifications, portfolio URL, photo upload, resume upload
- Submitted as `pending_review` → Admin must approve before it appears in directory
- Confirmation message: "Your profile has been submitted for review."

#### 7.3.4 Job Categories

Pre-defined categories (admin can add more via Settings):

- 🏗️ Construction & Trades
- 💻 Technology & IT
- 📚 Education & Tutoring
- 🏥 Healthcare
- 🍽️ Food & Hospitality
- 🚗 Transportation & Delivery
- 🧹 Cleaning & Maintenance
- 📊 Business & Accounting
- 🎨 Creative & Design
- 📦 Warehouse & Logistics
- 🤝 Community & Social Services
- 🔧 Other / General Labor

#### 7.3.5 Email Notifications (via Resend)

| Trigger                                | Who Gets Notified       |
| -------------------------------------- | ----------------------- |
| New job posting submitted              | Admin                   |
| Job posting approved                   | Employer (poster)       |
| Job posting rejected                   | Employer (poster)       |
| New application received               | Employer + Admin        |
| Worker profile approved                | Worker                  |
| Worker profile rejected                | Worker                  |
| Application status changed             | Applicant               |

### 7.4 Enhanced Community Proposals (Upgraded Module)

The Proposals module is upgraded from a simple Kanban board into a **full community project submission and tracking system**.

#### 7.4.1 Concept

Anyone in the community can propose a project idea. They provide a complete plan including budget breakdown, timeline, milestones, and impact justification. Admin reviews, approves, and tracks progress.

#### 7.4.2 Public Submission Page: `/proposals/submit`

A multi-step form (wizard) where community members submit detailed proposals:

**Step 1 — Basic Info:**
- Project title
- Category (dropdown: education, youth, community event, facility, etc.)
- Short summary (1-2 sentences)
- Full description (rich text)
- Cover image upload (optional)

**Step 2 — Budget & Costs:**
- Total estimated budget
- Line-item breakdown table:
  | Item | Description | Qty | Unit Cost | Total |
  |------|-------------|-----|-----------|-------|
  | Projector | For presentations | 1 | $500 | $500 |
  | Materials | Art supplies | 20 | $15 | $300 |
- Funding source (dropdown: masjid fund, external grant, community fundraising, self-funded)
- Is funding already secured? (yes/no)

**Step 3 — Implementation Plan:**
- Objectives / expected outcomes (dynamic list)
- Proposed start date + end date
- Estimated duration
- Timeline / phases:
  | Phase | Description | Start | End | Deliverables |
  |-------|-------------|-------|-----|--------------|
  | Phase 1 | Research & Planning | Mar 1 | Mar 15 | Project plan document |
  | Phase 2 | Execution | Mar 16 | Apr 30 | Completed event |
- Milestones:
  | Milestone | Target Date | Description |
  |-----------|-------------|-------------|
  | Venue secured | Mar 5 | Book main hall |
  | Materials purchased | Mar 10 | All supplies ready |

**Step 4 — Resources & Requirements:**
- Resources needed (tag input: Room, Projector, Kitchen, etc.)
- Number of volunteers needed
- Skills required (tag input)
- Space/room required

**Step 5 — Impact & Justification:**
- Target audience (who benefits?)
- Community need (why is this important?)
- Expected impact
- Success metrics (how will you measure success?)

**Step 6 — Contact & Attachments:**
- Submitter name, email, phone
- File attachments (PDFs, images — supporting documents)
- Review & Submit

#### 7.4.3 Dashboard: `/dashboard/proposals` (Admin Only)

**Kanban Board View:**
```
Pending → Under Review → Needs Revision → Approved → In Progress → Completed
                                                                   ↓
                                              Declined / On Hold
```

**Each Proposal Card Shows:**
- Title + category badge
- Submitter name
- Total budget
- Priority indicator (low/normal/high/urgent)
- Timeline summary (e.g., "Mar–May 2026")
- Status badge

**Proposal Detail View (Admin):**
- Full read-only view of the submitted proposal
- All budget items, timeline phases, milestones
- Admin actions:
  - ✅ Approve → moves to "Approved"
  - ✏️ Request Revision → send back with notes
  - ❌ Decline → with reason
  - ⏸️ Put on Hold
  - 📌 Set Priority (low/normal/high/urgent)
- **Comment thread:** Admin can leave internal notes or public feedback
- **Progress tracking (after approval):**
  - Update current phase
  - Track actual spending vs budget
  - Update completion percentage
  - Mark milestones as done
  - Mark entire project as completed
- **Attachments viewer** — preview PDFs and images inline

#### 7.4.4 Public Proposal Tracker: `/proposals`

A public page (no auth) where community members can see:
- Approved and in-progress proposals (transparency)
- Each card shows: title, category, progress bar, timeline
- Click for detail: full description, budget summary (without admin notes), milestones with status
- Filter by: category, status (approved / in-progress / completed)

#### 7.4.5 Email Notifications

| Trigger                                | Who Gets Notified       |
| -------------------------------------- | ----------------------- |
| New proposal submitted                 | Admin                   |
| Proposal approved                      | Submitter               |
| Proposal declined (with reason)        | Submitter               |
| Revision requested (with notes)        | Submitter               |
| Milestone completed                    | Admin + Submitter       |
| Project completed                      | Admin + Submitter       |

### 7.5 Digital Signage / Kiosk TV Mode (New Module)

A dedicated, **unauthenticated** route designed to be displayed on TV screens in the masjid lobby.

#### 7.5.1 Route: `/kiosk/tv`

No login required. The URL is bookmarked on a TV browser or Raspberry Pi in the masjid lobby.

#### 7.5.2 UI Design

A **stunning, dark-themed, full-screen display** optimized for 1080p/4K TVs:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   ┌─────────────────────────────────┐  ┌────────────────────────────┐   │
│   │   🕌 MASJID AL-MOMINEEN        │  │     NEXT PRAYER            │   │
│   │                                 │  │                            │   │
│   │   Today: Monday, Feb 24, 2026   │  │    ☀️ DHUHR               │   │
│   │                                 │  │                            │   │
│   │  ┌──────┬──────┬──────┬──────┐  │  │   ⏰ 12:45 PM             │   │
│   │  │ Fajr │Dhuhr │ Asr  │Magh. │  │  │                            │   │
│   │  │06:10 │12:45 │15:35 │18:00 │  │  │   Countdown:              │   │
│   │  ├──────┼──────┼──────┼──────┤  │  │   ██████████░░  02:14:33  │   │
│   │  │ Isha │Jumm1 │Jumm2 │Rise  │  │  │                            │   │
│   │  │19:20 │13:00 │14:00 │07:17 │  │  │                            │   │
│   │  └──────┴──────┴──────┴──────┘  │  │   🤲 "Establish prayer..." │   │
│   └─────────────────────────────────┘  └────────────────────────────┘   │
│                                                                        │
│   ┌─────────────────────────────────┐  ┌────────────────────────────┐   │
│   │  📢 ANNOUNCEMENTS (scrolling)   │  │   💰 DONATE                │   │
│   │                                 │  │                            │   │
│   │  > Ramadan preparation guide    │  │   ┌────────┐  Scan to     │   │
│   │    now available...             │  │   │ QR CODE│  donate      │   │
│   │                                 │  │   │        │  via Stripe  │   │
│   │  > Youth registration open...   │  │   └────────┘              │   │
│   │                                 │  │                            │   │
│   │  > Construction update: 54%...  │  │   almomineen.org/donate    │   │
│   └─────────────────────────────────┘  └────────────────────────────┘   │
│                                                                        │
│   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │
│   Masjid Al-Momineen • 1234 Peachtree Rd, Atlanta, GA • (404) 555-0000 │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 7.5.3 Panels & Data Sources

| Panel                  | Data Source                              | Refresh Interval |
| ---------------------- | ---------------------------------------- | ---------------- |
| **Today's Prayer Times** | `PrayerTime` (today's date)            | Every 60s        |
| **Next Prayer Countdown**| Calculated from prayer times           | Every 1s (live)  |
| **Announcements**        | `KioskAnnouncement` (active, not expired) + latest `BlogPost` (published) | Every 5 min |
| **Donation QR Code**     | Generated from `donationPortalUrl` in SiteSettings | Static (config change) |
| **Hijri Date**           | Calculated or from API                 | Daily            |
| **Construction Progress**| `ConstructionProject` summary          | Every 15 min     |
| **Emergency Alert**      | `SiteSetting.emergencyAlertEnabled`    | Every 60s        |

#### 7.5.4 Key Features

- **Auto-refresh:** Page auto-refreshes data via polling or Server-Sent Events (SSE). No manual interaction needed.
- **Full-screen mode:** Hides browser chrome. Uses `requestFullscreen()` API with a keyboard shortcut (F11 / double-click).
- **Responsive scaling:** Works on any screen size (small TV to 4K). Uses `vw/vh` units and CSS `clamp()` for typography.
- **Dark theme:** High contrast, easy on the eyes in a masjid lobby. Deep emerald/charcoal tones matching the brand.
- **Smooth animations:** Prayer countdown has a subtle pulse animation. Announcements auto-scroll with fade-in/out.
- **Emergency override:** If `emergencyAlertEnabled` is true, the entire screen turns red with the emergency alert message.
- **Quran verse rotation:** Rotating inspirational Quran verses / hadith displayed between panels.
- **QR Code for Donations:** Auto-generated from the donation portal URL in settings. Scannable by phone.
- **No mouse cursor:** CSS `cursor: none` for a clean TV display.
- **Wake lock:** Uses Screen Wake Lock API to prevent the TV from sleeping.

#### 7.5.5 Dashboard: Kiosk Settings (within Site Settings)

Admin can configure the kiosk display from `/dashboard/settings`:

- **Toggle panels on/off:** Prayer times, countdown, announcements, donation QR, construction
- **Announcement management:** CRUD for `KioskAnnouncement` (title, message, type, priority, start/expiry dates)
- **QR code URL:** Which URL the donation QR code points to
- **Scroll speed:** How fast announcements scroll
- **Theme:** Choose between dark/light kiosk theme
- **Custom message:** Add a static footer message
- **Preview button:** Opens `/kiosk/tv` in a new tab for admin to preview live

#### 7.5.6 Technical Implementation

```
/kiosk/tv → Server Component (initial render)
  ├── PrayerTimesPanel     → polls /api/public/prayers every 60s
  ├── CountdownPanel       → client-side interval (1s tick)
  ├── AnnouncementsPanel   → polls /api/public/announcements every 5min
  ├── DonationQRPanel      → static QR from settings
  ├── ConstructionPanel    → polls /api/public/construction every 15min
  └── EmergencyOverlay     → polls /api/public/settings every 60s
```

- Uses `next/dynamic` with `ssr: false` for the QR code component
- QR Code generated with `qrcode` npm package
- CSS Grid layout for the 4-panel design
- `@media (orientation: landscape)` for TV optimization
- Framer Motion for smooth panel transitions

---

## 8. API Routes

### 8.1 RESTful API Structure

```
/api
├── /auth
│   ├── [...nextauth]          # NextAuth.js handler
│   └── /register              # POST — Admin creates new staff user
│
├── /prayers
│   ├── GET                    # List prayer times (paginated, date range)
│   ├── POST                   # Create/upsert prayer time entry
│   ├── /[id] PUT              # Update a prayer time entry
│   ├── /[id] DELETE           # Delete a prayer time entry
│   └── /import POST           # Bulk CSV import
│
├── /blog
│   ├── GET                    # List posts (filtered by status, tags)
│   ├── POST                   # Create post
│   ├── /[id] GET              # Get single post
│   ├── /[id] PUT              # Update post
│   ├── /[id] DELETE           # Delete post
│   └── /upload POST           # Upload cover image
│
├── /classroom
│   ├── /classes GET/POST      # List/Create classes
│   ├── /classes/[id] PUT/DELETE
│   ├── /students GET/POST     # List/Create students
│   ├── /students/[id] PUT/DELETE
│   └── /attendance POST       # Record attendance
│
├── /assignments
│   ├── GET                    # List (filtered by student, teacher, date)
│   ├── POST                   # Create assignment
│   ├── /[id] PUT              # Update (status, rating)
│   └── /[id] DELETE           # Delete
│
├── /gamification
│   ├── /leaderboard GET       # Sorted student points
│   ├── /points POST           # Award points
│   └── /levels GET            # Level definitions
│
├── /construction
│   ├── GET/POST               # List/Create projects
│   ├── /[id] PUT/DELETE       # Update/Delete project
│   └── /reorder PUT           # Update display order
│
├── /volunteers
│   ├── /opportunities GET/POST
│   ├── /opportunities/[id] PUT/DELETE
│   ├── /applications GET/POST
│   └── /applications/[id] PUT # Approve/reject
│
├── /proposals
│   ├── GET                    # List proposals (admin: all, public: approved+in-progress)
│   ├── POST                   # Submit a new proposal (public)
│   ├── /[id] GET              # Get full proposal details
│   ├── /[id] PUT              # Update proposal (admin: status/notes, submitter: revision)
│   ├── /[id] DELETE           # Delete proposal (admin)
│   ├── /[id]/comments GET/POST # List/Add comments on a proposal
│   ├── /[id]/milestones PUT   # Update milestone statuses
│   ├── /[id]/progress PUT     # Update completion %, actual spend
│   └── /categories GET        # List proposal categories
│
├── /finances
│   ├── /summary GET           # Financial overview
│   ├── /records GET/POST      # Monthly records
│   └── /records/[id] PUT      # Update record
│
├── /donations
│   ├── GET                    # List donations (admin)
│   ├── /stats GET             # Donation statistics
│   └── /export GET            # CSV export
│
├── /stripe
│   ├── /create-checkout-session POST   # Create Stripe session
│   ├── /webhook POST                   # Stripe webhook handler
│   └── /portal POST                    # Customer portal session
│
├── /jobs
│   ├── GET                    # List job postings (admin: all, public: active only)
│   ├── POST                   # Submit a new job posting (public)
│   ├── /[id] GET              # Job details
│   ├── /[id] PUT              # Update job (admin: approve/reject/close)
│   ├── /[id] DELETE           # Delete job posting (admin)
│   ├── /[id]/applications GET # List applications for a job
│   └── /categories GET        # List job categories
│
├── /job-applications
│   ├── GET                    # List all applications (admin)
│   ├── POST                   # Apply to a job (public)
│   ├── /[id] GET              # View application details
│   └── /[id] PUT              # Update status (admin: reviewed/shortlisted/hired/declined)
│
├── /workers
│   ├── GET                    # List worker profiles (admin: all, public: approved only)
│   ├── POST                   # Create worker profile (public)
│   ├── /[id] GET              # View full profile
│   ├── /[id] PUT              # Update profile (owner or admin)
│   └── /[id] DELETE           # Delete profile (admin)
│
├── /users
│   ├── GET                    # List staff users
│   ├── POST                   # Create user (admin only)
│   ├── /[id] GET/PUT/DELETE   # User CRUD
│   └── /[id]/reset-password PUT
│
├── /settings
│   ├── GET                    # Get all settings
│   └── PUT                    # Update settings
│
├── /audit-logs
│   └── GET                    # Paginated audit log (admin only)
│
└── /public                    # Unauthenticated endpoints (for mobile app)
    ├── /prayers GET           # Current prayer times
    ├── /blog GET              # Published posts
    ├── /construction GET      # Public construction progress
    ├── /volunteers GET        # Open volunteer opportunities
    ├── /jobs GET              # Active job listings
    ├── /workers GET           # Approved worker profiles
    ├── /proposals GET         # Approved & in-progress proposals
    ├── /announcements GET     # Active kiosk announcements
    └── /kiosk-config GET      # Kiosk display configuration
```

### 8.2 API Middleware Chain

Every API request goes through:

```
Request → Rate Limiter → JWT Verification → Role Check → Input Validation → Handler → Audit Log → Response
```

---

## 9. Frontend Structure

### 9.1 File Structure

```
app/
├── (public)/                    # Public routes (no auth)
│   ├── donate/
│   │   ├── page.tsx            # Public donation page
│   │   └── thank-you/page.tsx  # Post-donation thank you
│   ├── jobs/
│   │   ├── page.tsx            # 🆕 Public job board (browse listings)
│   │   ├── [id]/page.tsx       # 🆕 Job detail + apply form
│   │   └── post/page.tsx       # 🆕 Submit a job posting (employer)
│   ├── workers/
│   │   ├── page.tsx            # 🆕 Worker directory (browse profiles)
│   │   ├── [id]/page.tsx       # 🆕 Worker profile detail
│   │   └── register/page.tsx   # 🆕 Create worker profile
│   ├── proposals/
│   │   ├── page.tsx            # 🆕 Public proposal tracker (approved/in-progress)
│   │   ├── [id]/page.tsx       # 🆕 Public proposal detail
│   │   └── submit/page.tsx     # 🆕 Multi-step proposal submission wizard
│   └── page.tsx                # Login page
│
├── kiosk/                       # 🆕 Digital Signage (no auth, no layout chrome)
│   └── tv/page.tsx              # Full-screen TV display
│
├── dashboard/                   # Protected routes (auth required)
│   ├── layout.tsx              # Sidebar + header + RBAC
│   ├── page.tsx                # Dashboard home
│   ├── prayers/page.tsx
│   ├── blog/
│   │   ├── page.tsx            # Blog list
│   │   └── [id]/edit/page.tsx  # Blog editor
│   ├── classroom/page.tsx
│   ├── assignments/page.tsx
│   ├── gamification/page.tsx
│   ├── construction/page.tsx
│   ├── volunteers/page.tsx
│   ├── proposals/page.tsx
│   ├── finances/page.tsx
│   ├── donations/page.tsx      # 🆕 Stripe donations dashboard
│   ├── jobs/page.tsx           # 🆕 Jobs board management (admin)
│   ├── users/page.tsx
│   ├── settings/page.tsx
│   └── audit-logs/page.tsx     # 🆕 Audit log viewer
│
├── api/                         # API route handlers
│   ├── auth/[...nextauth]/route.ts
│   ├── stripe/
│   │   ├── create-checkout-session/route.ts
│   │   └── webhook/route.ts
│   └── ... (all other routes)
│
├── layout.tsx                   # Root layout
└── globals.css                  # Global styles

components/
├── app-sidebar.tsx              # Sidebar navigation (role-aware)
├── dashboard-breadcrumb.tsx
├── route-guard.tsx
├── theme-provider.tsx
├── donation-form.tsx            # 🆕 Public donation form
├── stripe-elements.tsx          # 🆕 Stripe Elements wrapper
├── proposal-wizard.tsx          # 🆕 Multi-step proposal form
├── kiosk/                       # 🆕 Kiosk TV components
│   ├── prayer-panel.tsx
│   ├── countdown-panel.tsx
│   ├── announcements-panel.tsx
│   ├── donation-qr-panel.tsx
│   └── emergency-overlay.tsx
└── ui/                          # shadcn/ui components (50+ already exist)

lib/
├── prisma.ts                    # Prisma client singleton
├── auth.ts                      # NextAuth configuration
├── auth-context.tsx             # Client-side auth context
├── role-config.ts               # RBAC config (updated: 2 roles)
├── stripe.ts                    # Stripe client initialization
├── types.ts                     # TypeScript types
├── utils.ts                     # Utility functions
├── sanitize.ts                  # Input sanitization
├── rate-limit.ts                # Rate limiting
├── audit-log.ts                 # Audit logging
└── password-validation.ts       # Password strength checking
```

### 9.2 Sidebar Navigation (Updated for 2 Roles)

**Admin sees:**
```
📊 Dashboard
── Content ──
🕐 Prayer Times
📝 Blog / News
── School ──
🎓 Classroom Tracker
📋 Assignments
🏆 Gamification
── Operations ──
🏗️ Construction
🤝 Volunteers
💡 Project Proposals    ← ENHANCED (budget, timeline, milestones)
── Finance ──
💲 Finances
💰 Donations           ← NEW
── Community ──
💼 Jobs Board           ← NEW
── Display ──
📺 Kiosk / TV Settings  ← NEW
── Administration ──
👤 User Management
📋 Audit Logs           ← NEW
⚙️ Site Settings
```

**Teacher sees:**
```
📊 Dashboard
── School ──
🎓 Classroom Tracker
📋 Assignments
🏆 Gamification
```

---

## 10. Phase-by-Phase Build Order

### Phase 1: Foundation (Days 1–3)
> Set up the project skeleton, database, and auth

- [ ] Initialize Next.js project from v0 prototype (copy UI components, styles, tailwind config)
- [ ] Install new dependencies: `prisma`, `@prisma/client`, `next-auth`, `bcrypt`, `stripe`
- [ ] Set up Prisma with MongoDB Atlas (schema, `prisma generate`, `prisma db push`)
- [ ] Seed database with initial data (migrate from mock-data.ts → seed script)
- [ ] Configure NextAuth.js v5 with Credentials Provider + bcrypt
- [ ] Update `middleware.ts` for JWT verification + RBAC
- [ ] Remove `imam` role from `role-config.ts`, `auth-context.tsx`, `types.ts`
- [ ] Update sidebar to show 2 roles only (admin, teacher)
- [ ] Set up environment variables (.env)

### Phase 2: Core Dashboard (Days 4–7)
> Connect dashboard home and primary modules to real database

- [ ] Dashboard Home — replace mock stats with Prisma aggregate queries
- [ ] Prayer Times — full CRUD API + connect existing UI to API
- [ ] Blog / News — CRUD API, add rich text editor (Tiptap), image upload
- [ ] User Management — CRUD with bcrypt password hashing
- [ ] Site Settings — key-value CRUD in MongoDB
- [ ] Audit Logs page — paginated log viewer (admin only)

### Phase 3: School Modules (Days 8–10)
> Teacher-facing features: Classroom, Assignments, Gamification

- [ ] Classes CRUD API + UI
- [ ] Students CRUD API + UI (attendance tracking)
- [ ] Assignments CRUD API + connect existing UI
- [ ] Gamification — points engine, real leaderboard, level system
- [ ] Teacher-specific dashboard view (filtered stats)

### Phase 4: Operations & Community Modules (Days 11–16)
> Construction, Volunteers, Enhanced Proposals, Jobs Board, Kiosk TV

- [ ] Construction Projects — CRUD + drag-to-reorder + progress sliders
- [ ] Volunteers — opportunity management + application Kanban board
- [ ] **Enhanced Proposals — Public multi-step submission wizard** (`/proposals/submit`)
- [ ] **Enhanced Proposals — Budget breakdown builder** (line items table)
- [ ] **Enhanced Proposals — Timeline & milestones editor** (phases, deliverables)
- [ ] **Enhanced Proposals — Admin Kanban** (8 statuses, priority, comments thread)
- [ ] **Enhanced Proposals — Progress tracking** (post-approval: actual spend, completion %, milestone updates)
- [ ] **Enhanced Proposals — Public tracker** (`/proposals` — transparency page)
- [ ] Email notifications for volunteer approvals (optional, via Resend)
- [ ] Email notifications for proposals (submit, approve, decline, revision request)
- [ ] **Jobs Board — Admin dashboard** (3-tab view: Job Postings, Worker Profiles, Applications)
- [ ] **Jobs Board — Public pages** (`/jobs`, `/jobs/post`, `/jobs/[id]`)
- [ ] **Worker Directory — Public pages** (`/workers`, `/workers/register`, `/workers/[id]`)
- [ ] **Jobs Board — Admin moderation** (approve/reject jobs & worker profiles)
- [ ] **Jobs Board — Application flow** (apply to job, status tracking)
- [ ] **Jobs Board — Email notifications** (new submission → admin, approval → poster/worker)
- [ ] **Kiosk TV Mode — `/kiosk/tv`** full-screen layout (4 panels + emergency)
- [ ] **Kiosk TV — Prayer countdown** (live 1s tick, next iqamah highlight)
- [ ] **Kiosk TV — QR code donation panel** (auto-generated from settings URL)
- [ ] **Kiosk TV — Scrolling announcements** (from KioskAnnouncement + BlogPost)
- [ ] **Kiosk TV — Admin announcement CRUD** (within Site Settings)
- [ ] **Kiosk TV — Emergency override** (full-screen red alert)
- [ ] **Kiosk TV — Auto-refresh + wake lock** (SSE or polling, Screen Wake Lock API)

### Phase 5: Stripe Donations (Days 17–20)
> Full Stripe integration for donations

- [ ] Install and configure Stripe SDK (`stripe`, `@stripe/stripe-js`)
- [ ] Create Stripe products/prices for common amounts
- [ ] Build `/api/stripe/create-checkout-session` route
- [ ] Build `/api/stripe/webhook` route with signature verification
- [ ] Build public `/donate` page (campaign selection, amount, one-time/recurring)
- [ ] Build `/donate/thank-you` page
- [ ] Build `/dashboard/donations` page (admin — summary, table, charts)
- [ ] Test webhook locally with Stripe CLI (`stripe listen --forward-to`)
- [ ] Connect donation data to Finances module
- [ ] Build donation CSV export

### Phase 6: Finances Integration (Days 21–22)
> Connect real financial data + Stripe donations

- [ ] Finances page — real monthly records CRUD
- [ ] Integrate Stripe donation totals into financial summary
- [ ] Monthly donations vs expenses chart (Recharts) with real data
- [ ] Fundraising goal tracker (from FinancialSummary model)

### Phase 7: Polish & Security Hardening (Days 23–26)
> Production readiness

- [ ] End-to-end testing of all CRUD operations
- [ ] Rate limiting upgrade (Upstash Redis for production)
- [ ] Secure headers (CSP, HSTS, X-Frame-Options)
- [ ] Error boundaries and loading states for all pages
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (ARIA labels, keyboard navigation)
- [ ] Performance optimization (React Server Components where possible)
- [ ] Kiosk TV stress test (72hr continuous display test)
- [ ] Lighthouse audit (aim for 90+ all categories)

### Phase 8: Deployment (Days 27–30)
> Ship to production

- [ ] Set up Vercel project (or Docker + Cloud Run)
- [ ] Configure environment variables in deployment platform
- [ ] Set up MongoDB Atlas production cluster
- [ ] Configure Stripe production keys + webhook endpoint
- [ ] Set up custom domain + SSL
- [ ] DNS configuration
- [ ] Set up kiosk TV (Raspberry Pi or Smart TV browser → `/kiosk/tv`)
- [ ] Monitoring & alerting (Vercel Analytics, Sentry)
- [ ] Final smoke test on production

---

## 11. Environment Variables

```env
# ═══════════════════════════════════════════════════════
#  ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════

# ── Database ──
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"

# ── NextAuth ──
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ── Stripe ──
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_SUCCESS_URL="http://localhost:3000/donate/thank-you"
STRIPE_CANCEL_URL="http://localhost:3000/donate"

# ── Admin Seed Password (for initial setup only) ──
ADMIN_SEED_EMAIL="admin@almomineen.org"
ADMIN_SEED_PASSWORD="your_strong_password_here"

# ── File Upload (optional) ──
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# ── Email (optional) ──
RESEND_API_KEY="re_..."

# ── App Config ──
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 12. Deployment Strategy

### Option A: Vercel (Recommended)

| Component     | Service          |
| ------------- | ---------------- |
| Frontend + API| Vercel           |
| Database      | MongoDB Atlas    |
| Payments      | Stripe           |
| File Storage  | Cloudinary       |
| Email         | Resend           |
| Monitoring    | Vercel Analytics  |

### Option B: Docker + Cloud Run

| Component     | Service                   |
| ------------- | ------------------------- |
| Frontend + API| Cloud Run (Docker)        |
| Database      | MongoDB Atlas             |
| Payments      | Stripe                    |
| File Storage  | Google Cloud Storage      |
| Email         | SendGrid                  |
| Monitoring    | Cloud Logging + Cloud Trace|

### Production Checklist

- [ ] MongoDB Atlas: M10+ cluster with backup enabled
- [ ] Stripe: Switch from test to live keys
- [ ] Stripe: Register production webhook URL
- [ ] Custom domain with SSL/TLS
- [ ] Environment variables set in deployment platform
- [ ] Rate limiting with Redis (Upstash)
- [ ] Error tracking (Sentry)
- [ ] Backup strategy (MongoDB automated backups)
- [ ] CI/CD pipeline (GitHub Actions → Vercel auto-deploy)

---

## 13. Testing Plan

### 13.1 Unit Tests

| Area                 | Framework | Coverage Target |
| -------------------- | --------- | --------------- |
| API route handlers   | Vitest    | 80%+            |
| Utility functions    | Vitest    | 90%+            |
| Prisma queries       | Vitest + mocks | 70%+       |
| Auth logic           | Vitest    | 90%+            |

### 13.2 Integration Tests

| Area                       | Notes                                       |
| -------------------------- | ------------------------------------------- |
| Auth flow (login → dashboard) | Full flow with bcrypt + JWT                |
| Stripe checkout → webhook  | Use Stripe test mode + webhook simulation   |
| CRUD for each module       | Create, read, update, delete with real DB   |
| RBAC enforcement           | Verify teacher can't access admin routes    |

### 13.3 E2E Tests

| Tool        | Tests                                                     |
| ----------- | --------------------------------------------------------- |
| Playwright  | Login flow, dashboard navigation, donation flow, jobs board, proposal submission, kiosk display |
| Stripe CLI  | Webhook testing locally (`stripe trigger checkout.session.completed`) |

### 13.4 Security Tests

- [ ] Rate limiting enforcement (brute force protection)
- [ ] RBAC bypass attempts (direct URL access)
- [ ] SQL/NoSQL injection attempts
- [ ] XSS via blog post/proposal content
- [ ] Stripe webhook signature verification
- [ ] Session expiry enforcement

---

## Summary

This plan transforms the **v0 static prototype** into a **production-grade full-stack application** with:

- ✅ **2 roles** (Admin = full access + former Imam privileges, Teacher = school only)
- ✅ **Real database** (MongoDB + Prisma ORM)
- ✅ **Proper auth** (NextAuth.js + bcrypt + JWT)
- ✅ **Stripe donations** (one-time + recurring, webhook-driven)
- ✅ **15 dashboard modules** (all connected to real APIs)
- ✅ **5 new/enhanced modules** (Donations, Jobs Board, Enhanced Proposals, Kiosk TV, Audit Logs)
- ✅ **Community Jobs Board** (employers post jobs, workers publish profiles, public-facing)
- ✅ **Enhanced Proposals** (public submission wizard with budget, timeline, milestones, progress tracking)
- ✅ **Digital Signage / Kiosk TV** (prayer countdown, QR donations, scrolling announcements for lobby TVs)
- ✅ **Public pages** (donate, job board, worker directory, proposal tracker, kiosk TV — no auth required)
- ✅ **Security hardened** (rate limiting, RBAC, audit logs, input sanitization)
- ✅ **Production-ready** deployment strategy

**Estimated total build time: 28–30 days** (single developer, focused work)

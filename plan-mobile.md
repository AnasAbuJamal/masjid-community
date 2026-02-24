# 🕌 Masjid Al-Momineen — Mobile App (User/Member)

## User-Facing Mobile Application Plan

> **Source of truth:** This mobile app is the **public-facing companion** to the Admin Staff Portal (`plan.md`).
> 
> **Platform:** React Native with Expo Go
> 
> **Goal:** Provide community members (members, parents, students) with access to prayer times, donations, announcements, school tracking, and community features.

---

## 1. User Types

| User Type    | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| **Member**   | General community member - access to prayers, donations, announcements, proposals, jobs |
| **Parent**   | Parent of student - all Member features + child attendance/assignments |
| **Student**  | Islamic school student - view assignments, points, progress (simplified view) |

---

## 2. Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| **Framework**   | React Native with Expo SDK 52+               |
| **Language**    | TypeScript 5.7+                              |
| **Navigation**  | Expo Router (file-based routing)              |
| **UI Library**  | React Native Paper (Material Design 3)        |
| **HTTP Client** | Axios or Fetch with TanStack Query            |
| **State**       | Zustand (lightweight store)                   |
| **Auth**        | Supabase Auth / Expo Auth Sessions            |
| **Push Notifs** | Expo Notifications                            |
| **Storage**     | AsyncStorage (secure token storage)          |
| **Forms**       | React Hook Form + Zod                        |
| **Icons**      | @expo/vector-icons (MaterialCommunityIcons)  |

---

## 3. App Structure

```
masjid-mobile/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/            # Auth screens (logged out)
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Tab navigation (logged in)
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Home / Dashboard
│   │   ├── prayers.tsx    # Prayer times
│   │   ├── school.tsx     # School (Parent/Student)
│   │   ├── community.tsx  # Proposals, Volunteers
│   │   └── profile.tsx    # User profile & settings
│   ├── donate.tsx         # Donation screen (modal)
│   ├── announcements/[id].tsx
│   ├── jobs/
│   │   ├── index.tsx      # Job listings
│   │   └── [id].tsx      # Job details
│   ├── workers/
│   │   ├── index.tsx      # Worker directory
│   │   └── [id].tsx      # Worker profile
│   ├── proposals/
│   │   ├── index.tsx      # Public proposals
│   │   └── [id].tsx      # Proposal details
│   └── _layout.tsx       # Root layout with providers
├── components/            # Reusable UI components
│   ├── common/           # Button, Card, Input, etc.
│   ├── prayers/          # PrayerTimeCard, CountdownTimer
│   ├── school/           # AssignmentCard, StudentCard
│   └── community/        # ProposalCard, VolunteerCard
├── services/             # API services
│   ├── api.ts            # Axios instance
│   ├── auth.ts           # Auth endpoints
│   ├── prayers.ts        # Prayer times
│   ├── donations.ts      # Stripe integration
│   └── ...
├── stores/               # Zustand stores
│   ├── authStore.ts      # User session
│   └── settingsStore.ts  # App settings
├── utils/                # Helpers
├── constants/           # Theme, config
└── types/                # TypeScript types
```

---

## 4. Screens & Features

### 4.1 Authentication (Unauthenticated)

| Screen              | Features                                              |
| ------------------- | ----------------------------------------------------- |
| **Login**           | Email + password, forgot password link, biometric (optional) |
| **Register**        | Email, password, name, user type selection (member/parent) |
| **Forgot Password** | Email input, reset link via email                   |

> **Note:** Students don't self-register - they're added by Admin/Teachers in the school module.

---

### 4.2 Home / Dashboard (Authenticated)

```
┌─────────────────────────────────────────┐
│  🕌 Masjid Al-Momineen          🔔 3   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  Dhuhr  │  │  Asr    │  │ Maghrib │ │
│  │  12:45  │  │  3:35   │  │  6:00   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  NEXT PRAYER: Dhuhr in 2h 14m          │
│                                         │
│  📢 Latest Announcements               │
│  ─────────────────────────────────     │
│  • Ramadan prep guide available...     │
│  • Youth registration now open...      │
│  • Construction update: 54% complete   │
│                                         │
│  Quick Actions                         │
│  [💰 Donate]  [📅 Events]  [👥 Jobs]   │
│                                         │
├─────────────────────────────────────────┤
│  🏠  🤲  📚  👥  👤                      │
│ Home Prayers School Community Profile  │
└─────────────────────────────────────────┘
```

**Features:**
- Today's prayer times (from API)
- Countdown to next prayer
- Latest announcements (scrollable)
- Quick action buttons (Donate, Events, Jobs)
- Push notification badge

---

### 4.3 Prayer Times Tab

| Screen              | Features                                              |
| ------------------- | ----------------------------------------------------- |
| **Today's Times**  | All 7 prayer times + jummah times                   |
| **Weekly View**    | 7-day prayer schedule                               |
| **Monthly Calendar**| Month view with times per day                       |
| **Qibla Direction**| Compass to Mecca (Expo sensors)                     |

**Features:**
- Current location-based or stored mosque location
- Notifications before each prayer (optional)
- Hijri date display
- Download weekly schedule as image

---

### 4.4 School Tab (Parent / Student)

#### Student ID & Reports Access

Parents can access their children's reports using a **Student ID** system:

| Feature | Description |
| --------| ------------|
| **Student ID Display** | Each child card shows their unique Student ID (e.g., `STU-2024-001`) |
| **ID Copy** | Tap to copy student ID to clipboard |
| **Share Report** | Share child's report via ID lookup (for grandparents, guardians) |
| **ID Lookup** | Enter a Student ID to view that student's report (limited view) |

```
┌─────────────────────────────────────────┐
│  My Children                           │
├─────────────────────────────────────────┤
│                                         │
│  👦 Ahmed Ali                    ID: 001│
│  ─────────────────────────────────     │
│  Class: Al-Quran Beginners A           │
│  Student ID: STU-2024-001    [📋 Copy] │
│  Attendance: 92%  •  Points: 1,250     │
│  Level: 🌟🌟🌟 (3)                      │
│  [View Assignments]  [View Report]     │
│                                         │
│  👧 Fatima Ali                   ID: 002│
│  ─────────────────────────────────     │
│  Class: Arabic 101                     │
│  Student ID: STU-2024-002    [📋 Copy] │
│  Attendance: 88%  •  Points: 980       │
│  Level: 🌟🌟 (2)                        │
│  [View Assignments]  [View Report]     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📊 View Another Student's Report │   │
│  │ Enter Student ID: [___________]  │   │
│  │                    [Lookup]      │   │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  🏠  🤲  📚  👥  👤                      │
└─────────────────────────────────────────┘
```

#### Student Report Detail

When parent taps "View Report" or uses ID lookup:

```
┌─────────────────────────────────────────┐
│  ← Student Report                 ⋮    │
├─────────────────────────────────────────┤
│                                         │
│  Ahmed Ali                               │
│  Student ID: STU-2024-001              │
│  Class: Al-Quran Beginners A           │
│                                         │
│  📊 Overall Performance                 │
│  ─────────────────────────────────      │
│  Status: ✅ Excellent                   │
│  Attendance: 92%                        │
│  Total Points: 1,250                   │
│  Current Level: 3 🌟                    │
│                                         │
│  📅 Attendance History                  │
│  ─────────────────────────────────      │
│  This Month: 8 Present / 2 Absent      │
│  Status: 🟢 Good                        │
│                                         │
│  📚 Recent Assignments                  │
│  ─────────────────────────────────      │
│  • Surah Al-Fatiha - ✅ Excellent       │
│  • Arabic Alphabet - ✅ Very Good       │
│  • Prayer Duas - ⚠️ Needs Improvement   │
│                                         │
│  📈 Progress Over Time                   │
│  ─────────────────────────────────      │
│  [Attendance Chart]                     │
│  [Points History]                       │
│                                         │
│  🏆 Achievements                         │
│  ─────────────────────────────────      │
│  🌟 Perfect Attendance (5 days)         │
│  🌟 Points Champion (Week 3)             │
│  🌟 Star Student (January)              │
│                                         │
└─────────────────────────────────────────┘
```

#### Attendance Status System

Each student has an **Attendance Status** based on their attendance rate:

| Status | Range | Color | Description |
| --------|-------|-------|-------------|
| **Excellent** | 95-100% | 🟢 Green | Outstanding attendance |
| **Very Good** | 85-94% | 🔵 Blue | Strong attendance |
| **Good** | 75-84% | 🟡 Yellow | Acceptable attendance |
| **Needs Improvement** | 60-74% | 🟠 Orange | Below average - parent contact |
| **Poor** | Below 60% | 🔴 Red | Critical - immediate action required |

| Screen              | Features                                              |
| ------------------- | ----------------------------------------------------- |
| **Children List**  | Cards showing child name, student ID, class, attendance status, points |
| **Student Reports** | Detailed report with attendance status, assignments, progress charts, achievements |
| **Assignments**    | List of assignments per child with due dates, status, ratings |
| **Attendance**     | Calendar showing present/absent days with monthly status |
| **Progress**       | Points history, level progression, achievements     |
| **Teacher Contact**| Email teacher (via mailto link)                     |
| **ID Lookup**      | Enter student ID to view limited report (shareable) |

#### Student View (Simplified):
- Only see their own data
- View assignments (to do / completed)
- View points and leaderboard ranking
- Gamification badges/achievements
- View own attendance status and report

---

### 4.5 Community Tab

| Screen              | Features                                              |
| ------------------- | ----------------------------------------------------- |
| **Volunteer Ops**  | List of open volunteer opportunities, apply button |
| **Proposals**      | Public proposal tracker (approved/in-progress)      |
| **Events**         | Community events calendar (future)                  |

**Volunteer Features:**
- Browse opportunities by date
- Apply to volunteer (form)
- View my applications

**Proposal Features:**
- View approved/in-progress community proposals
- Submit new proposal (wizard form → goes to Admin for review)
- Track status of my submissions

---

### 4.6 Profile Tab

| Screen              | Features                                              |
| ------------------- | ----------------------------------------------------- |
| **My Profile**     | Name, email, phone, avatar                          |
| **My Children**    | (Parents) Manage linked children                    |
| **Notifications**  | Toggle prayer alerts, announcement alerts            |
| **Donation History**| View my past donations (from Stripe)               |
| **My Applications**| My volunteer/job applications                       |
| **Settings**       | Language, theme, privacy                            |
| **Logout**         | Sign out                                            |

---

### 4.7 Donations (Modal/Screen)

```
┌─────────────────────────────────────────┐
│  💰 Support the Masjid            ✕    │
├─────────────────────────────────────────┤
│                                         │
│  Select Campaign                        │
│  [General Fund    ]                     │
│  [Construction   ]                     │
│  [Ramadan         ]                     │
│  [Education       ]                     │
│  [Zakat           ]                     │
│                                         │
│  Select Amount                          │
│  [$25] [$50] [$100] [$250] [Custom]    │
│                                         │
│  Frequency                             │
│  [One-time]  [Monthly]                 │
│                                         │
│  Name (optional)     ___________       │
│  Email (optional)    ___________        │
│  [ ] Anonymously                        │
│                                         │
│  ─────────────────────────────────     │
│  [    Donate with Stripe 💳     ]       │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. Select campaign from dropdown
2. Choose preset or custom amount
3. One-time or monthly toggle
4. Optional: name, email (pre-filled from account)
5. "Donate" button → opens Stripe Checkout (deep link or WebView)
6. Redirect to thank-you page on success

---

### 4.8 Public Pages (No Auth Required)

| Route              | Features                                              |
| ------------------- | ----------------------------------------------------- |
| `/jobs`            | Browse approved job listings                         |
| `/jobs/[id]`      | Job details + apply form                             |
| `/workers`        | Worker directory                                     |
| `/workers/[id]`   | Worker profile                                      |
| `/proposals`      | Public proposal tracker                              |
| `/proposals/[id]` | Proposal details                                    |

> These can be accessed without login - good for community engagement

---

## 5. API Integration

### 5.1 Public API (No Auth)

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/prayers/today`      | GET    | Today's prayer times          |
| `/api/prayers/week`       | GET    | This week's prayer times      |
| `/api/announcements`      | GET    | Active announcements           |
| `/api/blog/public`        | GET    | Published blog posts          |
| `/api/jobs`               | GET    | Active job postings            |
| `/api/jobs/[id]`          | GET    | Single job detail             |
| `/api/workers`            | GET    | Approved worker profiles      |
| `/api/workers/[id]`       | GET    | Single worker profile         |
| `/api/proposals/public`   | GET    | Approved/in-progress proposals|
| `/api/construction`       | GET    | Construction progress summary |

### 5.2 Authenticated API

| Endpoint                    | Method | Description                |
| ---------------------------- | ------ | -------------------------- |
| `/api/auth/login`           | POST   | User login                |
| `/api/auth/register`        | POST   | User registration         |
| `/api/auth/profile`         | GET/PUT| Get/update user profile  |
| `/api/school/students`      | GET    | Parent: get children     |
| `/api/school/students/[id]` | GET    | Get student by ID         |
| `/api/school/students/lookup`| POST  | Lookup student by ID     |
| `/api/school/assignments`   | GET    | Get assignments for child |
| `/api/school/attendance`    | GET    | Get attendance records    |
| `/api/school/attendance/status`| GET | Get attendance status    |
| `/api/school/reports/[studentId]`| GET | Get full student report |
| `/api/school/progress/[studentId]`| GET | Get progress/chart data  |
| `/api/donations/create`    | POST   | Create Stripe checkout   |
| `/api/donations/history`   | GET    | My donation history      |
| `/api/volunteers/apply`    | POST   | Apply to volunteer opp   |
| `/api/volunteers/my`       | GET    | My volunteer applications|
| `/api/proposals/submit`   | POST   | Submit new proposal     |
| `/api/proposals/my`       | GET    | My proposals            |

---

## 6. Authentication Flow

```
1. User opens app
2. Check AsyncStorage for stored token
3. If token exists → validate with /api/auth/me
4. If valid → navigate to (tabs) home
5. If invalid/expired → navigate to (auth) login

Login Flow:
1. User enters email + password
2. POST /api/auth/login
3. On success: store { token, user } in AsyncStorage
4. Navigate to (tabs) home
5. Fetch user profile to determine role (member/parent)

Register Flow:
1. User selects type (member/parent)
2. Fills registration form
3. POST /api/auth/register
4. On success: auto-login → home
```

---

## 7. Push Notifications

| Trigger                    | Notification Title                | Body                          |
| -------------------------- | ---------------------------------- | ------------------------------ |
| Prayer reminder (15min)    | 🕌 Prayer Time                     | Dhuhr starts in 15 minutes    |
| New announcement           | 📢 New Announcement               | [Announcement title]          |
| Assignment due             | 📚 Assignment Due                 | [Child name]: [Assignment]    |
| Proposal status update    | 📋 Proposal Update                | Your proposal status: [status]|
| Volunteer application      | ✅ Application Update             | Your application was [status]|

---

## 8. Offline Support

- **Prayer Times:** Cache last week's times, show offline
- **Profile:** Cache user data locally
- **Announcements:** Cache latest 10
- Use `@tanstack/react-query` with stale-time configuration

---

## 9. Build & Deployment

| Step                      | Command/Tool                           |
| ------------------------- | --------------------------------------- |
| **Development**          | `npx expo start` → Scan QR in Expo Go  |
| **Build iOS**            | `npx expo run:ios`                     |
| **Build Android**        | `npx expo run:android`                 |
| **EAS Build**           | `eas build` (for TestFlight/Play Store)|
| **OTA Updates**         | `expo publish` (JS updates without app store)|

---

## 10. Phase-by-Phase Build Order

### Phase 1: Core
- [ ] Setup Expo project
- [ ] Navigation structure (auth + tabs)
- [ ] Login/Register screens
- [ ] API client setup

### Phase 2: Prayer Times
- [ ] Prayer times API integration
- [ ] Home dashboard with today's times
- [ ] Prayer countdown timer

### Phase 3: Announcements & Blog
- [ ] Announcements list
- [ ] Blog posts (public)
- [ ] Push notification setup

### Phase 4: School (Parent/Student)
- [ ] Parent: View children
- [ ] Student ID display & copy functionality
- [ ] Student Report with attendance status
- [ ] Attendance status system (Excellent/Very Good/Good/Needs Improvement/Poor)
- [ ] Assignments list with ratings
- [ ] Attendance view with calendar
- [ ] Progress charts & achievements
- [ ] ID Lookup for sharing reports

### Phase 5: Community
- [ ] Volunteer opportunities + apply
- [ ] Proposals list + submit
- [ ] Jobs board (public)
- [ ] Workers directory (public)

### Phase 6: Donations
- [ ] Stripe checkout integration
- [ ] Donation history

### Phase 7: Polish
- [ ] Profile management
- [ ] Settings & preferences
- [ ] Offline caching
- [ ] App store submission

---

## 11. Environment Variables

```env
# Mobile (Expo)
EXPO_PUBLIC_API_URL=https://api.almomineen.org
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## 12. Dependencies (Key Packages)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native-paper": "^5.12.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "expo-notifications": "~0.29.0",
    "expo-location": "~18.0.0",
    "expo-sensors": "~15.0.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "@expo/vector-icons": "^14.0.0"
  }
}
```

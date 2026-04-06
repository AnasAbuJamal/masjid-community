# Staff Web - Missing Features Report

## Overview

This document outlines features and improvements that should be added to the Staff Web application for a complete mosque management system.

---

## 1. User Management & Authentication

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Password Reset Flow | High | Email-based password reset functionality |
| Password Change | Medium | Allow users to change their own password |
| User Profile Customization | Medium | Allow users to update their profile info (name, avatar) |
| Active Sessions Management | Medium | View and revoke active sessions |
| User Activity History | Low | Track individual user login history |
| Two-Factor Authentication (2FA) | High | Add TOTP-based 2FA for admin accounts |

### Recommended Implementation
- Add `passwordResetToken` and `passwordResetExpiry` fields to User model
- Create `/api/auth/reset-password` and `/api/auth/forgot-password` routes
- Use `next-auth` built-in or `@next-auth/panic` for 2FA

---

## 2. School Management

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Attendance Tracking | High | Daily/class attendance records for students |
| Class Scheduling | High | Day/time slots for each class |
| Parent Portal | Medium | Separate access for parents to view child progress |
| Grade Book | Medium | Numeric/letter grade tracking per student |
| Progress Reports | Medium | Generate PDF progress reports for parents |
| Behavior Tracking | Low | Notes/incidents per student |
| Student Documents | Low | Upload documents (registration forms, medical info) |

### Recommended Implementation
- Add `Attendance`, `ClassSchedule`, `Grade`, `BehaviorIncident` models
- Create new API routes: `/api/classroom/attendance`, `/api/classroom/grades`
- Add dashboard pages: Attendance calendar, Grade book view

---

## 3. Finance & Donations

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Expense Categories | High | Categorize expenses (utilities, maintenance, etc.) |
| Budget Planning | Medium | Set annual/quarterly budget goals |
| Financial Reports | High | Generate income statements, balance sheets |
| Donation Goal Tracking | Medium | Campaign progress toward fundraising goals |
| Tax Receipt Generation | Medium | Auto-generate PDF receipts for donations |
| Recurring Donations Management | Medium | Backend management of recurring Stripe subscriptions |
| Export to CSV/PDF | Medium | Export financial data |

### Recommended Implementation
- Add `ExpenseCategory`, `Budget`, `DonationGoal` models
- Create report generation utilities (use `react-pdf` or `jspdf`)
- Add Stripe subscription management in dashboard
- Create `/api/finances/reports` endpoint

---

## 4. Content Management

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Media Library | High | Centralized file management for uploads |
| Scheduled Publishing | Medium | Schedule blog posts for future dates |
| Content Drafts | Medium | Save unpublished drafts before going live |
| Categories/Tags | Medium | Organize blog posts by category |
| SEO Metadata | Low | Custom meta title, description, og:image per post |
| Content Versioning | Low | Track changes to blog posts over time |

### Recommended Implementation
- Add `MediaFile`, `Category`, `Tag` models
- Create `/api/media` endpoints for file management
- Add `publishedAt`, `scheduledFor` fields to BlogPost
- Implement `next-seo` package for SEO

---

## 5. Events & Calendar

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Events Calendar | High | Manage Islamic events, community gatherings |
| Event Registration | Medium | RSVP functionality for events |
| Recurring Events | Medium | Events that repeat weekly/monthly |
| Event Reminders | Low | Automated reminders for registered attendees |

### Recommended Implementation
- Add `Event` model with fields: title, description, date, location, capacity, isRecurring, recurrenceRule
- Add `EventRSVP` model for registrations
- Create `/api/events` CRUD routes
- Add calendar view to dashboard

---

## 6. Community & Membership

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Membership Management | High | Track mosque members with profiles |
| Member Directory | Medium | Searchable list of active members |
| Newsletter Subscription | Medium | Email subscription management |
| Contact Form | Medium | Public contact form submissions |
| Family/Household Grouping | Low | Link family members together |

### Recommended Implementation
- Add `Member`, `Household`, `ContactSubmission` models
- Create `/api/members`, `/api/contact` routes
- Add subscription checkbox to user registration

---

## 7. Administrative Features

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Database Backup | High | One-click backup download |
| System Logs | Medium | Application error logging beyond audit |
| Multi-Language Support (i18n) | Medium | Arabic/Urdu language options |
| Accessibility Features | Medium | WCAG compliance improvements |
| API Rate Limiting | Medium | Protect public endpoints from abuse |
| Maintenance Mode | Low | Toggle to disable public site |
| IP Whitelist/Blacklist | Low | Restrict access by IP |

### Recommended Implementation
- Add `backup` script to package.json
- Implement `next-i18next` for translations
- Use `upstash/ratelimit` for API rate limiting
- Add `isMaintenanceMode` to SiteSettings

---

## 8. Kiosk/TV Display

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Scheduled Content Rotation | Medium | Auto-rotate between announcements |
| Emergency Broadcast | High | Override all content for emergencies |
| Screen Layouts | Medium | Multiple display templates |
| Remote Management | Medium | Update kiosk from admin panel |

### Recommended Implementation
- Add `KioskLayout`, `KioskSchedule` models
- Create emergency broadcast endpoint `/api/kiosk/emergency`
- Add visual indicator for active emergency mode

---

## 9. Notifications & Communications

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| In-App Notifications | High | Real-time notification bell for staff |
| Push Notification Backend | Medium | Server-side push notification management |
| SMS Notifications | Low | Optional SMS for critical alerts |
| Notification Preferences | Medium | Granular control per notification type |

### Recommended Implementation
- Add `Notification` model for in-app notifications
- Use Server-Sent Events (SSE) or WebSockets for real-time
- Integrate Twilio for SMS
- Add notification preferences to User model

---

## 10. Mobile App Integration

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Deep Linking | Medium | Handle `masjid://` and `https://` app links |
| Offline Sync Conflict Resolution | Medium | Handle data conflicts when coming online |
| Background Sync | Medium | Sync data when app is backgrounded |
| App Analytics | Low | Track mobile app usage |

### Recommended Implementation
- Configure Expo deep links in `app.json`
- Implement last-write-wins or manual merge for sync
- Use `expo-task-manager` for background sync
- Integrate Amplitude or Mixpanel

---

## 11. Search & Discovery

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Global Search | High | Search across all content types |
| Advanced Filters | Medium | Filter lists by date, category, status |
| Search Analytics | Low | Track popular search terms |

### Recommended Implementation
- Implement MongoDB text search or Algolia
- Add search bar component with autocomplete
- Create `/api/search` endpoint

---

## 12. Security Enhancements

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Data Retention Policy | Medium | Auto-delete old audit logs |
| Audit Log Search/Filter | High | Searchable audit trail |
| Login Attempt Limiting | High | Prevent brute force attacks |
| CSRF Protection | Medium | Additional CSRF tokens |
| Security Headers | Medium | HSTS, CSP, X-Frame-Options |

### Recommended Implementation
- Add `lastLoginAttempt` and `failedLoginAttempts` to User
- Implement `next-secure-headers` middleware
- Add TTL to AuditLog model with cleanup job

---

## 13. Reporting & Analytics

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| Dashboard Charts | Medium | More detailed analytics charts |
| Donation Analytics | High | Donation trends, donor retention |
| School Analytics | Medium | Enrollment trends, completion rates |
| Export Reports | Medium | PDF/CSV export of reports |

### Recommended Implementation
- Add `analytics` field to dashboard
- Create trend charts using Recharts
- Add export buttons with `jspdf` generation

---

## 14. Testing

### Missing
| Feature | Priority | Description |
|---------|----------|-------------|
| API Integration Tests | High | Test all CRUD endpoints |
| Component Tests | Medium | Test UI components |
| E2E Tests | Medium | Test critical user flows |
| Mock Stripe Webhooks | Low | Test payment flows locally |

### Recommended Implementation
- Add `supertest` for API testing
- Add Playwright for E2E tests
- Create Stripe CLI webhook forwarding script

---

## Priority Summary

### High Priority (Core Functionality)
- Password Reset Flow
- Attendance Tracking
- Financial Reports
- Database Backup
- Emergency Broadcast
- In-App Notifications
- Global Search
- Audit Log Search/Filter
- Login Attempt Limiting
- Two-Factor Authentication

### Medium Priority (Important)
- Parent Portal
- Tax Receipt Generation
- Events Calendar
- Member Directory
- Multi-Language Support
- API Rate Limiting
- Deep Linking
- Dashboard Charts
- API Integration Tests

### Low Priority (Nice to Have)
- Behavior Tracking
- SEO Metadata
- SMS Notifications
- App Analytics
- E2E Tests

---

## Implementation Roadmap

### Phase 1: Security & Core (1-2 weeks)
1. Password Reset Flow
2. Login Attempt Limiting
3. Audit Log Search/Filter
4. Two-Factor Authentication
5. Global Search

### Phase 2: Essential Features (2-3 weeks)
1. Attendance Tracking
2. Events Calendar
3. Financial Reports
4. In-App Notifications
5. Database Backup

### Phase 3: Enhanced Experience (2-3 weeks)
1. Parent Portal
2. Events Registration
3. Media Library
4. Scheduled Content
5. Dashboard Analytics

### Phase 4: Polish (1-2 weeks)
1. Multi-Language Support
2. Tax Receipt Generation
3. Accessibility Improvements
4. Testing Suite
5. Documentation

---

## Technical Notes

### Database Changes Required
Add approximately 8-10 new models:
- `Attendance`, `Grade`, `ClassSchedule`
- `Event`, `EventRSVP`
- `Member`, `Household`
- `Notification`
- `MediaFile`, `Category`
- `Backup` (for tracking backup history)

### API Routes to Add
- `/api/auth/forgot-password`, `/api/auth/reset-password`
- `/api/classroom/attendance/*`
- `/api/classroom/grades/*`
- `/api/finances/reports`
- `/api/events/*`
- `/api/members/*`
- `/api/search`
- `/api/notifications/*`
- `/api/backup`

### Environment Variables to Add
```env
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
ALGOLIA_APP_ID=""
ALGOLIA_API_KEY=""
```

---

*Report generated: March 2026*
*Total missing features identified: 50+*
*Estimated implementation time: 6-10 weeks*

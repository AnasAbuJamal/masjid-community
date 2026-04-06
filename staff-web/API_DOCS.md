# Al-Momineen Staff Web API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

### Public Endpoints (No Auth Required)

#### Login
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Request Password Reset
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newPassword123"
}
```

#### Public Prayer Times
```http
GET /public/prayers
```

#### Public Blog Posts
```http
GET /public/blog
```

#### Public Volunteer Opportunities
```http
GET /public/volunteers
POST /public/volunteers
Content-Type: application/json

{
  "userName": "John Doe",
  "userEmail": "john@email.com",
  "userPhone": "555-0123",
  "opportunityId": "opp-id",
  "skills": "Teaching, Carpentry"
}
```

#### Public Proposals
```http
GET /public/proposals
POST /public/proposals
Content-Type: application/json

{
  "title": "Community Garden",
  "summary": "A brief summary",
  "description": "Full description",
  "submitterName": "John Doe",
  "submitterEmail": "john@email.com",
  "category": "community_event",
  "totalBudget": 5000
}
```

#### Public Jobs
```http
GET /public/jobs
POST /public/jobs
Content-Type: application/json

{
  "title": "Accountant Needed",
  "company": "Local Business",
  "contactName": "Jane Smith",
  "contactEmail": "jane@business.com",
  "description": "Job description",
  "requirements": ["CPA", "5 years experience"],
  "location": "Downtown",
  "category": "Finance"
}
```

#### Public Workers
```http
GET /public/workers
POST /public/workers
Content-Type: application/json

{
  "fullName": "Ahmed Khan",
  "email": "ahmed@email.com",
  "phone": "555-0123",
  "headline": "Experienced Teacher",
  "bio": "Bio text",
  "skills": ["Teaching", "Counseling"],
  "location": "City Name"
}
```

#### Public Announcements
```http
GET /public/announcements
```

### Authenticated Endpoints

All authenticated endpoints require:
```http
Authorization: Bearer <session-token>
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

#### 2FA Setup
```http
GET /auth/2fa
Authorization: Bearer <token>
```

#### Enable 2FA
```http
POST /auth/2fa
Authorization: Bearer <token>
Content-Type: application/json

{
  "secret": "generated-secret",
  "token": "123456"
}
```

#### Disable 2FA
```http
DELETE /auth/2fa
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

## Users

#### List Users
```http
GET /users
GET /users?page=1&limit=20
```

#### Get User
```http
GET /users/{id}
```

#### Create User
```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher"
}
```

#### Update User
```http
PUT /users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "isActive": true
}
```

#### Delete User
```http
DELETE /users/{id}
Authorization: Bearer <token>
```

## Prayer Times

#### List Prayer Times
```http
GET /prayers
GET /prayers?month=1&year=2026
```

#### Get Prayer Time
```http
GET /prayers/{id}
```

#### Create Prayer Time
```http
POST /prayers
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-03-20",
  "fajr": "05:30",
  "sunrise": "06:45",
  "dhuhr": "12:30",
  "asr": "15:45",
  "maghrib": "18:30",
  "isha": "20:00"
}
```

#### Update Prayer Time
```http
PUT /prayers/{id}
```

#### Delete Prayer Time
```http
DELETE /prayers/{id}
```

## Blog

#### List Posts
```http
GET /blog
GET /blog?status=published&page=1
```

#### Create Post
```http
POST /blog
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Ramadan Schedule",
  "body": "Full article content...",
  "status": "draft",
  "tags": ["ramadan", "schedule"]
}
```

#### Update Post
```http
PUT /blog/{id}
```

#### Delete Post
```http
DELETE /blog/{id}
```

## Classroom

#### List Classes
```http
GET /classroom/classes
GET /classroom/classes?includeStudents=true
```

#### Create Class
```http
POST /classroom/classes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Quran Hifz Class",
  "teacherName": "Sheikh Ahmad",
  "schedule": "Mon/Wed/Fri 4pm"
}
```

#### List Students
```http
GET /classroom/students
GET /classroom/students?classId={id}
```

#### Create Student
```http
POST /classroom/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "STU001",
  "firstName": "Muhammad",
  "lastName": "Ali",
  "classId": "class-id",
  "parentName": "Fatima Ali",
  "parentEmail": "fatima@email.com"
}
```

## Attendance

#### Get Attendance
```http
GET /classroom/attendance
GET /classroom/attendance?classId={id}&date=2026-03-20
```

#### Mark Attendance
```http
POST /classroom/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "student-id",
  "classId": "class-id",
  "date": "2026-03-20",
  "status": "present"
}
```

#### Bulk Mark Attendance
```http
POST /classroom/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "class-id",
  "date": "2026-03-20",
  "records": [
    { "studentId": "id1", "status": "present" },
    { "studentId": "id2", "status": "absent" }
  ]
}
```

## Assignments

#### List Assignments
```http
GET /assignments
```

#### Create Assignment
```http
POST /assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "student-id",
  "teacherId": "teacher-id",
  "date": "2026-03-20",
  "type": "new_lesson",
  "location": "masjid",
  "description": "Complete Surah Al-Mulk"
}
```

## Events

#### List Events
```http
GET /events
GET /events?upcoming=true&status=scheduled
```

#### Get Event
```http
GET /events/{id}
```

#### Create Event
```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Community Iftar",
  "description": "Join us for iftar",
  "location": "Main Hall",
  "startDate": "2026-03-20T18:00:00Z",
  "endDate": "2026-03-20T20:00:00Z",
  "capacity": 100,
  "category": "community"
}
```

#### Update Event
```http
PUT /events/{id}
```

#### Delete Event
```http
DELETE /events/{id}
```

## Finances

#### List Records
```http
GET /finances
```

#### Create Record
```http
POST /finances
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": "3",
  "year": 2026,
  "donations": 5000,
  "expenses": 3000,
  "notes": "March expenses"
}
```

#### Get Financial Report
```http
GET /finances/reports?year=2026
Authorization: Bearer <token>
```

#### Export Report to CSV
```http
POST /finances/reports?year=2026
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "csv"
}
```

## Donations

#### List Donations
```http
GET /donations
GET /donations?status=completed&page=1
```

#### Create Checkout Session
```http
POST /donations/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100,
  "currency": "usd",
  "donorName": "John Doe",
  "donorEmail": "john@email.com",
  "campaign": "General"
}
```

## Kiosk

#### List Announcements
```http
GET /kiosk
```

#### Create Announcement
```http
POST /kiosk
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Jummah Prayer",
  "message": "Reminder for Jummah",
  "type": "event",
  "priority": 1,
  "isActive": true
}
```

#### Emergency Broadcast
```http
POST /kiosk/emergency
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "EMERGENCY",
  "message": "Please evacuate",
  "expiresInMinutes": 30
}
```

#### Clear Emergency
```http
DELETE /kiosk/emergency
Authorization: Bearer <token>
```

## Search

#### Global Search
```http
GET /search?q=muhammad&types=user,student
Authorization: Bearer <token>
```

## Notifications

#### Get Notifications
```http
GET /notifications
GET /notifications?unreadOnly=true
Authorization: Bearer <token>
```

#### Mark as Read
```http
POST /notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "notification-id"
}
```

#### Mark All as Read
```http
POST /notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "markAllRead": true
}
```

## Audit Logs

#### Get Logs
```http
GET /audit-logs
GET /audit-logs?action=login&dateFrom=2026-01-01&dateTo=2026-03-20
Authorization: Bearer <token>
```

#### Delete Old Logs
```http
DELETE /audit-logs?daysOld=90
Authorization: Bearer <token>
```

## Media

#### List Media
```http
GET /media
GET /media?folder=images
Authorization: Bearer <token>
```

#### Add Media
```http
POST /media
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "banner.jpg",
  "originalName": "banner.jpg",
  "mimeType": "image/jpeg",
  "size": 102400,
  "url": "https://cdn.example.com/banner.jpg",
  "folder": "banners"
}
```

#### Delete Media
```http
DELETE /media?id={id}
Authorization: Bearer <token>
```

## Backup

#### Create Backup
```http
POST /backup
Authorization: Bearer <token>
```

## Settings

#### Get Settings
```http
GET /settings
```

#### Update Settings
```http
POST /settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "notification_email",
  "value": "admin@almomineen.org"
}
```

## Upload

#### Upload File
```http
POST /upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "base64-encoded-image-data",
  "filename": "image.jpg"
}
```

---

## Error Responses

All endpoints may return these error codes:

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

Example error response:
```json
{
  "error": "Invalid token",
  "message": "Your session has expired"
}
```

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Auth endpoints | 5 requests/minute |
| Public API | 30 requests/minute |
| Other API | 100 requests/minute |

---

## Blog Categories

### List Categories
```http
GET /blog/categories
```
Response: Array of categories with post counts.

### Create Category
```http
POST /blog/categories
Content-Type: application/json

{
  "name": "News",
  "description": "Latest mosque news",
  "color": "#3b82f6"
}
```

### Update Category
```http
PUT /blog/categories/{id}
Content-Type: application/json

{
  "name": "News & Updates",
  "description": "All mosque updates",
  "color": "#3b82f6"
}
```

### Delete Category
```http
DELETE /blog/categories/{id}
```

---

## Event RSVPs

### List RSVPs
```http
GET /events/rsvp?eventId={eventId}
```

### Create/Update RSVP
```http
POST /events/rsvp
Content-Type: application/json

{
  "eventId": "event-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "status": "attending"
}
```

### Update RSVP
```http
PUT /events/rsvp/{id}
Content-Type: application/json

{
  "status": "maybe"
}
```

### Delete RSVP
```http
DELETE /events/rsvp/{id}
```

---

## Proposal Comments

### List Comments
```http
GET /proposals/comments?proposalId={proposalId}
```
Query params: `internal=true` to filter internal comments.

### Add Comment
```http
POST /proposals/comments
Content-Type: application/json

{
  "proposalId": "proposal-id",
  "message": "This is a great proposal!",
  "isInternal": false
}
```

### Update Comment
```http
PUT /proposals/comments/{id}
Content-Type: application/json

{
  "message": "Updated message",
  "isInternal": true
}
```

### Delete Comment
```http
DELETE /proposals/comments/{id}
```

---

## Expense Categories

### List Categories
```http
GET /finances/categories
```
Response: Array of expense categories with expense counts.

### Create Category
```http
POST /finances/categories
Content-Type: application/json

{
  "name": "Utilities",
  "description": "Electricity and water",
  "color": "#10b981",
  "icon": "Zap"
}
```

### Update Category
```http
PUT /finances/categories/{id}
Content-Type: application/json

{
  "name": "Utilities & Bills",
  "color": "#10b981"
}
```

### Delete Category
```http
DELETE /finances/categories/{id}
```

---

## Financial Expenses

### List Expenses
```http
GET /finances/expenses?categoryId={id}&startDate=2026-01-01&endDate=2026-12-31
```
Query params: `categoryId`, `startDate`, `endDate`, `page`, `limit`.

### Create Expense
```http
POST /finances/expenses
Content-Type: application/json

{
  "categoryId": "category-id",
  "amount": 150.00,
  "description": "Electricity bill",
  "date": "2026-03-15",
  "receiptUrl": "https://..."
}
```

### Update Expense
```http
PUT /finances/expenses/{id}
Content-Type: application/json

{
  "amount": 175.00,
  "description": "Electricity bill - updated"
}
```

### Delete Expense
```http
DELETE /finances/expenses/{id}
```

---

## Donations (Enhanced)

### List Donations
```http
GET /donations?status=completed&campaign=ramadan&page=1&limit=50
```

### Create Donation (Manual)
```http
POST /donations
Content-Type: application/json

{
  "donorName": "Ahmed Khan",
  "email": "ahmed@example.com",
  "amount": 500,
  "campaign": "building_fund",
  "status": "completed",
  "paymentMethod": "cash"
}
```

### Delete Donation
```http
DELETE /donations?id={donationId}
```

---

## Error Logs

### List Error Logs
```http
GET /logs/errors?type=error&resolved=false&page=1&limit=20
```
Query params: `type` (error/warning/info/server), `resolved` (true/false), `page`, `limit`.

### Create Error Log
```http
POST /logs/errors
Content-Type: application/json

{
  "message": "Something went wrong",
  "stack": "Error stack trace...",
  "type": "error",
  "path": "/api/some-route",
  "method": "GET",
  "statusCode": 500
}
```

### Update Error (Mark Resolved)
```http
PATCH /logs/errors
Content-Type: application/json

{
  "id": "error-id",
  "resolved": true
}
```

---

## Notifications Preferences

### Get Preferences
```http
GET /users/preferences
```

### Update Preferences
```http
POST /users/preferences
Content-Type: application/json

{
  "emailDonations": true,
  "emailVolunteers": false,
  "emailJobs": true,
  "emailProposals": false,
  "emailEvents": true,
  "emailGeneral": true,
  "pushDonations": false,
  "pushVolunteers": false,
  "pushJobs": false,
  "pushProposals": false,
  "pushEvents": false,
  "pushGeneral": false
}
```

---

## Parent Portal

### Get Student Info
```http
GET /portal/students?email={parentEmail}
```

---

## Search Analytics

### Get Search Stats
```http
GET /search/analytics
```

### Record Search
```http
POST /search/analytics
Content-Type: application/json

{
  "query": "prayer times",
  "types": ["prayers"],
  "resultCount": 5,
  "userId": "user-id"
}
```

---

## Attendance (Enhanced)

### Bulk Mark Attendance
```http
POST /classroom/attendance
Content-Type: application/json

{
  "classId": "class-id",
  "date": "2026-03-20",
  "records": [
    { "studentId": "student-1", "status": "present" },
    { "studentId": "student-2", "status": "absent" }
  ]
}
```

### Get Attendance Records
```http
GET /classroom/attendance?classId={id}&startDate=2026-01-01&endDate=2026-03-31
```

---

## 2FA Authentication

### Setup 2FA
```http
POST /auth/2fa/setup
```

### Verify 2FA
```http
POST /auth/2fa/verify
Content-Type: application/json

{
  "token": "123456",
  "tempToken": "temp-token-from-setup"
}
```

### Disable 2FA
```http
POST /auth/2fa/disable
Content-Type: application/json

{
  "token": "123456"
}
```

---

## Kiosk Schedule

### Get Schedule
```http
GET /kiosk/schedule
```

### Set Schedule
```http
POST /kiosk/schedule
Content-Type: application/json

{
  "enabled": true,
  "interval": 30000,
  "transition": "fade",
  "startTime": "08:00",
  "endTime": "22:00"
}
```

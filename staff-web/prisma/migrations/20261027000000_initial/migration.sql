-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('member', 'teacher', 'staff', 'finance', 'admin', 'student');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'disabled');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'approved', 'declined', 'withdrawn');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('requested', 'approved', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid', 'void', 'refunded');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('new', 'in_review', 'closed');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('pending', 'in_review', 'rejected');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "RefundSourceKind" AS ENUM ('donation', 'tuition');

-- CreateEnum
CREATE TYPE "RefundWorkflowStatus" AS ENUM ('requested', 'submitting', 'provider_pending', 'completed', 'rejected', 'failed');

-- CreateEnum
CREATE TYPE "FaithNoticeKind" AS ENUM ('ramadan_start', 'eid_al_fitr', 'eid_al_adha', 'moon_sighting', 'other');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'suspended', 'left');

-- CreateEnum
CREATE TYPE "RoleCapability" AS ENUM ('worship_publish', 'facilities_manage', 'volunteers_manage', 'community_moderate');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'leased', 'delivered', 'retry', 'exhausted');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "verifiedAt" TIMESTAMP(3),
    "mfaSecretEncrypted" TEXT,
    "mfaPendingSecretEncrypted" TEXT,
    "mfaEnabledAt" TIMESTAMP(3),
    "mfaLastCounter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "mfaVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerDay" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "fajr" TEXT NOT NULL,
    "sunrise" TEXT NOT NULL,
    "dhuhr" TEXT NOT NULL,
    "asr" TEXT NOT NULL,
    "maghrib" TEXT NOT NULL,
    "isha" TEXT NOT NULL,
    "fajrIqamah" TEXT,
    "dhuhrIqamah" TEXT,
    "asrIqamah" TEXT,
    "maghribIqamah" TEXT,
    "ishaIqamah" TEXT,
    "source" TEXT NOT NULL DEFAULT 'mosque',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JummahSession" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "khutbahAt" TEXT,
    "iqamahAt" TEXT NOT NULL,
    "language" TEXT,

    CONSTRAINT "JummahSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'general',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "rsvpCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRSVP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProgram" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SchoolProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSection" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianLink" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "GuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "markedById" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "studentId" TEXT NOT NULL,
    "payerGuardianId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationCampaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "goalMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DonationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "campaignId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerOpportunity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VolunteerOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',

    CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "submittedById" TEXT,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProposalVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalResource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RentalResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalBooking" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'requested',

    CONSTRAINT "RentalBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthThrottle" (
    "keyHash" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("keyHash")
);

-- CreateTable
CREATE TABLE "SchoolAssignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentReport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceBudget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceExpense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "incurredOn" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentApplication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "studentFirstName" TEXT NOT NULL,
    "studentLastName" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "reviewedById" TEXT,
    "approvedStudentId" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "EnrollmentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "newsletterOptIn" BOOLEAN NOT NULL DEFAULT false,
    "eventEmailOptIn" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerShift" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "status" "ShiftStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityArticle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "donationId" TEXT,
    "invoiceId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debitMinor" INTEGER NOT NULL DEFAULT 0,
    "creditMinor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceKind" "RefundSourceKind" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundWorkflowStatus" NOT NULL DEFAULT 'requested',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "stripeRefundId" TEXT,
    "providerErrorCode" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaithNotice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "FaithNoticeKind" NOT NULL,
    "localDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "approvedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaithNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleGrant" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "capability" "RoleCapability" NOT NULL,
    "grantedById" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RoleGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Venue_organizationId_idx" ON "Venue"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_tokenHash_key" ON "EmailToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PrayerDay_venueId_published_localDate_idx" ON "PrayerDay"("venueId", "published", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerDay_venueId_localDate_key" ON "PrayerDay"("venueId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "JummahSession_venueId_localDate_ordinal_key" ON "JummahSession"("venueId", "localDate", "ordinal");

-- CreateIndex
CREATE INDEX "Announcement_organizationId_status_publishedAt_idx" ON "Announcement"("organizationId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Event_organizationId_status_startAt_idx" ON "Event"("organizationId", "status", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRSVP_eventId_userId_key" ON "EventRSVP"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNumber_key" ON "Student"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianLink_guardianId_studentId_key" ON "GuardianLink"("guardianId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAssignment_teacherId_classId_key" ON "TeacherAssignment"("teacherId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "Enrollment"("studentId", "classId");

-- CreateIndex
CREATE INDEX "ClassSession_classId_startsAt_idx" ON "ClassSession"("classId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_studentId_key" ON "Attendance"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolInvoice_paymentIntentId_key" ON "SchoolInvoice"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolInvoice_stripeSessionId_key" ON "SchoolInvoice"("stripeSessionId");

-- CreateIndex
CREATE INDEX "SchoolInvoice_studentId_status_idx" ON "SchoolInvoice"("studentId", "status");

-- CreateIndex
CREATE INDEX "SchoolInvoice_payerGuardianId_status_idx" ON "SchoolInvoice"("payerGuardianId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_paymentIntentId_key" ON "Donation"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_providerEventId_key" ON "PaymentEvent"("providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerApplication_opportunityId_userId_key" ON "VolunteerApplication"("opportunityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVote_proposalId_userId_key" ON "ProposalVote"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_userId_key" ON "JobApplication"("jobId", "userId");

-- CreateIndex
CREATE INDEX "RentalBooking_resourceId_startAt_endAt_idx" ON "RentalBooking"("resourceId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_occurredAt_idx" ON "AuditEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "SchoolAssignment_classId_published_dueAt_idx" ON "SchoolAssignment"("classId", "published", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubmission_assignmentId_studentId_key" ON "StudentSubmission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "StudentReport_studentId_status_publishedAt_idx" ON "StudentReport"("studentId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_organizationId_status_createdAt_idx" ON "ContactSubmission"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_email_createdAt_idx" ON "ContactSubmission"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceBudget_organizationId_category_periodMonth_key" ON "FinanceBudget"("organizationId", "category", "periodMonth");

-- CreateIndex
CREATE INDEX "FinanceExpense_organizationId_status_createdAt_idx" ON "FinanceExpense"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EnrollmentApplication_organizationId_status_createdAt_idx" ON "EnrollmentApplication"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EnrollmentApplication_applicantUserId_createdAt_idx" ON "EnrollmentApplication"("applicantUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DeletionRequest_userId_status_idx" ON "DeletionRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "VolunteerShift_userId_startAt_status_idx" ON "VolunteerShift"("userId", "startAt", "status");

-- CreateIndex
CREATE INDEX "VolunteerShift_opportunityId_startAt_idx" ON "VolunteerShift"("opportunityId", "startAt");

-- CreateIndex
CREATE INDEX "CommunityArticle_organizationId_status_publishedAt_idx" ON "CommunityArticle"("organizationId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "ConstructionProject_organizationId_status_idx" ON "ConstructionProject"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ConstructionMilestone_projectId_status_createdAt_idx" ON "ConstructionMilestone"("projectId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_receiptNumber_key" ON "PaymentReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_donationId_key" ON "PaymentReceipt"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_invoiceId_key" ON "PaymentReceipt"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_sourceType_sourceId_key" ON "PaymentReceipt"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_organizationId_code_currency_key" ON "LedgerAccount"("organizationId", "code", "currency");

-- CreateIndex
CREATE INDEX "JournalEntry_organizationId_postedAt_idx" ON "JournalEntry"("organizationId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_sourceType_sourceId_key" ON "JournalEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_stripeRefundId_key" ON "RefundRequest"("stripeRefundId");

-- CreateIndex
CREATE INDEX "RefundRequest_organizationId_status_createdAt_idx" ON "RefundRequest"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_sourceKind_sourceId_key" ON "RefundRequest"("sourceKind", "sourceId");

-- CreateIndex
CREATE INDEX "FaithNotice_organizationId_status_localDate_idx" ON "FaithNotice"("organizationId", "status", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "FaithNotice_organizationId_kind_localDate_key" ON "FaithNotice"("organizationId", "kind", "localDate");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_status_idx" ON "OrganizationMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "RoleGrant_membershipId_revokedAt_expiresAt_idx" ON "RoleGrant"("membershipId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoleGrant_membershipId_capability_key" ON "RoleGrant"("membershipId", "capability");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_leaseUntil_idx" ON "OutboxEvent"("status", "availableAt", "leaseUntil");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_notificationId_channel_key" ON "OutboxEvent"("notificationId", "channel");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerDay" ADD CONSTRAINT "PrayerDay_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JummahSession" ADD CONSTRAINT "JummahSession_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRSVP" ADD CONSTRAINT "EventRSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRSVP" ADD CONSTRAINT "EventRSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProgram" ADD CONSTRAINT "SchoolProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SchoolProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationCampaign" ADD CONSTRAINT "DonationCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerOpportunity" ADD CONSTRAINT "VolunteerOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerApplication" ADD CONSTRAINT "VolunteerApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerApplication" ADD CONSTRAINT "VolunteerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVote" ADD CONSTRAINT "ProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVote" ADD CONSTRAINT "ProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalResource" ADD CONSTRAINT "RentalResource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "RentalResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAssignment" ADD CONSTRAINT "SchoolAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAssignment" ADD CONSTRAINT "SchoolAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SchoolAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceBudget" ADD CONSTRAINT "FinanceBudget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SchoolProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_approvedStudentId_fkey" FOREIGN KEY ("approvedStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerShift" ADD CONSTRAINT "VolunteerShift_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VolunteerApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerShift" ADD CONSTRAINT "VolunteerShift_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerShift" ADD CONSTRAINT "VolunteerShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityArticle" ADD CONSTRAINT "CommunityArticle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionProject" ADD CONSTRAINT "ConstructionProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionMilestone" ADD CONSTRAINT "ConstructionMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ConstructionProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SchoolInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaithNotice" ADD CONSTRAINT "FaithNotice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaithNotice" ADD CONSTRAINT "FaithNotice_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Additive, reviewed schema for human-approved mosque prayer publication.
-- Never run an automatic db push or seed against a production database.
CREATE TABLE "PrayerScheduleRevision" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "baseRevision" INTEGER NOT NULL DEFAULT 0,
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
    "source" TEXT NOT NULL,
    "correctionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authoredById" TEXT NOT NULL,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrayerScheduleRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrayerScheduleRevision_venueId_localDate_revision_key"
    ON "PrayerScheduleRevision"("venueId","localDate","revision");
CREATE INDEX "PrayerScheduleRevision_venueId_status_localDate_idx"
    ON "PrayerScheduleRevision"("venueId","status","localDate");

ALTER TABLE "PrayerScheduleRevision"
    ADD CONSTRAINT "PrayerScheduleRevision_venueId_fkey"
    FOREIGN KEY ("venueId") REFERENCES "Venue"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

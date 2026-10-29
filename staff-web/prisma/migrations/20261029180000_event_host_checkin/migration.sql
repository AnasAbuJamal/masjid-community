-- Additive host assignment and versioned attendance. No legacy attendee is marked present.
ALTER TABLE "EventRSVP" ADD COLUMN "checkedInAt" TIMESTAMP(3);
ALTER TABLE "EventRSVP" ADD COLUMN "checkedInById" TEXT;
ALTER TABLE "EventRSVP" ADD COLUMN "checkInRevision" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "EventHostAssignment" (
 "id" TEXT NOT NULL,
 "eventId" TEXT NOT NULL,
 "hostId" TEXT NOT NULL,
 "assignedById" TEXT NOT NULL,
 "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "revokedAt" TIMESTAMP(3),
 CONSTRAINT "EventHostAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventHostAssignment_eventId_hostId_key" ON "EventHostAssignment"("eventId","hostId");
CREATE INDEX "EventHostAssignment_hostId_revokedAt_idx" ON "EventHostAssignment"("hostId","revokedAt");
ALTER TABLE "EventHostAssignment" ADD CONSTRAINT "EventHostAssignment_eventId_fkey"
 FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventHostAssignment" ADD CONSTRAINT "EventHostAssignment_hostId_fkey"
 FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

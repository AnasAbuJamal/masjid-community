-- Optional event waitlists preserve existing confirmed registrations.
-- Existing EventRSVP rows default to confirmed, matching previous rsvpCount semantics.
ALTER TABLE "Event" ADD COLUMN "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EventRSVP" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'confirmed';
CREATE INDEX "EventRSVP_eventId_status_createdAt_id_idx"
 ON "EventRSVP"("eventId","status","createdAt","id");

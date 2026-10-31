-- F-006. Explicit, venue-owned public emergency notice with revision and expiry.
-- No existing notices are backfilled or marked as emergencies.
CREATE TABLE "VenueEmergencyNotice" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "publishedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VenueEmergencyNotice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VenueEmergencyNotice_venueId_key" ON "VenueEmergencyNotice"("venueId");
CREATE INDEX "VenueEmergencyNotice_status_expiresAt_idx"
  ON "VenueEmergencyNotice"("status","expiresAt");
ALTER TABLE "VenueEmergencyNotice" ADD CONSTRAINT "VenueEmergencyNotice_venueId_fkey"
  FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VenueEmergencyNotice" ADD CONSTRAINT "VenueEmergencyNotice_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VenueEmergencyNotice"
 ADD CONSTRAINT "VenueEmergencyNotice_expiry_after_publication"
 CHECK ("publishedAt" IS NULL OR "expiresAt" > "publishedAt");

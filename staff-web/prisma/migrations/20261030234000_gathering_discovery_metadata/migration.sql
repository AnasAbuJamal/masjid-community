-- F-007/F-008. Add optional, tenant-reviewed gathering discovery metadata.
-- Existing events remain valid; no venue or accommodation is invented.
ALTER TABLE "Event"
  ADD COLUMN "venueId" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "audience" TEXT,
  ADD COLUMN "accessibilityFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "accessibilityNotes" TEXT;
ALTER TABLE "Event"
  ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId")
    REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Event_organizationId_status_venueId_startAt_idx"
  ON "Event"("organizationId","status","venueId","startAt");
CREATE INDEX "Event_organizationId_status_category_startAt_idx"
  ON "Event"("organizationId","status","category","startAt");

-- Reject cross-mosque venue links even from non-HTTP database writers.
-- The nullable FK alone cannot compare Event.organizationId with Venue.organizationId.
CREATE FUNCTION sila_guard_event_venue_tenant()
RETURNS trigger LANGUAGE plpgsql AS $
BEGIN
 IF NEW."venueId" IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM "Venue" v
   WHERE v."id"=NEW."venueId" AND v."organizationId"=NEW."organizationId"
 ) THEN
  RAISE EXCEPTION 'Gathering venue belongs to a different mosque'
   USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$;
CREATE TRIGGER sila_guard_event_venue_tenant_before_write
BEFORE INSERT OR UPDATE OF "venueId", "organizationId" ON "Event"
FOR EACH ROW EXECUTE FUNCTION sila_guard_event_venue_tenant();
-- A venue cannot be reassigned across mosques while it owns gatherings.
CREATE FUNCTION sila_block_venue_transfer()
RETURNS trigger LANGUAGE plpgsql AS $
BEGIN
 IF NEW."organizationId" IS DISTINCT FROM OLD."organizationId"
  AND EXISTS(SELECT 1 FROM "Event" e WHERE e."venueId"=OLD."id") THEN
  RAISE EXCEPTION 'Venue transfer would cross an existing gathering owner'
   USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$;
CREATE TRIGGER sila_block_venue_transfer_before_write
BEFORE UPDATE OF "organizationId" ON "Venue"
FOR EACH ROW EXECUTE FUNCTION sila_block_venue_transfer();

-- F-008/F-009: additive, nullable organizer-defined gathering policy.
-- Existing reservations and past events retain their previous behavior.
-- Requires reviewed backup/restore and migration sign-off before production.
ALTER TABLE "Event"
  ADD COLUMN "rsvpDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "cancellationDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "cancellationTerms" TEXT;

-- Signed Stripe payout reports; NEVER auto-mark a bank settlement as reconciled.
CREATE TYPE "ProviderPayoutState" AS ENUM ('pending','in_transit','paid','failed','canceled');
CREATE TABLE "ProviderPayout" (
 "id" TEXT NOT NULL,
 "organizationId" TEXT NOT NULL,
 "providerPayoutId" TEXT NOT NULL,
 "amountMinor" INTEGER NOT NULL,
 "currency" TEXT NOT NULL,
 "state" "ProviderPayoutState" NOT NULL,
 "arrivalAt" TIMESTAMP(3),
 "failureCode" TEXT,
 "lastProviderEventId" TEXT NOT NULL,
 "lastProviderEventCreated" INTEGER NOT NULL,
 "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ProviderPayout_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProviderPayout_providerPayoutId_key" ON "ProviderPayout"("providerPayoutId");
CREATE INDEX "ProviderPayout_organizationId_state_observedAt_idx" ON "ProviderPayout"("organizationId","state","observedAt");
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_positive_amount_check"
 CHECK ("amountMinor">0);
CREATE TABLE "PayoutReviewNote" (
 "id" TEXT NOT NULL,
 "payoutId" TEXT NOT NULL,
 "authorId" TEXT NOT NULL,
 "body" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PayoutReviewNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PayoutReviewNote_payoutId_createdAt_idx" ON "PayoutReviewNote"("payoutId","createdAt");
ALTER TABLE "PayoutReviewNote" ADD CONSTRAINT "PayoutReviewNote_payoutId_fkey"
 FOREIGN KEY ("payoutId") REFERENCES "ProviderPayout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutReviewNote" ADD CONSTRAINT "PayoutReviewNote_authorId_fkey"
 FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

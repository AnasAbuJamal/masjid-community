-- CreateEnum
CREATE TYPE "RecurringGiftStatus" AS ENUM ('pending', 'active', 'past_due', 'cancelled', 'failed', 'incomplete', 'paused');

-- CreateTable
CREATE TABLE "RecurringGift" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "requestKey" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "status" "RecurringGiftStatus" NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "checkoutUrl" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "providerEventCreated" INTEGER NOT NULL DEFAULT 0,
    "cancelRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInstallment" (
    "invoiceId" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringInstallment_pkey" PRIMARY KEY ("invoiceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringGift_stripeSessionId_key" ON "RecurringGift"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringGift_stripeSubscriptionId_key" ON "RecurringGift"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "RecurringGift_donorId_createdAt_id_idx" ON "RecurringGift"("donorId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringGift_donorId_requestKey_key" ON "RecurringGift"("donorId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringInstallment_donationId_key" ON "RecurringInstallment"("donationId");

-- CreateIndex
CREATE INDEX "RecurringInstallment_giftId_createdAt_invoiceId_idx" ON "RecurringInstallment"("giftId", "createdAt", "invoiceId");

-- AddForeignKey
ALTER TABLE "RecurringGift" ADD CONSTRAINT "RecurringGift_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringGift" ADD CONSTRAINT "RecurringGift_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInstallment" ADD CONSTRAINT "RecurringInstallment_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "RecurringGift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInstallment" ADD CONSTRAINT "RecurringInstallment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


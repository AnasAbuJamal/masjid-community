DO $$ BEGIN
  CREATE TYPE "SchoolInvoiceStatus" AS ENUM ('pending', 'paid', 'refunded', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SchoolInvoice" (
  "id" SERIAL NOT NULL,
  "studentId" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" "SchoolInvoiceStatus" NOT NULL DEFAULT 'pending',
  "stripeSessionId" TEXT,
  "stripePaymentId" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolInvoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SchoolInvoice_studentId_fkey" FOREIGN KEY ("studentId")
    REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SchoolInvoice_nonnegative_amount" CHECK ("amountCents" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolInvoice_stripeSessionId_key"
  ON "SchoolInvoice"("stripeSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolInvoice_stripePaymentId_key" ON "SchoolInvoice"("stripePaymentId");
CREATE INDEX IF NOT EXISTS "SchoolInvoice_studentId_status_idx"
  ON "SchoolInvoice"("studentId", "status");
CREATE INDEX IF NOT EXISTS "SchoolInvoice_dueDate_idx"
  ON "SchoolInvoice"("dueDate");

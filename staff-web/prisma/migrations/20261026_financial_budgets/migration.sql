CREATE TABLE IF NOT EXISTS "FinancialBudget" (
  "id" SERIAL NOT NULL,
  "categoryId" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "allocated" DOUBLE PRECISION NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialBudget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialBudget_categoryId_fkey" FOREIGN KEY ("categoryId")
    REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FinancialBudget_valid_month" CHECK ("month" BETWEEN 1 AND 12),
  CONSTRAINT "FinancialBudget_valid_amount" CHECK ("allocated" >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialBudget_categoryId_year_month_key"
  ON "FinancialBudget"("categoryId", "year", "month");
CREATE INDEX IF NOT EXISTS "FinancialBudget_year_month_isPublished_idx"
  ON "FinancialBudget"("year", "month", "isPublished");

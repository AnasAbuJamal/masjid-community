-- Real community votes, idempotent by authenticated user and proposal.
CREATE TABLE IF NOT EXISTS "ProposalVote" (
  "id" SERIAL NOT NULL,
  "proposalId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProposalVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProposalVote_proposalId_userId_key"
  ON "ProposalVote"("proposalId","userId");
CREATE INDEX IF NOT EXISTS "ProposalVote_userId_idx" ON "ProposalVote"("userId");

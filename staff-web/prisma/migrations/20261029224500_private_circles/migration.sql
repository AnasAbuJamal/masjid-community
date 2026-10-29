-- Private moderated circles. No imported member directories or inferred joins.
CREATE TYPE "CircleMemberStatus" AS ENUM ('requested','approved','declined','left');
CREATE TABLE "Circle" (
 "id" TEXT NOT NULL,
 "organizationId" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "summary" TEXT NOT NULL,
 "cadence" TEXT NOT NULL,
 "guidelines" TEXT NOT NULL,
 "hostId" TEXT NOT NULL,
 "status" "ContentStatus" NOT NULL DEFAULT 'draft',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CircleMember" (
 "id" TEXT NOT NULL,
 "circleId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "status" "CircleMemberStatus" NOT NULL DEFAULT 'requested',
 "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "reviewedAt" TIMESTAMP(3),
 "reviewedById" TEXT,
 "decisionReason" TEXT,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CircleUpdate" (
 "id" TEXT NOT NULL,
 "circleId" TEXT NOT NULL,
 "authorId" TEXT NOT NULL,
 "body" TEXT NOT NULL,
 "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "revision" INTEGER NOT NULL DEFAULT 1,
 CONSTRAINT "CircleUpdate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Circle_organizationId_status_createdAt_idx" ON "Circle"("organizationId","status","createdAt");
CREATE INDEX "Circle_hostId_status_idx" ON "Circle"("hostId","status");
CREATE UNIQUE INDEX "CircleMember_circleId_userId_key" ON "CircleMember"("circleId","userId");
CREATE INDEX "CircleMember_circleId_status_requestedAt_id_idx" ON "CircleMember"("circleId","status","requestedAt","id");
CREATE INDEX "CircleMember_userId_status_idx" ON "CircleMember"("userId","status");
CREATE INDEX "CircleUpdate_circleId_publishedAt_id_idx" ON "CircleUpdate"("circleId","publishedAt","id");
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_hostId_fkey"
 FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey"
 FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_userId_fkey"
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CircleUpdate" ADD CONSTRAINT "CircleUpdate_circleId_fkey"
 FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleUpdate" ADD CONSTRAINT "CircleUpdate_authorId_fkey"
 FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

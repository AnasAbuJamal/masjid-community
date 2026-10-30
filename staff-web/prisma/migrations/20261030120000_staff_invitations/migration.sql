-- Staff access is explicitly invited and accepted; token remains SHA-256
-- hashed at rest. No existing user/role/grant is automatically modified.
CREATE TABLE "StaffInvitation" (
 "id" TEXT NOT NULL,
 "organizationId" TEXT NOT NULL,
 "invitedEmail" TEXT NOT NULL,
 "tokenHash" TEXT NOT NULL,
 "capabilities" "RoleCapability"[] NOT NULL,
 "issuedById" TEXT NOT NULL,
 "acceptedUserId" TEXT,
 "acceptedAt" TIMESTAMP(3),
 "revokedAt" TIMESTAMP(3),
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");
CREATE INDEX "StaffInvitation_organizationId_invitedEmail_expiresAt_idx" ON "StaffInvitation"("organizationId","invitedEmail","expiresAt");
CREATE INDEX "StaffInvitation_organizationId_createdAt_idx" ON "StaffInvitation"("organizationId","createdAt");
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_organizationId_fkey"
 FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_issuedById_fkey"
 FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_acceptedUserId_fkey"
 FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

export async function getApiIdentity(req: NextRequest) {
  const mobile = await getMobileAuthUser(req);
  if (mobile) return {
    id: mobile.id,
    email: mobile.email.toLowerCase(),
    role: mobile.role,
    firstName: mobile.firstName,
    lastName: mobile.lastName,
    isVerified: mobile.isVerified,
  };
  const session = await auth();
  const id = session?.user.id ? Number(session.user.id) : 0;
  if (!session?.user.email || !Number.isSafeInteger(id) || id <= 0) return null;
  // Re-query the database: browser session claims may be stale after role or account changes.
  const account = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, firstName: true,
      lastName: true, isVerified: true, isActive: true },
  });
  if (!account?.isActive) return null;
  return {
    id: account.id, email: account.email.toLowerCase(), role: account.role,
    firstName: account.firstName, lastName: account.lastName,
    isVerified: account.isVerified,
  };
}

export function isStaff(role: string) {
  return ["admin", "teacher", "staff"].includes(role);
}

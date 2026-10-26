import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function getApiIdentity(req: NextRequest) {
  const mobile = await getMobileAuthUser(req);
  if (mobile) return {
    id: mobile.id,
    email: mobile.email.toLowerCase(),
    role: mobile.role,
    firstName: mobile.firstName,
    lastName: mobile.lastName,
  };
  const session = await auth();
  const id = session?.user.id ? Number(session.user.id) : 0;
  if (!session?.user.email || !Number.isSafeInteger(id) || id <= 0) return null;
  return {
    id,
    email: session.user.email.toLowerCase(),
    role: session.user.role,
    firstName: session.user.name?.split(" ")[0] ?? "",
    lastName: session.user.name?.split(" ").slice(1).join(" ") ?? "",
  };
}

export function isStaff(role: string) {
  return ["admin", "teacher", "staff"].includes(role);
}

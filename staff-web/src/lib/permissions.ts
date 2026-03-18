import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "./role-config";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  const userRole = session.user.role as UserRole;
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }
  
  return session;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireTeacher() {
  return requireRole(["admin", "teacher"]);
}

export function withRoleGuard(handler: (req: NextRequest, session: Awaited<ReturnType<typeof auth>>) => Promise<NextResponse>, allowedRoles: UserRole[]) {
  return async (req: NextRequest) => {
    try {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userRole = session.user.role as UserRole;
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return handler(req, session);
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

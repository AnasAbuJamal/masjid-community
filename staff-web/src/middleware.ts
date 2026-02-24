import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const rolePermissions: Record<string, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/prayers",
    "/dashboard/blog",
    "/dashboard/classroom",
    "/dashboard/assignments",
    "/dashboard/gamification",
    "/dashboard/construction",
    "/dashboard/volunteers",
    "/dashboard/proposals",
    "/dashboard/finances",
    "/dashboard/donations",
    "/dashboard/jobs",
    "/dashboard/users",
    "/dashboard/settings",
    "/dashboard/audit-logs",
  ],
  teacher: [
    "/dashboard",
    "/dashboard/classroom",
    "/dashboard/assignments",
    "/dashboard/gamification",
  ],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role || "";

  if (pathname === "/" || pathname.startsWith("/api/auth") || pathname.startsWith("/kiosk")) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const allowedRoutes = rolePermissions[role] || [];
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route) || pathname === route);

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

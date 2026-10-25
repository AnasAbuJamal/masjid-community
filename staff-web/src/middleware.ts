import { withAuth } from "next-auth/middleware";
import { navItems, type UserRole } from "@/lib/role-config";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/api/auth", "/kiosk", "/api/public/notifications"];

const publicApiPaths = [
  "/api/public",
  "/api/webhooks",
  "/api/auth-login"
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (publicPaths.some(path => pathname === path || pathname.startsWith(path + "/"))) {
      return NextResponse.next();
    }

    const isPublicApi = publicApiPaths.some(path => pathname.startsWith(path));
    if (isPublicApi) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;

    if (!token && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (token && pathname.startsWith("/dashboard")) {
      const item = [...navItems].sort((a, b) => b.href.length - a.href.length).find(item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")));
      if (item && !item.roles.includes(token.role as UserRole)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    secret: process.env.AUTH_SECRET,
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*"
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/api/auth", "/kiosk", "/api/public/notifications"];

const publicApiPaths = [
  "/api/public",
  "/api/webhooks",
  "/api/auth-login"
];

const teacherAllowedPaths = [
  "/dashboard",
  "/dashboard/classroom",
  "/dashboard/assignments",
  "/dashboard/gamification",
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

    if (token) {
      const role = token.role as string;

      if (role === "admin") {
        return NextResponse.next();
      }

      if (role === "teacher" && pathname.startsWith("/dashboard")) {
        const isAllowed = teacherAllowedPaths.some((path) => {
          if (path === "/dashboard") return pathname === "/dashboard";
          return pathname === path || pathname.startsWith(path + "/");
        });

        if (!isAllowed) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
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
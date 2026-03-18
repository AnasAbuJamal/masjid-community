import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/api/auth", "/kiosk"];
const publicApiPaths = ["/api/public", "/api/webhooks"];

const teacherAllowedPaths = [
  "/dashboard",
  "/dashboard/classroom",
  "/dashboard/assignments",
  "/dashboard/gamification",
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Allow public paths
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path + "/"))) {
      return NextResponse.next();
    }

    // Allow public API routes (mobile app endpoints)
    if (publicApiPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;
    
    // If not authenticated, redirect to login for protected paths
    if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/api/"))) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // If authenticated, check role-based access
    if (token) {
      const role = token.role as string;

      // Admin has full access
      if (role === "admin") {
        return NextResponse.next();
      }

      // Teacher: check if the page is in the allowed list
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
      authorized: () => true, // We handle authorization and redirects manually in the middleware function
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth|public|webhooks).*)"],
};

"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { navItems, canAccess, type UserRole } from "@/lib/role-config";
import { ShieldAlert } from "lucide-react";

/**
 * Centralized role guard that sits in the dashboard layout.
 * It checks the current pathname against the navItems config
 * and redirects unauthorized users to the dashboard with a message.
 */
export default function RoleGuard({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const userRole = (session?.user as { role?: string })?.role as UserRole | undefined;

    // Find the nav item matching this path
    const navItem = navItems.find(
        (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
    );

    // Determine required roles: if it's a known nav item, use its roles; otherwise allow all
    const requiredRoles = navItem?.roles || (["admin", "teacher"] as UserRole[]);

    const hasAccess = !userRole || canAccess(userRole, requiredRoles);

    useEffect(() => {
        if (status === "authenticated" && userRole && !hasAccess) {
            const timer = setTimeout(() => router.replace("/dashboard"), 2000);
            return () => clearTimeout(timer);
        }
    }, [status, userRole, hasAccess, router]);

    // Loading state
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" />
            </div>
        );
    }

    // If user cannot access this page, show a denial message before redirecting
    if (status === "authenticated" && userRole && !hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                    <p className="text-gray-500 mt-1">
                        You don&apos;t have permission to view this page.
                    </p>
                </div>
                <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
            </div>
        );
    }

    return <>{children}</>;
}

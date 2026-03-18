"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { canAccess, type UserRole } from "@/lib/role-config";
import { ShieldAlert } from "lucide-react";

interface RequireRoleProps {
    roles: UserRole[];
    children: ReactNode;
}

/**
 * Wraps a page component to enforce role-based access.
 * Redirects unauthorized users to the dashboard with a brief message.
 */
export default function RequireRole({ roles, children }: RequireRoleProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const userRole = (session?.user as { role?: string })?.role as UserRole | undefined;

    useEffect(() => {
        if (status === "authenticated" && userRole && !canAccess(userRole, roles)) {
            router.replace("/dashboard");
        }
    }, [status, userRole, roles, router]);

    // Loading state
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    // Not authenticated
    if (status === "unauthenticated") {
        router.replace("/");
        return null;
    }

    // Check access
    if (userRole && !canAccess(userRole, roles)) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        You don&apos;t have permission to view this page.
                    </p>
                </div>
                <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
            </div>
        );
    }

    return <>{children}</>;
}

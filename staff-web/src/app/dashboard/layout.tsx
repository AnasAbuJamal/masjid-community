"use client";

import { SessionProvider, useSession } from "next-auth/react";
import AppSidebar from "@/components/app-sidebar";
import RoleGuard from "@/components/role-guard";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import NotificationBell from "@/components/notification-bell";

function PortalSearch() {
    const { data: session } = useSession();
    return session?.user.role === "admin" ? <Link href="/dashboard/search" aria-label="Search the portal" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Search className="h-5 w-5" /></Link> : null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <div className="flex min-h-screen bg-slate-50">
                <AppSidebar />
                <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>
                <main id="main-content" className="min-w-0 flex-1">
                    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3">
                        <div className="flex min-h-10 items-center justify-between gap-4 pl-12 lg:pl-0">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <ShieldCheck className="hidden sm:block h-4 w-4 text-blue-600" />
                                <span className="font-medium text-slate-700">Community workspace</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <PortalSearch />
                                <NotificationBell />
                            </div>
                        </div>
                    </header>
                    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
                        <RoleGuard>
                            {children}
                        </RoleGuard>
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}

"use client";

import { SessionProvider } from "next-auth/react";
import AppSidebar from "@/components/app-sidebar";
import RoleGuard from "@/components/role-guard";
import NotificationBell from "@/components/notification-bell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <div className="flex min-h-screen bg-white">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3">
                        <div className="flex justify-end">
                            <NotificationBell />
                        </div>
                    </header>
                    <div className="p-6">
                        <RoleGuard>
                            {children}
                        </RoleGuard>
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}

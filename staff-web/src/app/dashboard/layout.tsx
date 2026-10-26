"use client";

import { SessionProvider } from "next-auth/react";
import AppSidebar from "@/components/app-sidebar";
import RoleGuard from "@/components/role-guard";
import NotificationBell from "@/components/notification-bell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <div className="flex min-h-screen bg-background text-foreground">
                <AppSidebar />
                <main className="min-w-0 flex-1 overflow-auto">
                    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-xl px-4 py-3 sm:px-6">
                        <div className="flex justify-end">
                            <NotificationBell />
                        </div>
                    </header>
                    <div className="p-4 sm:p-6 lg:p-8">
                        <RoleGuard>
                            {children}
                        </RoleGuard>
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}

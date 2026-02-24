"use client";

import { SessionProvider } from "next-auth/react";
import AppSidebar from "@/components/app-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <div className="flex min-h-screen">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    <div className="p-4 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}

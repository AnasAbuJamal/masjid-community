"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { navItems, type UserRole } from "@/lib/role-config";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Clock, FileText, GraduationCap, ClipboardList,
    Trophy, HardHat, HandHelping, Lightbulb, DollarSign, Heart,
    Briefcase, Users, ScrollText, Settings, LogOut, Menu, X, ChevronRight, Tv,
    Sun, Moon,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
    LayoutDashboard, Clock, FileText, GraduationCap, ClipboardList,
    Trophy, HardHat, HandHelping, Lightbulb, DollarSign, Heart,
    Briefcase, Users, ScrollText, Settings, Tv,
};

export default function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const userRole = (session?.user as { role?: string })?.role as UserRole || "teacher";
    const userName = session?.user?.name || "User";
    const userEmail = session?.user?.email || "";

    const filteredItems = navItems.filter((item) => item.roles.includes(userRole));
    const sections = [...new Set(filteredItems.map((item) => item.section))];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            <div className={cn("flex items-center gap-3 p-4 border-b border-gray-200", collapsed && "justify-center px-2")}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900 flex-shrink-0">
                    <span className="text-lg">🕌</span>
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h2 className="text-sm font-semibold text-gray-900 truncate leading-tight">Al-Momineen</h2>
                        <p className="text-xs text-gray-500 truncate">Staff Portal</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {sections.map((section) => (
                    <div key={section} className="mb-4">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                {section}
                            </p>
                        )}
                        <ul className="space-y-0.5">
                            {filteredItems
                                .filter((item) => item.section === section)
                                .map((item) => {
                                    const Icon = iconMap[item.icon] || LayoutDashboard;
                                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-gray-100 text-gray-900"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                                    collapsed && "justify-center px-2"
                                                )}
                                                title={collapsed ? item.title : undefined}
                                            >
                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                                {!collapsed && <span className="truncate">{item.title}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className={cn("border-t border-gray-200 p-3", collapsed && "px-2")}>
                <div className={cn("flex items-center gap-3 mb-3", collapsed && "justify-center")}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className={cn(
                            "w-full justify-start gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {!collapsed && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={cn(
                            "w-full justify-start gap-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span>Sign out</span>}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white text-gray-900 shadow-sm border border-gray-200"
            >
                <Menu className="h-5 w-5" />
            </button>

            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-gray-900/30" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                    <X className="h-4 w-4" />
                </button>
                {sidebarContent}
            </aside>

            <aside className={cn(
                "hidden lg:flex flex-col h-screen sticky top-0 z-30",
                collapsed ? "w-16" : "w-56"
            )}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-6 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 shadow-sm border border-gray-200"
                >
                    <ChevronRight className={cn("h-3 w-3 transition-transform", collapsed ? "" : "rotate-180")} />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
}

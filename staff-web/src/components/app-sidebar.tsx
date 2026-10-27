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
        <div className="glass-navigation flex h-full flex-col border-r">
            <div className={cn("flex items-center gap-3 p-4 border-b border-border", collapsed && "justify-center px-2")}>
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-800 to-sky-400 flex-shrink-0 shadow-sm">
                    <span className="text-lg">🕌</span>
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h2 className="text-sm font-semibold text-foreground truncate leading-tight">Al-Momineen</h2>
                        <p className="text-xs text-muted-foreground truncate">Staff Portal</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {sections.map((section) => (
                    <div key={section} className="mb-4">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                                                    "flex items-center gap-3 px-3 py-2 min-h-11 rounded-xl text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-sky-100/90 text-sky-950 ring-1 ring-sky-200/60 dark:bg-sky-900/40 dark:text-sky-100"
                                                        : "text-muted-foreground hover:bg-sky-100/60 hover:text-foreground dark:hover:bg-sky-900/30",
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

            <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
                <div className={cn("flex items-center gap-3 mb-3", collapsed && "justify-center")}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-foreground text-sm font-semibold flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className={cn(
                            "w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted",
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
                            "w-full justify-start gap-2 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50",
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
                aria-label="Open navigation"
                aria-controls="mobile-navigation"
                aria-expanded={mobileOpen}
                className={cn("lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card text-foreground shadow-sm border border-border", mobileOpen && "hidden")}
            >
                <Menu className="h-5 w-5" />
            </button>

            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-primary/30" onClick={() => setMobileOpen(false)} />
            )}

            <aside id="mobile-navigation" aria-label="Mobile navigation" className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="absolute top-4 right-4 p-1.5 rounded-lg bg-muted text-muted-foreground">
                    <X className="h-4 w-4" />
                </button>
                {sidebarContent}
            </aside>

            <aside aria-label="Desktop navigation" className={cn(
                "hidden lg:flex flex-col h-screen sticky top-0 z-30",
                collapsed ? "w-16" : "w-56"
            )}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                    className="absolute -right-3 top-6 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-muted-foreground shadow-sm border border-border"
                >
                    <ChevronRight className={cn("h-3 w-3 transition-transform", collapsed ? "" : "rotate-180")} />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
}

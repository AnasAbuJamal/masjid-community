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
        <div className="flex flex-col h-full bg-white dark:bg-mocha-900 border-r border-mocha-900/10 dark:border-white/5 shadow-elegant">
            {/* Header */}
            <div className={cn("flex items-center gap-3 p-6 border-b border-mocha-900/5 dark:border-white/5", collapsed && "justify-center p-4")}>
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl mocha-gradient shadow-lg flex-shrink-0">
                    <span className="text-xl">🕌</span>
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h2 className="text-lg font-serif font-bold text-mocha-900 dark:text-cream-100 truncate leading-tight">Al-Momineen</h2>
                        <p className="text-[11px] uppercase tracking-widest text-mocha-400 dark:text-mocha-400 font-semibold truncate">Staff Portal</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                {sections.map((section) => (
                    <div key={section}>
                        {!collapsed && (
                            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-mocha-400/80 dark:text-mocha-600/80">
                                {section}
                            </p>
                        )}
                        <ul className="space-y-1.5">
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
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 group",
                                                    isActive
                                                        ? "bg-mocha-900 text-white shadow-md dark:bg-mocha-800"
                                                        : "text-mocha-600 dark:text-cream-100/70 hover:bg-cream-100 hover:text-mocha-900 dark:hover:bg-white/5 dark:hover:text-white",
                                                    collapsed && "justify-center px-2"
                                                )}
                                                title={collapsed ? item.title : undefined}
                                            >
                                                <Icon className={cn(
                                                    "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                                                    isActive ? "text-white" : "text-mocha-400 group-hover:text-mocha-600 dark:group-hover:text-white"
                                                )} />
                                                {!collapsed && (
                                                    <>
                                                        <span className="truncate">{item.title}</span>
                                                        {isActive && <ChevronRight className="ml-auto h-4 w-4 text-white/70" />}
                                                    </>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className={cn("border-t border-mocha-900/5 dark:border-white/5 p-4 bg-cream-50/50 dark:bg-black/20", collapsed && "px-2")}>
                <div className={cn("flex items-center gap-3 mb-4", collapsed && "justify-center")}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-mocha-800 text-white shadow-sm font-serif text-lg font-bold flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-mocha-900 dark:text-cream-100 truncate">{userName}</p>
                            <p className="text-xs text-mocha-400 dark:text-mocha-600 truncate">{userEmail}</p>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className={cn(
                            "w-full rounded-xl text-mocha-600 dark:text-cream-100/70 hover:text-mocha-900 hover:bg-cream-100 dark:hover:bg-white/5 dark:hover:text-white justify-start gap-3",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4 text-caramel" /> : <Moon className="h-4 w-4" />}
                        {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={cn(
                            "w-full rounded-xl text-mocha-600 dark:text-cream-100/70 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 justify-start gap-3",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && "Sign out"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-full bg-white dark:bg-mocha-900 text-mocha-900 dark:text-cream-100 shadow-elegant border border-mocha-900/10"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-mocha-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            )}

            {/* Mobile sidebar */}
            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1)",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full bg-gray-100 text-mocha-900 hover:bg-gray-200">
                    <X className="h-4 w-4" />
                </button>
                {sidebarContent}
            </aside>

            {/* Desktop sidebar */}
            <aside className={cn(
                "hidden lg:flex flex-col h-screen transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1) sticky top-0 z-30",
                collapsed ? "w-[80px]" : "w-72"
            )}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3.5 top-8 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-mocha-100 bg-white text-mocha-400 hover:text-mocha-900 shadow-md hover:scale-110 transition-all dark:bg-mocha-800 dark:border-white/10 dark:text-cream-100"
                >
                    <ChevronRight className={cn("h-4 w-4 transition-transform duration-500", collapsed ? "" : "rotate-180")} />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
}

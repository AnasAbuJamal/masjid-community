"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { navItems, type UserRole } from "@/lib/role-config";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Clock, FileText, GraduationCap, ClipboardList,
    Trophy, HardHat, HandHelping, Lightbulb, DollarSign, Heart,
    Briefcase, Users, ScrollText, Settings, LogOut, Menu, X, ChevronRight, Tv,
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

    const userRole = (session?.user as { role?: string })?.role as UserRole || "teacher";
    const userName = session?.user?.name || "User";
    const userEmail = session?.user?.email || "";

    const filteredItems = navItems.filter((item) => item.roles.includes(userRole));
    const sections = [...new Set(filteredItems.map((item) => item.section))];

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={cn("flex items-center gap-3 p-4 border-b border-gray-800", collapsed && "justify-center")}>
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25 flex-shrink-0">
                    <span className="text-xl">🕌</span>
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h2 className="text-sm font-bold text-white truncate">Al-Momineen</h2>
                        <p className="text-xs text-gray-500 truncate">Staff Portal</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {sections.map((section) => (
                    <div key={section}>
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                {section}
                            </p>
                        )}
                        <ul className="space-y-1">
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
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                                    isActive
                                                        ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                                                        : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200",
                                                    collapsed && "justify-center px-2"
                                                )}
                                                title={collapsed ? item.title : undefined}
                                            >
                                                <Icon className={cn(
                                                    "h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-110",
                                                    isActive && "text-emerald-400"
                                                )} />
                                                {!collapsed && (
                                                    <>
                                                        <span className="truncate">{item.title}</span>
                                                        {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-400" />}
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
            <div className={cn("border-t border-gray-800 p-4", collapsed && "px-2")}>
                <div className={cn("flex items-center gap-3 mb-3", collapsed && "justify-center")}>
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{userName}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={cn(
                        "w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 justify-start gap-2",
                        collapsed && "justify-center px-2"
                    )}
                >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && "Sign out"}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-gray-400 hover:text-white shadow-lg"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            )}

            {/* Mobile sidebar */}
            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
                {sidebarContent}
            </aside>

            {/* Desktop sidebar */}
            <aside className={cn(
                "hidden lg:flex flex-col h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 sticky top-0",
                collapsed ? "w-[68px]" : "w-64"
            )}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-gray-400 hover:text-white shadow-md"
                >
                    <ChevronRight className={cn("h-3 w-3 transition-transform", collapsed ? "" : "rotate-180")} />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
}

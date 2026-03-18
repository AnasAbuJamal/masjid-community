export type UserRole = "admin" | "teacher";

export interface NavItem {
    title: string;
    href: string;
    icon: string;
    roles: UserRole[];
    section: string;
}

export const roleConfig: Record<UserRole, { label: string; color: string }> = {
    admin: { label: "Admin", color: "bg-emerald-500" },
    teacher: { label: "Teacher", color: "bg-blue-500" },
};

export const navItems: NavItem[] = [
    // Main
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["admin", "teacher"], section: "Main" },
    // Content
    { title: "Prayer Times", href: "/dashboard/prayers", icon: "Clock", roles: ["admin"], section: "Content" },
    { title: "Blog / News", href: "/dashboard/blog", icon: "FileText", roles: ["admin"], section: "Content" },
    // School
    { title: "Classroom", href: "/dashboard/classroom", icon: "GraduationCap", roles: ["admin", "teacher"], section: "School" },
    { title: "Assignments", href: "/dashboard/assignments", icon: "ClipboardList", roles: ["admin", "teacher"], section: "School" },
    { title: "Gamification", href: "/dashboard/gamification", icon: "Trophy", roles: ["admin", "teacher"], section: "School" },
    // Operations
    { title: "Construction", href: "/dashboard/construction", icon: "HardHat", roles: ["admin"], section: "Operations" },
    { title: "Volunteers", href: "/dashboard/volunteers", icon: "HandHelping", roles: ["admin"], section: "Operations" },
    { title: "Proposals", href: "/dashboard/proposals", icon: "Lightbulb", roles: ["admin"], section: "Operations" },
    // Finance
    { title: "Finances", href: "/dashboard/finances", icon: "DollarSign", roles: ["admin"], section: "Finance" },
    { title: "Donations", href: "/dashboard/donations", icon: "Heart", roles: ["admin"], section: "Finance" },
    // Community
    { title: "Jobs Board", href: "/dashboard/jobs", icon: "Briefcase", roles: ["admin"], section: "Community" },
    { title: "Worker Profiles", href: "/dashboard/workers", icon: "Users", roles: ["admin"], section: "Community" },
    // Administration
    { title: "User Management", href: "/dashboard/users", icon: "Users", roles: ["admin"], section: "Administration" },
    { title: "Audit Logs", href: "/dashboard/audit-logs", icon: "ScrollText", roles: ["admin"], section: "Administration" },
    { title: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["admin"], section: "Administration" },
    { title: "Kiosk / TV", href: "/dashboard/kiosk", icon: "Tv", roles: ["admin"], section: "Administration" },
];

export function canAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
}

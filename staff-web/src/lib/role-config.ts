export type UserRole = "admin" | "teacher" | "staff" | "member" | "student";

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
    staff: { label: "Staff", color: "bg-purple-500" },
    member: { label: "Member", color: "bg-amber-500" },
    student: { label: "Student", color: "bg-cyan-500" },
};

export const navItems: NavItem[] = [
    // Main
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["admin", "teacher", "staff", "member", "student"], section: "Main" },
    { title: "Search", href: "/dashboard/search", icon: "Search", roles: ["admin"], section: "Main" },
    // Content
    { title: "Prayer Times", href: "/dashboard/prayers", icon: "Clock", roles: ["admin"], section: "Content" },
    { title: "Blog / News", href: "/dashboard/blog", icon: "FileText", roles: ["admin", "teacher", "staff"], section: "Content" },
    { title: "Media Library", href: "/dashboard/media", icon: "HardDrive", roles: ["admin", "teacher"], section: "Content" },
    // School
    { title: "Classroom", href: "/dashboard/classroom", icon: "GraduationCap", roles: ["admin", "teacher"], section: "School" },
    { title: "Student Applications", href: "/dashboard/applications", icon: "ClipboardCheck", roles: ["admin"], section: "School" },
    { title: "Attendance", href: "/dashboard/attendance", icon: "Calendar", roles: ["admin", "teacher"], section: "School" },
    { title: "Assignments", href: "/dashboard/assignments", icon: "ClipboardList", roles: ["admin", "teacher"], section: "School" },
    { title: "Gamification", href: "/dashboard/gamification", icon: "Trophy", roles: ["admin", "teacher", "student"], section: "School" },
    // Operations
    { title: "Construction", href: "/dashboard/construction", icon: "HardHat", roles: ["admin"], section: "Operations" },
    { title: "Volunteers", href: "/dashboard/volunteers", icon: "HandHelping", roles: ["admin", "member"], section: "Operations" },
    { title: "Proposals", href: "/dashboard/proposals", icon: "Lightbulb", roles: ["admin", "member"], section: "Operations" },
    { title: "Events", href: "/dashboard/events", icon: "Calendar", roles: ["admin", "teacher", "staff", "member"], section: "Operations" },
    { title: "Rentals", href: "/dashboard/rentals", icon: "Package", roles: ["admin"], section: "Operations" },
    { title: "Rental Bookings", href: "/dashboard/rentals/bookings", icon: "ClipboardList", roles: ["admin"], section: "Operations" },
    // Finance
    { title: "Finances", href: "/dashboard/finances", icon: "DollarSign", roles: ["admin"], section: "Finance" },
    { title: "Donations", href: "/dashboard/donations", icon: "Heart", roles: ["admin", "member"], section: "Finance" },
    // Community
    { title: "Jobs Board", href: "/dashboard/jobs", icon: "Briefcase", roles: ["admin", "member"], section: "Community" },
    { title: "Worker Profiles", href: "/dashboard/workers", icon: "Users", roles: ["admin", "member"], section: "Community" },
    { title: "Newsletter", href: "/dashboard/newsletter", icon: "Mail", roles: ["admin"], section: "Community" },
    { title: "Contact Messages", href: "/dashboard/contact", icon: "MessageSquare", roles: ["admin"], section: "Community" },
    // Administration
    { title: "User Management", href: "/dashboard/users", icon: "Users", roles: ["admin"], section: "Administration" },
    { title: "Audit Logs", href: "/dashboard/audit-logs", icon: "ScrollText", roles: ["admin"], section: "Administration" },
    { title: "Error Logs", href: "/dashboard/error-logs", icon: "AlertTriangle", roles: ["admin"], section: "Administration" },
    { title: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["admin"], section: "Administration" },
    { title: "Kiosk / TV", href: "/dashboard/kiosk", icon: "Tv", roles: ["admin"], section: "Administration" },
];

export function canAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
}

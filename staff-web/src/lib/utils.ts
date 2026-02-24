import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function generateStudentId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 900) + 100;
    return `STU-${year}-${random}`;
}

export function getAttendanceColor(status: string): string {
    const colors: Record<string, string> = {
        excellent: "text-green-500",
        very_good: "text-blue-500",
        good: "text-yellow-500",
        needs_improvement: "text-orange-500",
        poor: "text-red-500",
    };
    return colors[status] || "text-gray-500";
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        active: "bg-green-100 text-green-800",
        completed: "bg-blue-100 text-blue-800",
        in_progress: "bg-purple-100 text-purple-800",
        under_review: "bg-indigo-100 text-indigo-800",
        needs_revision: "bg-orange-100 text-orange-800",
        declined: "bg-red-100 text-red-800",
        on_hold: "bg-gray-100 text-gray-800",
        draft: "bg-gray-100 text-gray-800",
        published: "bg-green-100 text-green-800",
        archived: "bg-gray-100 text-gray-600",
        open: "bg-green-100 text-green-800",
        closed: "bg-red-100 text-red-800",
        pending_review: "bg-yellow-100 text-yellow-800",
        paused: "bg-gray-100 text-gray-800",
        expired: "bg-red-100 text-red-800",
        submitted: "bg-blue-100 text-blue-800",
        reviewed: "bg-indigo-100 text-indigo-800",
        shortlisted: "bg-purple-100 text-purple-800",
        hired: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
}

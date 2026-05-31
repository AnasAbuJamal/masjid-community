"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, UserCheck, Users, BookOpen,
  Image, Calendar, Lightbulb, Settings, ArrowRight, Building2, HandHeart, Briefcase, FileText,
} from "lucide-react";
import Link from "next/link";

interface MonthlyData {
  month: string;
  donations: number;
  expenses: number;
}

interface DonationData {
  id: number;
  donorName: string | null;
  amount: number;
  createdAt: string;
  status: string;
}

export function DonationChart({ data }: { data: MonthlyData[] }) {
  return (
    <Card className="col-span-2 border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5E3C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Area
                type="monotone"
                dataKey="donations"
                stroke="#8B5E3C"
                fill="url(#donationGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DonationBarChart({ data }: { data: MonthlyData[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Monthly Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="donations" fill="#6F4E37" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#B33A3A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentDonations({ donations }: { donations: DonationData[] }) {
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Donations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-mocha-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-mocha-600" />
              <span className="text-sm font-medium">Last 5 donations</span>
            </div>
            <span className="text-lg font-bold text-mocha-700">${(total / 100).toFixed(2)}</span>
          </div>
          {donations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No donations yet</p>
          ) : (
            <div className="space-y-2">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-mocha-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-mocha-700">
                        {donation.donorName?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {donation.donorName || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    +${(donation.amount / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const iconMap: Record<string, React.ElementType> = {
  Users, BookOpen, FileText, Building2, HandHeart, Lightbulb, Briefcase, UserCheck, DollarSign,
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  trend?: number;
  color: "mocha" | "blue" | "green" | "amber" | "purple" | "pink" | "cyan" | "indigo";
  format?: "number" | "currency";
}

const colorMap: Record<string, { bg: string; text: string; iconBg: string; gradient: string }> = {
  mocha: { bg: "bg-mocha-50", text: "text-mocha-700", iconBg: "bg-mocha-100", gradient: "from-mocha-500/10 to-mocha-500/5" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100", gradient: "from-blue-500/10 to-blue-500/5" },
  green: { bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100", gradient: "from-green-500/10 to-green-500/5" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100", gradient: "from-amber-500/10 to-amber-500/5" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", iconBg: "bg-purple-100", gradient: "from-purple-500/10 to-purple-500/5" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", iconBg: "bg-pink-100", gradient: "from-pink-500/10 to-pink-500/5" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", iconBg: "bg-cyan-100", gradient: "from-cyan-500/10 to-cyan-500/5" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", iconBg: "bg-indigo-100", gradient: "from-indigo-500/10 to-indigo-500/5" },
};

export function StatCard({ label, value, icon, trend, color, format }: StatCardProps) {
  const colors = colorMap[color];
  const Icon = iconMap[icon];
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`} />
      <CardContent className="p-5 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${colors.text}`}>
              {format === "currency" ? `$${(value / 100).toLocaleString()}` : value.toLocaleString()}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {trend >= 0 ? "+" : ""}{trend}%
                </span>
                <span className="text-xs text-gray-400 ml-1">vs last month</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
            {Icon && <Icon className={`h-6 w-6 ${colors.text}`} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const quickActions = [
  { label: "Attendance", href: "/dashboard/attendance", icon: UserCheck, bg: "bg-blue-100", iconColor: "text-blue-600" },
  { label: "Students", href: "/dashboard/students", icon: Users, bg: "bg-green-100", iconColor: "text-green-600" },
  { label: "Classes", href: "/dashboard/classes", icon: BookOpen, bg: "bg-purple-100", iconColor: "text-purple-600" },
  { label: "Donations", href: "/dashboard/donations", icon: DollarSign, bg: "bg-amber-100", iconColor: "text-amber-600" },
  { label: "Media", href: "/dashboard/media", icon: Image, bg: "bg-pink-100", iconColor: "text-pink-600" },
  { label: "Events", href: "/dashboard/events", icon: Calendar, bg: "bg-cyan-100", iconColor: "text-cyan-600" },
  { label: "Proposals", href: "/dashboard/proposals", icon: Lightbulb, bg: "bg-orange-100", iconColor: "text-orange-600" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, bg: "bg-indigo-100", iconColor: "text-indigo-600" },
];

export function QuickActions() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  info: Lightbulb,
  success: TrendingUp,
  warning: TrendingDown,
  donation: DollarSign,
  attendance: UserCheck,
  assignment: BookOpen,
};

export function ActivityFeed({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Link
          href="/dashboard/notifications"
          className="text-xs text-mocha-600 hover:text-mocha-700 flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Lightbulb className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.slice(0, 6).map((n) => {
              const Icon = typeIcons[n.type] || Lightbulb;
              const typeColor: Record<string, string> = {
                info: "bg-blue-100 text-blue-600",
                success: "bg-green-100 text-green-600",
                warning: "bg-amber-100 text-amber-600",
                donation: "bg-mocha-100 text-mocha-600",
                attendance: "bg-purple-100 text-purple-600",
              };
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-mocha-50/50" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full ${typeColor[n.type] || "bg-gray-100 text-gray-600"} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-mocha-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

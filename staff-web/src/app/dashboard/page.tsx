import prisma from "@/lib/prisma";
import { Users, BookOpen, FileText, Building2, HandHeart, Lightbulb, Briefcase, UserCheck } from "lucide-react";
import { DonationChart, DonationBarChart, RecentDonations, StatCard, QuickActions, ActivityFeed } from "./dashboard-charts";

interface MonthlyData {
  month: string;
  donations: number;
  expenses: number;
}

async function getStats() {
  try {
    const [
      totalStudents, activeClasses, publishedPosts, constructionProjects,
      pendingVolunteers, pendingProposals, activeJobs, approvedWorkers,
      totalDonations, recentDonations, allDonations, notifications,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.class.count(),
      prisma.blogPost.count({ where: { status: "published" } }),
      prisma.constructionProject.count(),
      prisma.volunteerApplication.count({ where: { status: "pending" } }),
      prisma.projectProposal.count({ where: { status: "pending" } }),
      prisma.jobPosting.count({ where: { status: "active" } }),
      prisma.workerProfile.count({ where: { status: "approved" } }),
      prisma.donation.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      prisma.donation.findMany({ where: { status: "completed" }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.donation.findMany({ where: { status: "completed" }, orderBy: { createdAt: "asc" } }),
      prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { firstName: true, lastName: true } } } }),
    ]);

    const monthlyMap: Record<string, MonthlyData> = {};
    allDonations.forEach((d) => {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        const monthName = date.toLocaleString("default", { month: "short" });
        monthlyMap[key] = { month: `${monthName} ${date.getFullYear()}`, donations: 0, expenses: 0 };
      }
      monthlyMap[key].donations += d.amount;
    });
    const monthlyData = Object.values(monthlyMap).slice(-6);

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [thisMonthTotal, lastMonthTotal] = await Promise.all([
      prisma.donation.aggregate({ where: { status: "completed", createdAt: { gte: thisMonthStart } }, _sum: { amount: true } }),
      prisma.donation.aggregate({ where: { status: "completed", createdAt: { gte: lastMonth, lt: thisMonthStart } }, _sum: { amount: true } }),
    ]);

    const thisAmt = thisMonthTotal._sum.amount || 0;
    const lastAmt = lastMonthTotal._sum.amount || 0;
    const donationTrend = lastAmt > 0 ? Math.round(((thisAmt - lastAmt) / lastAmt) * 100) : 0;

    return {
      totalStudents, activeClasses, publishedPosts, constructionProjects,
      pendingVolunteers, pendingProposals, activeJobs, approvedWorkers,
      totalDonated: totalDonations._sum.amount || 0,
      recentDonations, monthlyData, donationTrend, notifications,
    };
  } catch {
    return {
      totalStudents: 0, activeClasses: 0, publishedPosts: 0, constructionProjects: 0,
      pendingVolunteers: 0, pendingProposals: 0, activeJobs: 0, approvedWorkers: 0,
      totalDonated: 0, recentDonations: [], monthlyData: [], donationTrend: 0, notifications: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your masjid operations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="text-xl font-bold text-mocha-700">${(stats.totalDonated / 100).toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-mocha-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-mocha-600" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Students" value={stats.totalStudents} icon={Users} color="mocha" trend={0} />
        <StatCard label="Classes" value={stats.activeClasses} icon={BookOpen} color="blue" />
        <StatCard label="Published Posts" value={stats.publishedPosts} icon={FileText} color="green" />
        <StatCard label="Projects" value={stats.constructionProjects} icon={Building2} color="amber" />
        <StatCard label="Volunteers" value={stats.pendingVolunteers} icon={HandHeart} color="purple" />
        <StatCard label="Proposals" value={stats.pendingProposals} icon={Lightbulb} color="pink" />
        <StatCard label="Job Listings" value={stats.activeJobs} icon={Briefcase} color="cyan" />
        <StatCard label="Approved Workers" value={stats.approvedWorkers} icon={UserCheck} color="indigo" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonationChart data={stats.monthlyData} />
        <RecentDonations donations={stats.recentDonations} />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        <ActivityFeed notifications={stats.notifications} />
        <DonationBarChart data={stats.monthlyData} />
      </div>
    </div>
  );
}

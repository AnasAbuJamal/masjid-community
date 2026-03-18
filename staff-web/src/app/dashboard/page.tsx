import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

async function getStats() {
    try {
        const [
            totalStudents, activeClasses, publishedPosts, constructionProjects,
            pendingVolunteers, pendingProposals, activeJobs, approvedWorkers,
            totalDonations, recentDonations
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
        ]);

        return {
            totalStudents, activeClasses, publishedPosts, constructionProjects,
            pendingVolunteers, pendingProposals, activeJobs, approvedWorkers,
            totalDonated: totalDonations._sum.amount || 0,
            recentDonations,
        };
    } catch {
        return {
            totalStudents: 0, activeClasses: 0, publishedPosts: 0, constructionProjects: 0,
            pendingVolunteers: 0, pendingProposals: 0, activeJobs: 0, approvedWorkers: 0,
            totalDonated: 0, recentDonations: [],
        };
    }
}

const statCards = [
    { key: "totalStudents", label: "Active Students", icon: "🎓", color: "from-stone-500 to-stone-600 text-white" },
    { key: "activeClasses", label: "Classes", icon: "📚", color: "from-orange-800 to-orange-900 text-white" },
    { key: "publishedPosts", label: "Published Posts", icon: "📝", color: "from-rose-800 to-rose-900 text-white" },
    { key: "constructionProjects", label: "Construction Projects", icon: "🏗️", color: "from-orange-400 to-orange-500 text-white" },
    { key: "pendingVolunteers", label: "Pending Applications", icon: "🤝", color: "from-teal-700 to-teal-800 text-white" },
    { key: "pendingProposals", label: "Pending Proposals", icon: "💡", color: "from-amber-600 to-amber-700 text-white" },
    { key: "activeJobs", label: "Active Jobs", icon: "💼", color: "from-zinc-600 to-zinc-700 text-white" },
    { key: "approvedWorkers", label: "Workers", icon: "👷", color: "mocha-gradient" },
];

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="border-b border-mocha-900/10 pb-6 dark:border-white/10">
                <h1 className="text-4xl font-serif font-medium text-mocha-900 dark:text-cream-100 tracking-tight">Dashboard Overview</h1>
                <p className="text-mocha-600 dark:text-cream-100/60 mt-2 text-sm tracking-wide">
                    Welcome back! Here's a high-level view of your masjid operations.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <Card key={card.key} className={`animate-fade-in stagger-${i + 1} glass shadow-elegant dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border-white/40 dark:border-white/5`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-mocha-600/70 dark:text-cream-100/60">{card.label}</p>
                                    <p className="text-3xl font-serif font-medium text-mocha-900 dark:text-white mt-1.5">
                                        {(stats as Record<string, unknown>)[card.key] as number}
                                    </p>
                                </div>
                                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg text-2xl`}>
                                    {card.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Total Donations */}
                <Card className="animate-fade-in glass shadow-elegant dark:shadow-elegant-dark border-white/40 dark:border-white/5">
                    <CardHeader className="border-b border-mocha-900/5 dark:border-white/5 pb-4">
                        <CardTitle className="flex items-center gap-3 font-serif font-medium text-mocha-900 dark:text-white">
                            <span className="text-2xl">💰</span>
                            Total Contributions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-5xl font-serif font-medium mocha-text-gradient dark:text-caramel">{formatCurrency(stats.totalDonated / 100)}</p>
                        <p className="text-sm font-medium text-mocha-600/70 dark:text-cream-100/60 mt-3 uppercase tracking-wider">Total collected via Stripe</p>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="animate-fade-in glass shadow-elegant dark:shadow-elegant-dark border-white/40 dark:border-white/5">
                    <CardHeader className="border-b border-mocha-900/5 dark:border-white/5 pb-4">
                        <CardTitle className="flex items-center gap-3 font-serif font-medium text-mocha-900 dark:text-white">
                            <span className="text-2xl">📊</span>
                            Pending Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-mocha-900/5 dark:border-white/5 last:border-0 rounded flex-wrap gap-2">
                                <span className="text-sm font-medium text-mocha-600 dark:text-cream-100/80">Volunteer Applications</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">{stats.pendingVolunteers} action needed</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-mocha-900/5 dark:border-white/5 last:border-0 rounded flex-wrap gap-2">
                                <span className="text-sm font-medium text-mocha-600 dark:text-cream-100/80">Project Proposals</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{stats.pendingProposals} action needed</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-mocha-900/5 dark:border-white/5 last:border-0 rounded flex-wrap gap-2">
                                <span className="text-sm font-medium text-mocha-600 dark:text-cream-100/80">Active Job Postings</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">{stats.activeJobs} listings</span>
                            </div>
                            <div className="flex items-center justify-between py-2 rounded flex-wrap gap-2">
                                <span className="text-sm font-medium text-mocha-600 dark:text-cream-100/80">Approved Worker Profiles</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold mocha-gradient text-white">{stats.approvedWorkers} active</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

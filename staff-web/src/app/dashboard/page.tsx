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
    { key: "totalStudents", label: "Active Students", icon: "🎓", color: "from-blue-500 to-blue-600" },
    { key: "activeClasses", label: "Classes", icon: "📚", color: "from-purple-500 to-purple-600" },
    { key: "publishedPosts", label: "Published Posts", icon: "📝", color: "from-pink-500 to-pink-600" },
    { key: "constructionProjects", label: "Construction Projects", icon: "🏗️", color: "from-orange-500 to-orange-600" },
    { key: "pendingVolunteers", label: "Pending Applications", icon: "🤝", color: "from-teal-500 to-teal-600" },
    { key: "pendingProposals", label: "Pending Proposals", icon: "💡", color: "from-yellow-500 to-yellow-600" },
    { key: "activeJobs", label: "Active Jobs", icon: "💼", color: "from-indigo-500 to-indigo-600" },
    { key: "approvedWorkers", label: "Workers", icon: "👷", color: "from-emerald-500 to-emerald-600" },
];

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Welcome back! Here&apos;s an overview of your masjid operations.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <Card key={card.key} className={`animate-fade-in stagger-${i + 1} overflow-hidden`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {(stats as Record<string, unknown>)[card.key] as number}
                                    </p>
                                </div>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} shadow-lg text-xl`}>
                                    {card.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Donations */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-xl">💰</span>
                            Total Donations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold gradient-text">{formatCurrency(stats.totalDonated / 100)}</p>
                        <p className="text-sm text-gray-500 mt-2">Total collected via Stripe</p>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-xl">📊</span>
                            Quick Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Volunteers</span>
                                <span className="font-semibold text-orange-600">{stats.pendingVolunteers}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Proposals</span>
                                <span className="font-semibold text-yellow-600">{stats.pendingProposals}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Active Job Listings</span>
                                <span className="font-semibold text-indigo-600">{stats.activeJobs}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Worker Profiles</span>
                                <span className="font-semibold text-emerald-600">{stats.approvedWorkers}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

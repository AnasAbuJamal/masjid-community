import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, BookOpen, FileText, Building2, HandHeart, Lightbulb, Briefcase, UserCheck, DollarSign, Clock } from "lucide-react";

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
    { key: "totalStudents", label: "Active Students", icon: Users, bg: "bg-blue-50", text: "text-blue-600" },
    { key: "activeClasses", label: "Classes", icon: BookOpen, bg: "bg-green-50", text: "text-green-600" },
    { key: "publishedPosts", label: "Published Posts", icon: FileText, bg: "bg-purple-50", text: "text-purple-600" },
    { key: "constructionProjects", label: "Projects", icon: Building2, bg: "bg-amber-50", text: "text-amber-600" },
    { key: "pendingVolunteers", label: "Volunteers", icon: HandHeart, bg: "bg-pink-50", text: "text-pink-600" },
    { key: "pendingProposals", label: "Proposals", icon: Lightbulb, bg: "bg-orange-50", text: "text-orange-600" },
    { key: "activeJobs", label: "Job Listings", icon: Briefcase, bg: "bg-cyan-50", text: "text-cyan-600" },
    { key: "approvedWorkers", label: "Workers", icon: UserCheck, bg: "bg-indigo-50", text: "text-indigo-600" },
];

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Overview of your mosque operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Card key={card.key} className="bg-white rounded-xl border border-gray-200">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        {(stats as Record<string, unknown>)[card.key] as number}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${card.bg}`}>
                                    <card.icon className={`w-5 h-5 ${card.text}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white rounded-xl border border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Total Contributions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-semibold text-gray-900">${(stats.totalDonated / 100).toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2">Total collected via Stripe</p>
                    </CardContent>
                </Card>

                <Card className="bg-white rounded-xl border border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Pending Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <span className="text-sm font-medium text-gray-700">Volunteer Applications</span>
                                <span className="badge-warning">{stats.pendingVolunteers} pending</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <span className="text-sm font-medium text-gray-700">Project Proposals</span>
                                <span className="badge-warning">{stats.pendingProposals} pending</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <span className="text-sm font-medium text-gray-700">Active Job Postings</span>
                                <span className="badge-info">{stats.activeJobs} listings</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <span className="text-sm font-medium text-gray-700">Approved Workers</span>
                                <span className="badge-success">{stats.approvedWorkers} active</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

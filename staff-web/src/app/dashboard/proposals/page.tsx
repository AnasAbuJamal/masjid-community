import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Calendar, DollarSign, Users } from "lucide-react";

async function getProposals() {
  try {
    const proposals = await prisma.projectProposal.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 30,
    });
    return proposals;
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  under_review: "bg-blue-100 text-blue-700",
  needs_revision: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  on_hold: "bg-yellow-100 text-yellow-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default async function ProposalsPage() {
  const proposals = await getProposals();
  const pendingCount = proposals.filter((p) => p.status === "pending").length;
  const inProgressCount = proposals.filter((p) => p.status === "in_progress").length;
  const totalBudget = proposals.reduce((acc, p) => acc + p.totalBudget, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
        <p className="text-gray-500 mt-1">Community project proposals and tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Proposals</p>
                <p className="text-3xl font-bold">{proposals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-3xl font-bold text-purple-600">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-3xl font-bold text-green-600">${totalBudget.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No proposals found.</p>
            ) : (
              proposals.map((proposal) => (
                <div key={proposal.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{proposal.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        by {proposal.submitterName} • {proposal.category}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={priorityColors[proposal.priority]}>{proposal.priority}</Badge>
                      <Badge className={statusColors[proposal.status]}>{proposal.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${proposal.totalBudget.toLocaleString()}
                    </span>
                    {proposal.startDate && proposal.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(proposal.startDate).toLocaleDateString()} - {new Date(proposal.endDate).toLocaleDateString()}
                      </span>
                    )}
                    {proposal.volunteersNeeded && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {proposal.volunteersNeeded} volunteers needed
                      </span>
                    )}
                  </div>
                  {proposal.status === "approved" || proposal.status === "in_progress" ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{proposal.completionPercent || 0}%</span>
                      </div>
                      <Progress value={proposal.completionPercent || 0} className="h-2" />
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

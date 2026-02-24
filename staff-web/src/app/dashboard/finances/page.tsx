import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

async function getFinancials() {
  try {
    const [records, summary, donations] = await Promise.all([
      prisma.financialRecord.findMany({ orderBy: { year: "desc", month: "desc" }, take: 12 }),
      prisma.financialSummary.findFirst({ orderBy: { lastUpdated: "desc" } }),
      prisma.donation.aggregate({
        where: { status: "completed", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { amount: true },
      }),
    ]);
    return { records, summary, monthlyDonations: donations._sum.amount || 0 };
  } catch {
    return { records: [], summary: null, monthlyDonations: 0 };
  }
}

export default async function FinancesPage() {
  const { records, summary, monthlyDonations } = await getFinancials();
  const totalDonations = records.reduce((acc, r) => acc + r.donations, 0);
  const totalExpenses = records.reduce((acc, r) => acc + r.expenses, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
        <p className="text-gray-500 mt-1">Track donations and expenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bank Balance</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(summary?.bankBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${(monthlyDonations / 100).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Donations</p>
                <p className="text-3xl font-bold text-emerald-600">
                  ${(totalDonations / 100).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600">
                  ${(totalExpenses / 100).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Raised</p>
                <p className="text-2xl font-bold text-green-600">${(summary.totalRaised / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">${(summary.totalSpent / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Goal</p>
                <p className="text-2xl font-bold text-blue-600">${(summary.totalGoal / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-2xl font-bold text-orange-600">${(summary.remainingNeeded / 100).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No financial records found.</p>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{record.month} {record.year}</p>
                    {record.notes && <p className="text-sm text-gray-500">{record.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-green-600">+${(record.donations / 100).toLocaleString()}</p>
                    <p className="text-red-600">-${(record.expenses / 100).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

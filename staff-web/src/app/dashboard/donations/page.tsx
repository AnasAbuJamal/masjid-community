import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Heart, DollarSign, Users, TrendingUp, Calendar, CreditCard } from "lucide-react";

async function getDonations() {
  try {
    const [donations, stats] = await Promise.all([
      prisma.donation.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.donation.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      }),
    ]);
    return { donations, totalRaised: stats._sum.amount || 0 };
  } catch {
    return { donations: [], totalRaised: 0 };
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const campaignLabels: Record<string, string> = {
  general: "General Fund",
  construction: "Construction",
  ramadan: "Ramadan",
  education: "Education",
  zat: "Zakat",
  sadaqah: "Sadaqah",
};

export default async function DonationsPage() {
  const { donations, totalRaised } = await getDonations();
  const thisMonth = donations.filter(
    (d) => d.status === "completed" && d.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const thisMonthTotal = thisMonth.reduce((acc, d) => acc + d.amount, 0);
  const recurringCount = donations.filter((d) => d.isRecurring && d.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
        <p className="text-gray-500 mt-1">Track donations via Stripe</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Raised</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(totalRaised / 100).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600" />
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
                  ${(thisMonthTotal / 100).toLocaleString()}
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
                <p className="text-3xl font-bold">{donations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recurring Donors</p>
                <p className="text-3xl font-bold text-emerald-600">{recurringCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No donations found.
                  </TableCell>
                </TableRow>
              ) : (
                donations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium">
                      {donation.isAnonymous ? "Anonymous" : donation.donorName || "Unknown"}
                      {donation.donorEmail && (
                        <p className="text-xs text-gray-500">{donation.donorEmail}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${(donation.amount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {campaignLabels[donation.campaign || "general"] || donation.campaign || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {donation.isRecurring ? "Monthly" : "One-time"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[donation.status]}>{donation.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {donation.createdAt.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

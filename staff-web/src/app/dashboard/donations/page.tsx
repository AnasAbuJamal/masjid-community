"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Heart, DollarSign, TrendingUp, CreditCard, Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Donation {
  id: string; stripeSessionId: string; stripePaymentId?: string;
  donorName?: string; donorEmail?: string; amount: number; currency: string;
  status: string; isRecurring: boolean; campaign?: string; isAnonymous: boolean;
  receiptUrl?: string; createdAt: string;
}

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700", refunded: "bg-gray-100 text-gray-700" };
const campaignLabels: Record<string, string> = { general: "General Fund", construction: "Construction", ramadan: "Ramadan", education: "Education", zakat: "Zakat", sadaqah: "Sadaqah" };

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDonation, setDetailDonation] = useState<Donation | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/donations");
      const data = await res.json();
      setDonations(data.donations || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = statusFilter === "all" ? donations : donations.filter((d) => d.status === statusFilter);
  const totalRaised = donations.filter((d) => d.status === "completed").reduce((acc, d) => acc + d.amount, 0);
  const thisMonth = donations.filter((d) => d.status === "completed" && new Date(d.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const thisMonthTotal = thisMonth.reduce((acc, d) => acc + d.amount, 0);
  const recurringCount = donations.filter((d) => d.isRecurring && d.status === "completed").length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Donations</h1><p className="text-gray-500 mt-1">Track donations via Stripe</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Raised</p><p className="text-3xl font-bold text-green-600">${(totalRaised / 100).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Heart className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">This Month</p><p className="text-3xl font-bold text-blue-600">${(thisMonthTotal / 100).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Donations</p><p className="text-3xl font-bold">{donations.length}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Recurring Donors</p><p className="text-3xl font-bold text-emerald-600">{recurringCount}</p></div><div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"><CreditCard className="h-6 w-6 text-emerald-600" /></div></div></CardContent></Card>
      </div>

      <div className="flex gap-2">
        {["all", "completed", "pending", "failed", "refunded"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "bg-emerald-600" : ""}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Donations</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Donor</TableHead><TableHead>Amount</TableHead><TableHead>Campaign</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No donations found.</TableCell></TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.isAnonymous ? "Anonymous" : d.donorName || "Unknown"}{d.donorEmail && <p className="text-xs text-gray-500">{d.donorEmail}</p>}</TableCell>
                    <TableCell className="font-semibold">${(d.amount / 100).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{campaignLabels[d.campaign || "general"] || d.campaign || "General"}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{d.isRecurring ? "Monthly" : "One-time"}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[d.status]}>{d.status}</Badge></TableCell>
                    <TableCell className="text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => setDetailDonation(d)}><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailDonation} onOpenChange={() => setDetailDonation(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Donation Details</DialogTitle></DialogHeader>
          {detailDonation && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Donor</p><p className="font-medium">{detailDonation.isAnonymous ? "Anonymous" : detailDonation.donorName || "Unknown"}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p>{detailDonation.donorEmail || "N/A"}</p></div>
                <div><p className="text-sm text-gray-500">Amount</p><p className="text-xl font-bold text-green-600">${(detailDonation.amount / 100).toLocaleString()}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><Badge className={statusColors[detailDonation.status]}>{detailDonation.status}</Badge></div>
                <div><p className="text-sm text-gray-500">Campaign</p><p>{campaignLabels[detailDonation.campaign || "general"] || "General"}</p></div>
                <div><p className="text-sm text-gray-500">Type</p><p>{detailDonation.isRecurring ? "Monthly Recurring" : "One-time"}</p></div>
                <div><p className="text-sm text-gray-500">Stripe Session</p><p className="font-mono text-xs">{detailDonation.stripeSessionId}</p></div>
                <div><p className="text-sm text-gray-500">Date</p><p>{new Date(detailDonation.createdAt).toLocaleString()}</p></div>
              </div>
              {detailDonation.receiptUrl && (
                <a href={detailDonation.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-sm">View Receipt →</a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Mail, User, CheckCircle, XCircle, Trash2, Download, RefreshCw,
  Search, Users, UserMinus,
} from "lucide-react";

interface Subscription {
  id: string;
  email: string;
  firstName: string | null;
  isActive: boolean;
  subscribedAt: string;
  source: string | null;
}

export default function NewsletterPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      
      const res = await fetch(`/api/newsletter?${params}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0 });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const handleUnsubscribe = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;
    try {
      await fetch(`/api/newsletter?id=${id}`, { method: "DELETE" });
      fetchSubscriptions();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const exportCSV = () => {
    const headers = ["Email", "First Name", "Status", "Subscribed At", "Source"];
    const rows = subscriptions.map((s) => [
      s.email,
      s.firstName || "",
      s.isActive ? "Active" : "Inactive",
      new Date(s.subscribedAt).toLocaleDateString(),
      s.source || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscriptions</h1>
          <p className="text-gray-500 mt-1">Manage email subscribers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Subscribers</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unsubscribed</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <UserMinus className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>All Subscribers</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                  onKeyDown={(e) => e.key === "Enter" && fetchSubscriptions()}
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "active" | "inactive")}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-mocha-600" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No subscribers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      <a href={`mailto:${sub.email}`} className="hover:text-blue-600">
                        {sub.email}
                      </a>
                    </TableCell>
                    <TableCell>{sub.firstName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={sub.isActive ? "default" : "secondary"}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(sub.subscribedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {sub.source || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnsubscribe(sub.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Subscribers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-500">
              Export {stats.total} subscriber{stats.total !== 1 ? "s" : ""} to CSV file.
            </p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                The export will include: Email, Name, Status, Subscribed Date, and Source.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { exportCSV(); setExportDialogOpen(false); }}>
              <Download className="h-4 w-4 mr-2" />Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Mail, Phone, User, Clock, CheckCircle, RefreshCw, Search,
  MessageSquare, AlertCircle, XCircle,
} from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

export default function ContactPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [filter, setFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      
      const res = await fetch(`/api/contact?${params}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setStats(data.stats || { pending: 0, in_progress: 0, resolved: 0, closed: 0 });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const openDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setNotes(submission.notes || "");
  };

  const updateStatus = async (status: string) => {
    if (!selectedSubmission) return;
    setSaving(true);
    try {
      await fetch(`/api/contact/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-500 mt-1">Manage contact form messages</p>
        </div>
        <Button variant="outline" onClick={fetchSubmissions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={filter === "pending" ? "ring-2 ring-yellow-500" : ""}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter(filter === "pending" ? "all" : "pending")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={filter === "in_progress" ? "ring-2 ring-blue-500" : ""}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter(filter === "in_progress" ? "all" : "in_progress")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={filter === "resolved" ? "ring-2 ring-green-500" : ""}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter(filter === "resolved" ? "all" : "resolved")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
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
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-3xl font-bold text-gray-600">
                  {stats.pending + stats.in_progress + stats.resolved + stats.closed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Messages</CardTitle>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-mocha-600" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No submissions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => {
                  const config = statusConfig[sub.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${sub.email}`} className="hover:text-blue-600">
                          {sub.email}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{sub.subject}</TableCell>
                      <TableCell>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(sub)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">From</Label>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />{selectedSubmission.name}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedSubmission.email}`}>{selectedSubmission.email}</a>
                  </p>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <Label className="text-gray-500">Phone</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />{selectedSubmission.phone}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500">Received</Label>
                  <p className="font-medium">
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Subject</Label>
                <p className="font-medium">{selectedSubmission.subject}</p>
              </div>

              <div>
                <Label className="text-gray-500">Message</Label>
                <div className="p-3 bg-gray-50 rounded-lg mt-1">
                  <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this submission..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Update Status</Label>
                <div className="flex gap-2 mt-2">
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const StatusIcon = config.icon;
                    return (
                      <Button
                        key={key}
                        variant={selectedSubmission.status === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(key)}
                        disabled={saving || selectedSubmission.status === key}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium ${className || ""}`}>{children}</p>;
}

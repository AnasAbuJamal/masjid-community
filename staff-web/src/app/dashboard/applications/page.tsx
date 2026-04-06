"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Check, X, Eye, Clock } from "lucide-react";

interface StudentApplication {
  id: string;
  studentName: string;
  dateOfBirth: string;
  gradeLevel: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  programName: string;
  notes: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const gradeLevels = ["Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"];

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [detailApp, setDetailApp] = useState<StudentApplication | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchApplications(); }, [filter]);

  const fetchApplications = async () => {
    try {
      const url = filter === "all" ? "/api/students" : `/api/students?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleReview = (app: StudentApplication, action: "approve" | "reject") => {
    setDetailApp(app);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialog(true);
  };

  const submitReview = async () => {
    if (!detailApp || !reviewAction) return;
    setSaving(true);
    try {
      await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detailApp.id, action: reviewAction, notes: reviewNotes }),
      });
      setReviewDialog(false);
      fetchApplications();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Applications</h1>
          <p className="text-gray-500 mt-1">Manage student enrollment applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Applications</p><p className="text-3xl font-bold">{applications.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><GraduationCap className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending</p><p className="text-3xl font-bold text-yellow-600">{pendingCount}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Approved</p><p className="text-3xl font-bold text-green-600">{approvedCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Check className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Rejected</p><p className="text-3xl font-bold text-red-600">{rejectedCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><X className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Applications</CardTitle>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No applications found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.studentName}</TableCell>
                    <TableCell>{app.gradeLevel}</TableCell>
                    <TableCell>{app.programName}</TableCell>
                    <TableCell>
                      <div>{app.parentName}</div>
                      <div className="text-xs text-gray-500">{app.parentEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status]}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setDetailApp(app)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {app.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleReview(app, "approve")}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleReview(app, "reject")}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailApp && !reviewDialog} onOpenChange={(open) => !open && setDetailApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Student Name</p><p className="font-medium">{detailApp.studentName}</p></div>
                <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium">{new Date(detailApp.dateOfBirth).toLocaleDateString()}</p></div>
                <div><p className="text-sm text-gray-500">Grade Level</p><p className="font-medium">{detailApp.gradeLevel}</p></div>
                <div><p className="text-sm text-gray-500">Program</p><p className="font-medium">{detailApp.programName}</p></div>
                <div><p className="text-sm text-gray-500">Parent Name</p><p className="font-medium">{detailApp.parentName}</p></div>
                <div><p className="text-sm text-gray-500">Parent Email</p><p className="font-medium">{detailApp.parentEmail}</p></div>
                <div><p className="text-sm text-gray-500">Parent Phone</p><p className="font-medium">{detailApp.parentPhone}</p></div>
                {detailApp.notes && <div className="col-span-2"><p className="text-sm text-gray-500">Notes</p><p className="font-medium">{detailApp.notes}</p></div>}
              </div>
              {detailApp.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleReview(detailApp, "approve")}>
                    <Check className="h-4 w-4 mr-2" />Approve
                  </Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleReview(detailApp, "reject")}>
                    <X className="h-4 w-4 mr-2" />Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialog} onOpenChange={(open) => !open && setReviewDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === "approve" ? "Approve" : "Reject"} Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to {reviewAction} the application for <strong>{detailApp?.studentName}</strong>?</p>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add any notes about this decision..." className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReviewDialog(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={submitReview} disabled={saving}>
                {saving ? "Saving..." : reviewAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
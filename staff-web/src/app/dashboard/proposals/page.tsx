"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Lightbulb, Calendar, DollarSign, Users, Pencil, Eye } from "lucide-react";

interface Proposal {
  id: string; title: string; summary: string; description: string; category: string;
  submitterName: string; submitterEmail: string; submitterPhone?: string;
  totalBudget: number; status: string; priority: string;
  startDate?: string; endDate?: string; volunteersNeeded?: number;
  completionPercent?: number; adminNotes?: string; rejectionReason?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700", under_review: "bg-blue-100 text-blue-700",
  needs_revision: "bg-orange-100 text-orange-700", approved: "bg-green-100 text-green-700",
  in_progress: "bg-purple-100 text-purple-700", completed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700", on_hold: "bg-yellow-100 text-yellow-700",
};
const priorityColors: Record<string, string> = { low: "bg-gray-100 text-gray-700", normal: "bg-blue-100 text-blue-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" };

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "", priority: "", adminNotes: "", rejectionReason: "", completionPercent: 0 });
  const [saving, setSaving] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/proposals");
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openReview = (p: Proposal) => {
    setSelected(p);
    setReviewForm({ status: p.status, priority: p.priority, adminNotes: p.adminNotes || "", rejectionReason: p.rejectionReason || "", completionPercent: p.completionPercent || 0 });
    setReviewDialog(true);
  };

  const openDetail = (p: Proposal) => { setSelected(p); setDetailDialog(true); };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/proposals/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reviewForm) });
      setReviewDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const pendingCount = proposals.filter((p) => p.status === "pending").length;
  const inProgressCount = proposals.filter((p) => p.status === "in_progress").length;
  const totalBudget = proposals.reduce((acc, p) => acc + p.totalBudget, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
        <p className="text-gray-500 mt-1">Community project proposals and tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Proposals</p><p className="text-3xl font-bold">{proposals.length}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Lightbulb className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending Review</p><p className="text-3xl font-bold text-yellow-600">{pendingCount}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Lightbulb className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">In Progress</p><p className="text-3xl font-bold text-purple-600">{inProgressCount}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Lightbulb className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Budget</p><p className="text-3xl font-bold text-green-600">${totalBudget.toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Proposals</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.length === 0 ? <p className="text-center py-8 text-gray-500">No proposals found.</p> : (
              proposals.map((proposal) => (
                <div key={proposal.id} className="p-4 border rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{proposal.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">by {proposal.submitterName} • {proposal.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[proposal.priority]}>{proposal.priority}</Badge>
                      <Badge className={statusColors[proposal.status]}>{proposal.status.replace("_", " ")}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => openDetail(proposal)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openReview(proposal)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{proposal.summary}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />${proposal.totalBudget.toLocaleString()}</span>
                    {proposal.startDate && proposal.endDate && (
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(proposal.startDate).toLocaleDateString()} - {new Date(proposal.endDate).toLocaleDateString()}</span>
                    )}
                    {proposal.volunteersNeeded && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{proposal.volunteersNeeded} volunteers</span>}
                  </div>
                  {(proposal.status === "approved" || proposal.status === "in_progress") && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">Progress</span><span className="font-medium">{proposal.completionPercent || 0}%</span></div>
                      <Progress value={proposal.completionPercent || 0} className="h-2" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review: {selected?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={reviewForm.status} onValueChange={(v) => setReviewForm({ ...reviewForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending", "under_review", "needs_revision", "approved", "in_progress", "completed", "declined", "on_hold"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={reviewForm.priority} onValueChange={(v) => setReviewForm({ ...reviewForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low", "normal", "high", "urgent"].map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Admin Notes</Label><Textarea value={reviewForm.adminNotes} onChange={(e) => setReviewForm({ ...reviewForm, adminNotes: e.target.value })} rows={3} /></div>
            {reviewForm.status === "declined" && (
              <div><Label>Rejection Reason</Label><Textarea value={reviewForm.rejectionReason} onChange={(e) => setReviewForm({ ...reviewForm, rejectionReason: e.target.value })} rows={2} /></div>
            )}
            {(reviewForm.status === "approved" || reviewForm.status === "in_progress") && (
              <div>
                <Label>Completion ({reviewForm.completionPercent}%)</Label>
                <Input type="range" min={0} max={100} value={reviewForm.completionPercent} onChange={(e) => setReviewForm({ ...reviewForm, completionPercent: parseInt(e.target.value) })} className="mt-2" />
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2"><Badge className={statusColors[selected.status]}>{selected.status.replace("_", " ")}</Badge><Badge className={priorityColors[selected.priority]}>{selected.priority}</Badge></div>
              <div><p className="font-medium text-gray-700">Summary</p><p className="text-gray-600">{selected.summary}</p></div>
              <div><p className="font-medium text-gray-700">Description</p><p className="text-gray-600 whitespace-pre-wrap">{selected.description}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Submitter</p><p>{selected.submitterName}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p>{selected.submitterEmail}</p></div>
                <div><p className="text-sm text-gray-500">Category</p><p>{selected.category}</p></div>
                <div><p className="text-sm text-gray-500">Budget</p><p>${selected.totalBudget.toLocaleString()}</p></div>
              </div>
              {selected.adminNotes && <div><p className="font-medium text-gray-700">Admin Notes</p><p className="text-gray-600">{selected.adminNotes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

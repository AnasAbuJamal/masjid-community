"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Briefcase, Users, MapPin, Clock, Building, Plus, Pencil, Trash2, Eye } from "lucide-react";

interface Job {
  id: string; title: string; company: string; contactName: string; contactEmail: string;
  contactPhone?: string; description: string; requirements: string[]; location: string;
  locationType: string; employmentType: string; salaryMin?: number; salaryMax?: number;
  salaryPeriod?: string; category: string; isUrgent: boolean; status: string; expiresAt?: string;
  _count?: { applications: number };
}
interface JobApplication {
  id: string; jobId: string; applicantName: string; applicantEmail: string;
  applicantPhone?: string; status: string;
}

const statusColors: Record<string, string> = { pending_review: "bg-yellow-100 text-yellow-700", active: "bg-green-100 text-green-700", paused: "bg-gray-100 text-gray-700", expired: "bg-red-100 text-red-700", closed: "bg-red-100 text-red-700", rejected: "bg-red-100 text-red-700" };
const appStatusColors: Record<string, string> = { submitted: "bg-blue-100 text-blue-700", reviewed: "bg-purple-100 text-purple-700", shortlisted: "bg-yellow-100 text-yellow-700", hired: "bg-green-100 text-green-700", declined: "bg-red-100 text-red-700" };

export default function JobsPage() {
  const [postings, setPostings] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobDialog, setJobDialog] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState({
    title: "", company: "", contactName: "", contactEmail: "", contactPhone: "",
    description: "", requirements: "", location: "", locationType: "on_site",
    employmentType: "full_time", salaryMin: "", salaryMax: "", salaryPeriod: "yearly",
    category: "", isUrgent: false, status: "pending_review",
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setPostings(data.postings || []);
      setApplications(data.applications || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", company: "", contactName: "", contactEmail: "", contactPhone: "", description: "", requirements: "", location: "", locationType: "on_site", employmentType: "full_time", salaryMin: "", salaryMax: "", salaryPeriod: "yearly", category: "", isUrgent: false, status: "pending_review" });
    setJobDialog(true);
  };
  const openEdit = (j: Job) => {
    setEditing(j);
    setForm({ title: j.title, company: j.company, contactName: j.contactName, contactEmail: j.contactEmail, contactPhone: j.contactPhone || "", description: j.description, requirements: j.requirements.join(", "), location: j.location, locationType: j.locationType, employmentType: j.employmentType, salaryMin: j.salaryMin?.toString() || "", salaryMax: j.salaryMax?.toString() || "", salaryPeriod: j.salaryPeriod || "yearly", category: j.category, isUrgent: j.isUrgent, status: j.status });
    setJobDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, requirements: form.requirements.split(",").map((r) => r.trim()).filter(Boolean), salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : undefined, salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : undefined };
      if (editing) { await fetch(`/api/jobs/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      setJobDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/jobs/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); } catch { /* empty */ }
  };

  const activeCount = postings.filter((p) => p.status === "active").length;
  const pendingCount = postings.filter((p) => p.status === "pending_review").length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Jobs Board</h1><p className="text-gray-500 mt-1">Manage job postings and applications</p></div>
        <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Job</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active Jobs</p><p className="text-3xl font-bold text-green-600">{activeCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Briefcase className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending Review</p><p className="text-3xl font-bold text-yellow-600">{pendingCount}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Applications</p><p className="text-3xl font-bold text-blue-600">{applications.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Postings</p><p className="text-3xl font-bold text-purple-600">{postings.length}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Briefcase className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Job Postings</CardTitle></CardHeader>
          <CardContent>
            {postings.length === 0 ? <p className="text-center py-8 text-gray-500">No job postings found.</p> : (
              <div className="space-y-3">
                {postings.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Building className="h-4 w-4" />{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[job.status]}>{job.status.replace("_", " ")}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setDetailJob(job)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(job)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(job.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" />{job._count?.applications || 0} applicants</span>
                      {job.isUrgent && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Applications</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-500">No applications yet.</TableCell></TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.applicantName}</TableCell>
                      <TableCell className="text-sm">{app.applicantEmail}</TableCell>
                      <TableCell><Badge className={appStatusColors[app.status]}>{app.status}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Job Dialog */}
      <Dialog open={jobDialog} onOpenChange={setJobDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Job" : "New Job"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Contact Name</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
              <div><Label>Contact Email</Label><Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
              <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>Requirements (comma separated)</Label><Input value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Location Type</Label><Select value={form.locationType} onValueChange={(v) => setForm({ ...form, locationType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="on_site">On-site</SelectItem><SelectItem value="remote">Remote</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select></div>
              <div><Label>Employment</Label><Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full_time">Full-time</SelectItem><SelectItem value="part_time">Part-time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="temporary">Temporary</SelectItem><SelectItem value="internship">Internship</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Salary Min ($)</Label><Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} /></div>
              <div><Label>Salary Max ($)</Label><Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} /></div>
              <div><Label>Period</Label><Select value={form.salaryPeriod} onValueChange={(v) => setForm({ ...form, salaryPeriod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., IT, Healthcare" /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending_review">Pending Review</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex items-center justify-between"><Label>Mark as Urgent</Label><Switch checked={form.isUrgent} onCheckedChange={(v) => setForm({ ...form, isUrgent: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setJobDialog(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Detail */}
      <Dialog open={!!detailJob} onOpenChange={() => setDetailJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detailJob?.title}</DialogTitle></DialogHeader>
          {detailJob && (
            <div className="space-y-3">
              <div className="flex gap-2"><Badge className={statusColors[detailJob.status]}>{detailJob.status.replace("_", " ")}</Badge>{detailJob.isUrgent && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Company</p><p>{detailJob.company}</p></div>
                <div><p className="text-sm text-gray-500">Location</p><p>{detailJob.location} ({detailJob.locationType})</p></div>
                <div><p className="text-sm text-gray-500">Employment</p><p>{detailJob.employmentType.replace("_", " ")}</p></div>
                <div><p className="text-sm text-gray-500">Category</p><p>{detailJob.category}</p></div>
                <div><p className="text-sm text-gray-500">Contact</p><p>{detailJob.contactName} ({detailJob.contactEmail})</p></div>
                {detailJob.salaryMin && <div><p className="text-sm text-gray-500">Salary</p><p>${detailJob.salaryMin?.toLocaleString()} - ${detailJob.salaryMax?.toLocaleString()} / {detailJob.salaryPeriod}</p></div>}
              </div>
              <div><p className="text-sm text-gray-500">Description</p><p className="text-gray-700 whitespace-pre-wrap">{detailJob.description}</p></div>
              {detailJob.requirements.length > 0 && (
                <div><p className="text-sm text-gray-500">Requirements</p><ul className="list-disc pl-5">{detailJob.requirements.map((r, i) => (<li key={i}>{r}</li>))}</ul></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Job?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

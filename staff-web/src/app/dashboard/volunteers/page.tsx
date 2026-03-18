"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Plus, HandHelping, Users, Calendar, Clock, CheckCircle, XCircle, Pencil, Trash2 } from "lucide-react";

interface Opportunity {
  id: string; title: string; description: string; eventDate: string;
  spotsTotal: number; spotsFilled: number; status: string;
  _count?: { applications: number };
}
interface Application {
  id: string; opportunityId: string; userName: string; userEmail: string;
  userPhone?: string; skills?: string; status: string;
  opportunity?: { title: string };
}

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };
const oppStatusColors: Record<string, string> = { open: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-700" };

export default function VolunteersPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [oppDialog, setOppDialog] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [form, setForm] = useState({ title: "", description: "", eventDate: "", spotsTotal: 10, status: "open" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/volunteers");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setApplications(data.applications || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", eventDate: "", spotsTotal: 10, status: "open" }); setOppDialog(true); };
  const openEdit = (o: Opportunity) => { setEditing(o); setForm({ title: o.title, description: o.description, eventDate: o.eventDate?.split("T")[0] || "", spotsTotal: o.spotsTotal, status: o.status }); setOppDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/volunteers/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/volunteers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setOppDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/volunteers/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); } catch { /* empty */ }
  };

  const updateAppStatus = async (appId: string, status: string) => {
    try {
      await fetch(`/api/volunteers/applications/${appId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, _type: "application" }) });
      fetchData();
    } catch { /* empty */ }
  };

  const openCount = opportunities.filter((o) => o.status === "open").length;
  const pendingApps = applications.filter((a) => a.status === "pending").length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Volunteers</h1><p className="text-gray-500 mt-1">Manage volunteer opportunities and applications</p></div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Opportunity</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Opportunities</p><p className="text-3xl font-bold">{opportunities.length}</p></div><div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"><HandHelping className="h-6 w-6 text-teal-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Open</p><p className="text-3xl font-bold text-green-600">{openCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><HandHelping className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending Applications</p><p className="text-3xl font-bold text-yellow-600">{pendingApps}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Applications</p><p className="text-3xl font-bold text-blue-600">{applications.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Opportunities</CardTitle></CardHeader>
          <CardContent>
            {opportunities.length === 0 ? <p className="text-center py-8 text-gray-500">No opportunities found.</p> : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{opp.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={oppStatusColors[opp.status]}>{opp.status}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(opp)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(opp.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{opp.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(opp.eventDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" />{opp.spotsFilled}/{opp.spotsTotal} spots</span>
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
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Opportunity</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4 text-gray-500">No applications yet.</TableCell></TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.userName}<p className="text-xs text-gray-500">{app.userEmail}</p></TableCell>
                      <TableCell className="text-sm">{app.opportunity?.title}</TableCell>
                      <TableCell><Badge className={statusColors[app.status]}>{app.status}</Badge></TableCell>
                      <TableCell>
                        {app.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => updateAppStatus(app.id, "approved")}><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateAppStatus(app.id, "rejected")}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={oppDialog} onOpenChange={setOppDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Opportunity" : "Create Opportunity"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Event Date</Label><Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
              <div><Label>Spots Total</Label><Input type="number" value={form.spotsTotal} onChange={(e) => setForm({ ...form, spotsTotal: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOppDialog(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Opportunity?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

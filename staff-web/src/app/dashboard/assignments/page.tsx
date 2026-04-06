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
import { Plus, ClipboardList, CheckCircle, Clock, Pencil, Trash2 } from "lucide-react";

interface Assignment {
  id: string; studentId: string; teacherId: string; date: string;
  type: string; location: string; description: string; status: string; rating: string;
  student?: { firstName: string; lastName: string; studentId: string };
  teacher?: { firstName: string; lastName: string };
}
interface Student { id: string; firstName: string; lastName: string; studentId: string; }

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700" };
const ratingColors: Record<string, string> = { none: "bg-gray-100 text-gray-700", weak: "bg-red-100 text-red-700", good: "bg-blue-100 text-blue-700", very_good: "bg-purple-100 text-purple-700", excellent: "bg-green-100 text-green-700" };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ studentId: "", date: "", type: "new_lesson", location: "masjid", description: "", status: "pending", rating: "none" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([fetch("/api/assignments"), fetch("/api/classroom/students")]);
      const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
      setAssignments(aData.assignments || []);
      setStudents(sData.students || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = statusFilter === "all" ? assignments : assignments.filter((a) => a.status === statusFilter);

  const openCreate = () => { setEditing(null); setForm({ studentId: students[0]?.id || "", date: new Date().toISOString().split("T")[0], type: "new_lesson", location: "masjid", description: "", status: "pending", rating: "none" }); setDialogOpen(true); };
  const openEdit = (a: Assignment) => {
    setEditing(a);
    setForm({ studentId: a.studentId, date: a.date?.split("T")[0] || "", type: a.type, location: a.location, description: a.description, status: a.status, rating: a.rating });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/assignments/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setDialogOpen(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/assignments/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); } catch { /* empty */ }
  };

  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-serif font-bold text-mocha-900">Track student assignments and progress</h1><p className="text-mocha-600 mt-1">Track student assignments and progress</p></div>
        <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Assignment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total</p><p className="text-3xl font-bold">{assignments.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><ClipboardList className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending</p><p className="text-3xl font-bold text-yellow-600">{pendingCount}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Completed</p><p className="text-3xl font-bold text-green-600">{completedCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Excellent</p><p className="text-3xl font-bold text-purple-600">{assignments.filter((a) => a.rating === "excellent").length}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "completed"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "mocha-gradient" : ""}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All Assignments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Rating</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No assignments found.</TableCell></TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.student?.firstName} {a.student?.lastName}<p className="text-xs text-gray-500 font-mono">{a.student?.studentId}</p></TableCell>
                    <TableCell className="max-w-xs truncate">{a.description}</TableCell>
                    <TableCell><Badge variant="outline">{a.type.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{a.location}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[a.status]}>{a.status}</Badge></TableCell>
                    <TableCell><Badge className={ratingColors[a.rating]}>{a.rating.replace("_", " ")}</Badge></TableCell>
                    <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Assignment" : "New Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new_lesson">New Lesson</SelectItem><SelectItem value="review">Review</SelectItem></SelectContent></Select>
              </div>
              <div>
                <Label>Location</Label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="masjid">Masjid</SelectItem><SelectItem value="home">Home</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            {editing && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
                </div>
                <div>
                  <Label>Rating</Label>
                  <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="weak">Weak</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="very_good">Very Good</SelectItem><SelectItem value="excellent">Excellent</SelectItem></SelectContent></Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Assignment?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

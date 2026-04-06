"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Plus, HardHat, AlertTriangle, GripVertical, Pencil, Trash2 } from "lucide-react";

interface Project {
  id: string; title: string; description?: string;
  progressPercent: number; isUrgent: boolean; displayOrder: number;
}

export default function ConstructionPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: "", description: "", progressPercent: 0, isUrgent: false, displayOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/construction");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const totalProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length) : 0;
  const urgentCount = projects.filter((p) => p.isUrgent).length;

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", progressPercent: 0, isUrgent: false, displayOrder: projects.length }); setDialogOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ title: p.title, description: p.description || "", progressPercent: p.progressPercent, isUrgent: p.isUrgent, displayOrder: p.displayOrder }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/construction/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/construction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setDialogOpen(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/construction/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); } catch { /* empty */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Construction</h1><p className="text-gray-500 mt-1">Track mosque construction and renovation projects</p></div>
        <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active Projects</p><p className="text-3xl font-bold">{projects.length}</p></div><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center"><HardHat className="h-6 w-6 text-orange-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Overall Progress</p><p className="text-3xl font-bold text-blue-600">{totalProgress}%</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><HardHat className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Urgent</p><p className="text-3xl font-bold text-red-600">{urgentCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><HardHat className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No construction projects found.</p></CardContent></Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className={project.isUrgent ? "border-red-300" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <CardTitle>{project.title}</CardTitle>
                    {project.isUrgent && (<Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" />Urgent</Badge>)}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(project)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(project.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {project.description && <p className="text-sm text-gray-500 mt-2">{project.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Progress</span><span className="font-semibold">{project.progressPercent}%</span></div>
                  <Progress value={project.progressPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Project" : "Add Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div>
              <Label>Progress ({form.progressPercent}%)</Label>
              <Input type="range" min={0} max={100} value={form.progressPercent} onChange={(e) => setForm({ ...form, progressPercent: parseInt(e.target.value) })} className="mt-2" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mark as Urgent</Label>
              <Switch checked={form.isUrgent} onCheckedChange={(v) => setForm({ ...form, isUrgent: v })} />
            </div>
            <div><Label>Display Order</Label><Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Project?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

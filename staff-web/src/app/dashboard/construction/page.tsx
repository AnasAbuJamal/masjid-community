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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Plus, HardHat, AlertTriangle, Pencil, Trash2, Image, Building2,
  TrendingUp, Clock, CheckCircle2, LayoutDashboard, ListTodo, GanttChart,
  ArrowUp, ArrowDown,
} from "lucide-react";

interface Project {
  id: number; title: string; description?: string; imageUrl?: string;
  progressPercent: number; isUrgent: boolean; displayOrder: number;
  createdAt: string;
}

const getProgressColor = (pct: number) => {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-amber-500";
  return "bg-red-500";
};

const getProgressLabel = (pct: number) => {
  if (pct >= 100) return "Completed";
  if (pct >= 75) return "Almost Done";
  if (pct >= 50) return "In Progress";
  if (pct >= 25) return "Started";
  return "Planning";
};

const phases = [
  { label: "Planning", range: [0, 24], color: "bg-gray-300" },
  { label: "Started", range: [25, 49], color: "bg-amber-400" },
  { label: "In Progress", range: [50, 74], color: "bg-blue-500" },
  { label: "Almost Done", range: [75, 99], color: "bg-emerald-500" },
  { label: "Completed", range: [100, 100], color: "bg-green-600" },
];

export default function ConstructionPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", progressPercent: 0, isUrgent: false, displayOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"board" | "timeline" | "grid">("board");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/construction");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) { console.error("Error fetching projects:", e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const totalProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length) : 0;
  const urgentCount = projects.filter((p) => p.isUrgent).length;
  const completedCount = projects.filter((p) => p.progressPercent >= 100).length;
  const inProgressCount = projects.filter((p) => p.progressPercent >= 25 && p.progressPercent < 100).length;

  const sorted = [...projects].sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    return b.progressPercent - a.progressPercent;
  });

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", imageUrl: "", progressPercent: 0, isUrgent: false, displayOrder: projects.length }); setDialogOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ title: p.title, description: p.description || "", imageUrl: p.imageUrl || "", progressPercent: p.progressPercent, isUrgent: p.isUrgent, displayOrder: p.displayOrder }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/construction/${editing.id}` : "/api/construction", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      setDialogOpen(false); fetchData();
    } catch (e) { console.error("Error saving project:", e); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { const res = await fetch(`/api/construction/${deleteId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Delete failed"); setDeleteId(null); fetchData(); } catch (e) { console.error(e); }
  };

  const groupedByPhase = phases.map((phase) => ({
    ...phase,
    projects: sorted.filter((p) => p.progressPercent >= phase.range[0] && p.progressPercent <= phase.range[1]),
  }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Construction Projects</h1>
          <p className="text-gray-500 mt-1">Track mosque expansion, renovation, and capital projects</p>
        </div>
        <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />New Project
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Progress</p>
                <p className="text-3xl font-bold text-blue-600">{totalProgress}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${getProgressColor(totalProgress)} rounded-full transition-all duration-500`} style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Projects</p><p className="text-3xl font-bold">{projects.length}</p></div><Building2 className="h-6 w-6 text-orange-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">In Progress</p><p className="text-3xl font-bold text-blue-600">{inProgressCount}</p></div><HardHat className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Completed</p><p className="text-3xl font-bold text-green-600">{completedCount}</p></div><CheckCircle2 className="h-6 w-6 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Urgent</p><p className="text-3xl font-bold text-red-600">{urgentCount}</p></div><AlertTriangle className="h-6 w-6 text-red-600" /></div></CardContent></Card>
      </div>

      {/* View Switcher + Phase Progress */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Kanban Board</TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center gap-2"><GanttChart className="h-4 w-4" />Project Grid</TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2"><ListTodo className="h-4 w-4" />Phase View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Kanban Board View */}
      {activeView === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {groupedByPhase.map((phase) => (
            <div key={phase.label} className="min-w-[200px]">
              <div className={`rounded-t-lg px-3 py-2 ${phase.color} text-white text-sm font-semibold flex items-center justify-between`}>
                <span>{phase.label}</span>
                <Badge variant="secondary" className="text-xs bg-white/30 text-white">{phase.projects.length}</Badge>
              </div>
              <div className="bg-gray-50 rounded-b-lg p-3 min-h-[300px] space-y-3">
                {phase.projects.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No projects</p>
                ) : (
                  phase.projects.map((project) => (
                    <Card key={project.id} className={`shadow-sm ${project.isUrgent ? "ring-1 ring-red-300" : ""}`}>
                      {project.imageUrl && (
                        <div className="h-24 bg-gray-100 overflow-hidden rounded-t-lg">
                          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                        </div>
                      )}
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-sm line-clamp-2">{project.title}</p>
                          {project.isUrgent && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 ml-1" />}
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${getProgressColor(project.progressPercent)} rounded-full`} style={{ width: `${project.progressPercent}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{project.progressPercent}%</span>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(project)}><Pencil className="h-3 w-3 hover:text-gray-700" /></button>
                            <button onClick={() => setDeleteId(String(project.id))}><Trash2 className="h-3 w-3 hover:text-red-500" /></button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Grid View */}
      {activeView === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.length === 0 ? (
            <Card className="md:col-span-3"><CardContent className="py-16 text-center"><HardHat className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 text-lg">No construction projects yet</p><p className="text-gray-400 text-sm mt-1">Click &quot;New Project&quot; to get started</p></CardContent></Card>
          ) : (
            sorted.map((project) => {
              const progressColor = getProgressColor(project.progressPercent);
              const statusLabel = getProgressLabel(project.progressPercent);
              return (
                <Card key={project.id} className={`overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${project.isUrgent ? "ring-2 ring-red-300" : ""}`}>
                  {project.imageUrl && (
                    <div className="h-44 bg-gray-100 overflow-hidden relative group">
                      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                      {project.isUrgent && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500 text-white border-0"><AlertTriangle className="h-3 w-3 mr-1" />Urgent</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader className={project.imageUrl ? "pt-4 pb-2" : "pb-2"}>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      {!project.imageUrl && project.isUrgent && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
                        </div>
                        <span className="font-semibold text-lg">{project.progressPercent}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${progressColor} rounded-full transition-all duration-500`} style={{ width: `${project.progressPercent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(project)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(String(project.id))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      {project.createdAt && (
                        <span className="text-xs text-gray-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Phase/Timeline View */}
      {activeView === "timeline" && (
        <div className="space-y-4">
          {phases.map((phase) => {
            const phaseProjects = sorted.filter((p) => p.progressPercent >= phase.range[0] && p.progressPercent <= phase.range[1]);
            if (phaseProjects.length === 0) return null;
            return (
              <Card key={phase.label}>
                <CardHeader className={`${phase.color} text-white rounded-t-lg`}>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {phase.label}
                      <Badge variant="secondary" className="bg-white/30 text-white text-xs">{phaseProjects.length}</Badge>
                    </span>
                    <span className="text-sm font-normal opacity-80">{phase.range[0]}% - {phase.range[1] === 100 ? "100%" : `${phase.range[1]}%`}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {phaseProjects.map((project, idx) => (
                      <div key={project.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center text-sm font-bold shrink-0" style={{ borderColor: phase.color.replace("bg-", "").replace("-500", "") === "green" ? "#22c55e" : phase.color.includes("red") ? "#ef4444" : phase.color.includes("blue") ? "#3b82f6" : phase.color.includes("amber") ? "#f59e0b" : phase.color.includes("emerald") ? "#10b981" : "#6b7280" }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{project.title}</p>
                            {project.isUrgent && <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>}
                          </div>
                          {project.description && <p className="text-xs text-gray-500 truncate">{project.description}</p>}
                        </div>
                        <div className="w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${getProgressColor(project.progressPercent)} rounded-full`} style={{ width: `${project.progressPercent}%` }} />
                            </div>
                            <span className="text-sm font-semibold w-10 text-right">{project.progressPercent}%</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEdit(project)} className="p-1 hover:bg-gray-200 rounded"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => setDeleteId(String(project.id))} className="p-1 hover:bg-red-100 rounded"><Trash2 className="h-3 w-3 text-red-500" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Project Name</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Phase 2 Expansion" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe scope, timeline, and key milestones..." /></div>
            <div><Label>Cover Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/project.jpg" /></div>
            <div>
              <Label>Progress ({form.progressPercent}%)</Label>
              <div className="flex items-center gap-4 mt-2">
                <input type="range" min={0} max={100} value={form.progressPercent} onChange={(e) => setForm({ ...form, progressPercent: parseInt(e.target.value) })} className="flex-1" />
                <span className="text-lg font-bold w-12 text-right">{form.progressPercent}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Planning</span><span>In Progress</span><span>Complete</span></div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div><Label className="mb-0">Mark as Urgent</Label><p className="text-xs text-gray-500">Highlights project with red alert</p></div>
              <Switch checked={form.isUrgent} onCheckedChange={(v) => setForm({ ...form, isUrgent: v })} />
            </div>
            <div><Label>Display Order</Label><Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving || !form.title}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Project?</DialogTitle></DialogHeader><p className="text-gray-500">This action permanently removes this project.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

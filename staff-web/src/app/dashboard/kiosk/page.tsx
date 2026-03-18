"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tv, ExternalLink, Clock, Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Announcement {
  id: string; title: string; message: string; type: string;
  isActive: boolean; priority: number; startDate?: string; endDate?: string;
}

const typeColors: Record<string, string> = { general: "bg-blue-100 text-blue-700", urgent: "bg-red-100 text-red-700", event: "bg-purple-100 text-purple-700", reminder: "bg-yellow-100 text-yellow-700" };

export default function KioskPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", message: "", type: "general", isActive: true, priority: 1, startsAt: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/kiosk");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: "", message: "", type: "general", isActive: true, priority: 1, startsAt: "", expiresAt: "" }); setDialogOpen(true); };
  const openEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, message: a.message, type: a.type, isActive: a.isActive, priority: a.priority, startsAt: a.startDate?.split("T")[0] || "", expiresAt: a.endDate?.split("T")[0] || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, startsAt: form.startsAt || undefined, expiresAt: form.expiresAt || undefined };
      if (editing) { await fetch(`/api/kiosk/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { await fetch("/api/kiosk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      setDialogOpen(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/kiosk/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); } catch { /* empty */ }
  };

  const activeCount = announcements.filter((a) => a.isActive).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Kiosk / TV Mode</h1><p className="text-gray-500 mt-1">Digital signage for mosque lobby TVs</p></div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Announcement</Button>
          <Link href="/kiosk/tv" target="_blank"><Button variant="outline"><Tv className="h-4 w-4 mr-2" />Open TV Display</Button></Link>
        </div>
      </div>

      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader><CardTitle className="flex items-center gap-2"><Tv className="h-5 w-5" />TV Display Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Tv className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Click &quot;Open TV Display&quot; to view</p>
              <p className="text-sm mt-2">Runs at /kiosk/tv</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Announcements</p><p className="text-2xl font-bold">{announcements.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Megaphone className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Megaphone className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Inactive</p><p className="text-2xl font-bold text-gray-600">{announcements.length - activeCount}</p></div><div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><Megaphone className="h-6 w-6 text-gray-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
        <CardContent>
          {announcements.length === 0 ? <p className="text-center py-8 text-gray-500">No announcements. Create your first.</p> : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className={`p-4 border rounded-lg ${ann.isActive ? "" : "opacity-60"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {ann.title}
                        {!ann.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{ann.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={typeColors[ann.type] || "bg-gray-100 text-gray-700"}>{ann.type}</Badge>
                      <Badge variant="outline">P: {ann.priority}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ann)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(ann.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="ramadan">Ramadan</SelectItem><SelectItem value="fundraiser">Fundraiser</SelectItem></SelectContent></Select></div>
              <div><Label>Priority</Label><Input type="number" min={1} max={10} value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts At</Label><Input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Announcement?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

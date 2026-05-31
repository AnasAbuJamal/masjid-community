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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Tv, ExternalLink, Megaphone, Plus, Pencil, Trash2, AlertTriangle,
  AlertOctagon, Radio, Clock, X,
} from "lucide-react";
import Link from "next/link";

interface Announcement {
  id: string; title: string; message: string; type: string;
  isActive: boolean; priority: number; startDate?: string; endDate?: string;
}

interface EmergencyBroadcast {
  isActive: boolean;
  title: string | null;
  message: string | null;
  expiresAt: string | null;
}

const typeColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  urgent: "bg-red-100 text-red-700",
  event: "bg-purple-100 text-purple-700",
  ramadan: "bg-green-100 text-green-700",
  fundraiser: "bg-yellow-100 text-yellow-700",
};

export default function KioskPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [emergency, setEmergency] = useState<EmergencyBroadcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", message: "", type: "general", isActive: true, priority: 1, startsAt: "", expiresAt: "" });
  const [emergencyForm, setEmergencyForm] = useState({ title: "", message: "", expiresInMinutes: 60 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rotationInterval, setRotationInterval] = useState("10");
  const [displayDuration, setDisplayDuration] = useState("30000");
  const [savingRotation, setSavingRotation] = useState(false);

  const fetchData = async () => {
    try {
      const [kioskRes, emergencyRes, settingsRes] = await Promise.all([
        fetch("/api/kiosk"),
        fetch("/api/kiosk/emergency"),
        fetch("/api/settings"),
      ]);
      const kioskData = await kioskRes.json();
      const emergencyData = await emergencyRes.json();
      const settingsData = await settingsRes.json();
      setAnnouncements(kioskData.announcements || []);
      setEmergency(emergencyData);
      const s = settingsData.settings || {};
      if (s.kiosk_rotation_interval) setRotationInterval(s.kiosk_rotation_interval);
      if (s.kiosk_display_duration) setDisplayDuration(s.kiosk_display_duration);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", message: "", type: "general", isActive: true, priority: 1, startsAt: "", expiresAt: "" });
    setDialogOpen(true);
  };
  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, message: a.message, type: a.type, isActive: a.isActive, priority: a.priority, startsAt: a.startDate?.split("T")[0] || "", expiresAt: a.endDate?.split("T")[0] || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, startsAt: form.startsAt || undefined, expiresAt: form.expiresAt || undefined };
      if (editing) {
        await fetch(`/api/kiosk/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/kiosk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      setDialogOpen(false);
      fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/kiosk/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchData();
    } catch { /* empty */ }
  };

  const handleActivateEmergency = async () => {
    if (!emergencyForm.title || !emergencyForm.message) return;
    setSaving(true);
    try {
      await fetch("/api/kiosk/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emergencyForm),
      });
      setEmergencyDialogOpen(false);
      setEmergencyForm({ title: "", message: "", expiresInMinutes: 60 });
      fetchData();
    } catch (error) {
      console.error("Error activating emergency:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRotation = async () => {
    setSavingRotation(true);
    try {
      await fetch("/api/kiosk/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotationInterval: parseInt(rotationInterval), displayDuration: parseInt(displayDuration) }),
      });
    } catch { /* empty */ } finally { setSavingRotation(false); }
  };

  const handleClearEmergency = async () => {
    if (!confirm("Clear the active emergency broadcast?")) return;
    try {
      await fetch("/api/kiosk/emergency", { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error clearing emergency:", error);
    }
  };

  const activeCount = announcements.filter((a) => a.isActive).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Kiosk / TV Mode</h1><p className="text-gray-500 mt-1">Digital signage for mosque lobby TVs</p></div>
        <div className="flex gap-2">
          <Link href="/kiosk/tv" target="_blank"><Button variant="outline"><Tv className="h-4 w-4 mr-2" />Open TV Display</Button></Link>
          <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Announcement</Button>
        </div>
      </div>

      {/* Emergency Alert */}
      {emergency?.isActive && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <AlertOctagon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-700">{emergency.title}</h3>
                  <p className="text-red-600">{emergency.message}</p>
                  {emergency.expiresAt && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {new Date(emergency.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleClearEmergency}>
                <X className="h-4 w-4 mr-1" />Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Broadcast Button */}
      {!emergency?.isActive && (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-800">Emergency Broadcast</h3>
                  <p className="text-sm text-yellow-700">Send urgent alerts to all TV displays</p>
                </div>
              </div>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setEmergencyDialogOpen(true)}>
                <Radio className="h-4 w-4 mr-2" />Activate Emergency
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Emergency</p><p className="text-2xl font-bold text-red-600">{emergency?.isActive ? "ACTIVE" : "None"}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      {/* Rotation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tv className="h-5 w-5" />Rotation Settings
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Display Duration</Label>
                <Select value={rotationInterval} onValueChange={setRotationInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">How long each announcement displays</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Transition Effect</Label>
                <Select defaultValue="fade">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Animation between announcements</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex-1 mr-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Announcements are displayed in order of priority (highest first), then by creation date.
              </p>
            </div>
            <Button onClick={handleSaveRotation} disabled={savingRotation} size="sm">
              {savingRotation ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Emergency Broadcast Dialog */}
      <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="h-5 w-5" />Emergency Broadcast
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                This will display an urgent alert on ALL TV displays connected to the kiosk system.
                Use this only for genuine emergencies.
              </p>
            </div>
            <div>
              <Label>Alert Title</Label>
              <Input
                placeholder="EMERGENCY"
                value={emergencyForm.title}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, title: e.target.value.toUpperCase() })}
                className="font-bold"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Describe the emergency..."
                value={emergencyForm.message}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, message: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Auto-expire after (minutes)</Label>
              <Select value={emergencyForm.expiresInMinutes.toString()} onValueChange={(v) => setEmergencyForm({ ...emergencyForm, expiresInMinutes: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="0">No auto-expire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmergencyDialogOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleActivateEmergency} disabled={!emergencyForm.title || !emergencyForm.message || saving}>
              {saving ? "Activating..." : "Activate Emergency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
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
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Announcement?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

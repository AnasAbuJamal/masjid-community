"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Plus, Clock, Calendar, Pencil, Trash2 } from "lucide-react";

interface PrayerTime {
  id: string;
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah1?: string | null;
  jummah2?: string | null;
}

const emptyPrayer = {
  date: "", fajr: "", sunrise: "", dhuhr: "", asr: "", maghrib: "", isha: "", jummah1: "", jummah2: "",
};

export default function PrayerTimesPage() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PrayerTime | null>(null);
  const [form, setForm] = useState(emptyPrayer);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/prayers");
      const data = await res.json();
      setPrayers(data.prayers || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayPrayer = prayers.find((p) => p.date?.split("T")[0] === today);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPrayer);
    setDialogOpen(true);
  };

  const openEdit = (p: PrayerTime) => {
    setEditing(p);
    setForm({
      date: p.date?.split("T")[0] || "",
      fajr: p.fajr, sunrise: p.sunrise, dhuhr: p.dhuhr,
      asr: p.asr, maghrib: p.maghrib, isha: p.isha,
      jummah1: p.jummah1 || "", jummah2: p.jummah2 || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/prayers/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/prayers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setDialogOpen(false);
      fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/prayers/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchData();
    } catch { /* empty */ }
  };

  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prayer Times</h1>
          <p className="text-gray-500 mt-1">Manage daily prayer times for the mosque</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prayer Times
        </Button>
      </div>

      {/* Today's Prayer Times */}
      {todayPrayer && (
        <Card className="border-gray-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Today&apos;s Prayer Times
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: "Fajr", time: todayPrayer.fajr },
                { name: "Sunrise", time: todayPrayer.sunrise },
                { name: "Dhuhr", time: todayPrayer.dhuhr },
                { name: "Asr", time: todayPrayer.asr },
                { name: "Maghrib", time: todayPrayer.maghrib },
                { name: "Isha", time: todayPrayer.isha },
                { name: "Jummah", time: todayPrayer.jummah1 || "N/A" },
              ].map((prayer) => (
                <div key={prayer.name} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">{prayer.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{prayer.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prayer Times Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            All Prayer Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fajr</TableHead>
                <TableHead>Sunrise</TableHead>
                <TableHead>Dhuhr</TableHead>
                <TableHead>Asr</TableHead>
                <TableHead>Maghrib</TableHead>
                <TableHead>Isha</TableHead>
                <TableHead>Jummah</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No prayer times found. Add your first entry.
                  </TableCell>
                </TableRow>
              ) : (
                prayers.map((prayer) => (
                  <TableRow key={prayer.id}>
                    <TableCell className="font-medium">
                      {new Date(prayer.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell>{prayer.fajr}</TableCell>
                    <TableCell>{prayer.sunrise}</TableCell>
                    <TableCell>{prayer.dhuhr}</TableCell>
                    <TableCell>{prayer.asr}</TableCell>
                    <TableCell>{prayer.maghrib}</TableCell>
                    <TableCell>{prayer.isha}</TableCell>
                    <TableCell>
                      {prayer.jummah1 ? (
                        <div className="flex gap-1">
                          <Badge variant="outline">{prayer.jummah1}</Badge>
                          {prayer.jummah2 && <Badge variant="outline">{prayer.jummah2}</Badge>}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(prayer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(prayer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Prayer Times" : "Add Prayer Times"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].map((field) => (
                <div key={field}>
                  <Label className="capitalize">{field}</Label>
                  <Input type="time" value={(form as Record<string, string>)[field]} onChange={(e) => updateForm(field, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jummah 1</Label>
                <Input type="time" value={form.jummah1} onChange={(e) => updateForm("jummah1", e.target.value)} />
              </div>
              <div>
                <Label>Jummah 2</Label>
                <Input type="time" value={form.jummah2} onChange={(e) => updateForm("jummah2", e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prayer Time?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

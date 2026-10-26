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
import { Plus, Clock, Calendar, Pencil, Trash2, RefreshCcw, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = async () => {
    setError("");
    try {
      const response = await fetch("/api/prayers?limit=100", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load prayer times.");
      setPrayers(Array.isArray(result.prayers) ? result.prayers : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load prayer times.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const todayPrayer = prayers.find((p) => p.date?.split("T")[0] === today);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyPrayer, date: today });
    setFormError("");
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
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (saving) return;
    const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    const required = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
    if (!form.date || required.some((key) => !timePattern.test(form[key])) ||
       [form.jummah1, form.jummah2].some((time) => time && !timePattern.test(time))) {
      setFormError("Choose a date and enter valid times for each daily prayer.");
      return;
    }
    if (form.jummah2 && !form.jummah1) {
      setFormError("Enter Jummah 1 before Jummah 2.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(editing ? "/api/prayers/" + editing.id : "/api/prayers", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save prayer times.");
      setDialogOpen(false);
      setNotice(editing ? "Prayer times updated." : "Prayer times saved.");
      await fetchData();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not save prayer times.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/prayers/" + deleteId, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not delete prayer times.");
      setDeleteId(null);
      setNotice("Prayer times deleted.");
      await fetchData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete prayer times.");
    } finally {
      setDeleting(false);
    }
  };

  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div role="status" className="flex h-64 items-center justify-center text-sky-800">Loading prayer times…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Prayer Times</h1>
          <p className="mt-1 text-slate-600">Manage the mosque Salah schedule.</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="outline" type="button" aria-label="Refresh prayer times" onClick={() => void fetchData()}><RefreshCcw className="mr-2 h-4 w-4" /> Refresh</Button><Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prayer Times
        </Button></div>
      </div>

      {error && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {/* Today's Prayer Times */}
      {todayPrayer && (
        <Card className="overflow-hidden border-sky-200/80">
          <CardHeader className="bg-gradient-to-r from-sky-100 to-white">
            <CardTitle className="flex items-center gap-2 text-sky-950">
              <Calendar className="h-5 w-5 text-sky-700" />
              Today's Prayer Times
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
                <div key={prayer.name} className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-4 text-center">
                  <p className="text-sm font-medium text-sky-700">{prayer.name}</p>
                  <p className="text-2xl font-serif font-bold text-sky-950 mt-1">{prayer.time}</p>
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
          <div className="overflow-x-auto"><Table>
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
                        <Button type="button" aria-label={"Edit prayer times for " + prayer.date.split("T")[0]} variant="ghost" size="sm" onClick={() => openEdit(prayer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" aria-label={"Delete prayer times for " + prayer.date.split("T")[0]} variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteId(prayer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!saving) setDialogOpen(open); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-sky-100 bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Prayer Times" : "Add Prayer Times"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            <div>
              <Label>Date</Label>
              <Input aria-label="Prayer schedule date" type="date" required value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].map((field) => (
                <div key={field}>
                  <Label className="capitalize">{field}</Label>
                  <Input aria-label={field + " prayer time"} required type="time" value={(form as Record<string, string>)[field]} onChange={(e) => updateForm(field, e.target.value)} />
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
            <Button type="button" variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prayer Time?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">This action cannot be undone.</p>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>{deleting ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

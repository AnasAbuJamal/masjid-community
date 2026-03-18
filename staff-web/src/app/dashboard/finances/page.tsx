"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";

interface FinancialRecord {
  id: string; month: string; year: number; donations: number; expenses: number; notes?: string;
}
interface FinancialSummary {
  id: string; totalSpent: number; bankBalance: number; totalGoal: number; totalRaised: number; remainingNeeded: number;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancesPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordDialog, setRecordDialog] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [editing, setEditing] = useState<FinancialRecord | null>(null);
  const [form, setForm] = useState({ month: "Jan", year: new Date().getFullYear(), donations: 0, expenses: 0, notes: "" });
  const [summaryForm, setSummaryForm] = useState({ totalSpent: 0, bankBalance: 0, totalGoal: 0, totalRaised: 0, remainingNeeded: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/finances");
      const data = await res.json();
      setRecords(data.records || []);
      setSummary(data.summary || null);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const totalDonations = records.reduce((acc, r) => acc + r.donations, 0);
  const totalExpenses = records.reduce((acc, r) => acc + r.expenses, 0);

  const openCreateRecord = () => { setEditing(null); setForm({ month: months[new Date().getMonth()], year: new Date().getFullYear(), donations: 0, expenses: 0, notes: "" }); setRecordDialog(true); };
  const openEditRecord = (r: FinancialRecord) => { setEditing(r); setForm({ month: r.month, year: r.year, donations: r.donations, expenses: r.expenses, notes: r.notes || "" }); setRecordDialog(true); };
  const openEditSummary = () => {
    setSummaryForm({
      totalSpent: summary?.totalSpent || 0, bankBalance: summary?.bankBalance || 0,
      totalGoal: summary?.totalGoal || 0, totalRaised: summary?.totalRaised || 0, remainingNeeded: summary?.remainingNeeded || 0,
    });
    setSummaryDialog(true);
  };

  const handleSaveRecord = async () => {
    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const body = editing ? { ...form, _type: "record", _id: editing.id } : { ...form, _type: "record" };
      await fetch("/api/finances", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setRecordDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleSaveSummary = async () => {
    setSaving(true);
    try {
      await fetch("/api/finances", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...summaryForm, _type: "summary" }) });
      setSummaryDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch("/api/finances", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ _type: "delete_record", _id: deleteId }) });
      setDeleteId(null); fetchData();
    } catch { /* empty */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Finances</h1><p className="text-gray-500 mt-1">Track donations and expenses</p></div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreateRecord}><Plus className="h-4 w-4 mr-2" />Add Record</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Bank Balance</p><p className="text-3xl font-bold text-green-600">${(summary?.bankBalance || 0).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><PiggyBank className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Raised</p><p className="text-3xl font-bold text-emerald-600">${(summary?.totalRaised || 0).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-emerald-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Spent</p><p className="text-3xl font-bold text-red-600">${(summary?.totalSpent || 0).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><TrendingDown className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Remaining</p><p className="text-3xl font-bold text-orange-600">${(summary?.remainingNeeded || 0).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-orange-600" /></div></div></CardContent></Card>
      </div>

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Financial Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={openEditSummary}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div><p className="text-sm text-gray-500">Total Raised</p><p className="text-2xl font-bold text-green-600">${summary.totalRaised.toLocaleString()}</p></div>
              <div><p className="text-sm text-gray-500">Total Spent</p><p className="text-2xl font-bold text-red-600">${summary.totalSpent.toLocaleString()}</p></div>
              <div><p className="text-sm text-gray-500">Bank Balance</p><p className="text-2xl font-bold text-blue-600">${summary.bankBalance.toLocaleString()}</p></div>
              <div><p className="text-sm text-gray-500">Total Goal</p><p className="text-2xl font-bold text-purple-600">${summary.totalGoal.toLocaleString()}</p></div>
              <div><p className="text-sm text-gray-500">Remaining</p><p className="text-2xl font-bold text-orange-600">${summary.remainingNeeded.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Monthly Records</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? <p className="text-center py-8 text-gray-500">No financial records found.</p> : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{record.month} {record.year}</p>
                    {record.notes && <p className="text-sm text-gray-500">{record.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-green-600 font-medium">+${record.donations.toLocaleString()}</p>
                      <p className="text-red-600 font-medium">-${record.expenses.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditRecord(record)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(record.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Dialog */}
      <Dialog open={recordDialog} onOpenChange={setRecordDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Record" : "Add Record"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Month</Label><Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2024 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Donations ($)</Label><Input type="number" value={form.donations} onChange={(e) => setForm({ ...form, donations: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Expenses ($)</Label><Input type="number" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRecordDialog(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveRecord} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryDialog} onOpenChange={setSummaryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Financial Summary</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {(["bankBalance", "totalRaised", "totalSpent", "totalGoal", "remainingNeeded"] as const).map((key) => (
              <div key={key}><Label>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} ($)</Label><Input type="number" value={summaryForm[key]} onChange={(e) => setSummaryForm({ ...summaryForm, [key]: parseFloat(e.target.value) || 0 })} /></div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSummaryDialog(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveSummary} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Record?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

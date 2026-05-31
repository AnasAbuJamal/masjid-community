"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, TrendingUp, TrendingDown, PiggyBank, Plus, Pencil, Trash2,
  Download, FileText, BarChart3, PieChart, Calendar, TrendingUpIcon, Receipt,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialRecord {
  id: number; month: string; year: number; donations: number; expenses: number; notes?: string;
}
interface FinancialSummary {
  id: number; totalSpent: number; bankBalance: number; totalGoal: number; totalRaised: number; remainingNeeded: number;
}
interface ReportData {
  year: number;
  summary: {
    totalDonations: number;
    totalExpenses: number;
    totalNet: number;
    totalTransactions: number;
    averageDonation: number;
  };
  currentBalance: number;
  goalProgress: { goal: number; raised: number; percentage: number } | null;
  monthlyBreakdown: { month: string; donations: number; expenses: number; net: number }[];
  byCategory: { name: string; amount: number }[];
  trends: {
    averageDonations: number;
    averageExpenses: number;
    maxDonationMonth: string;
    maxExpenseMonth: string;
  };
  generatedAt: string;
}
interface ExpenseItem {
  id: number; amount: number; description: string; date: string;
  category: { id: number; name: string; color?: string; icon?: string };
}
interface ExpenseCategory {
  id: number; name: string; color?: string; icon?: string; _count?: { expenses: number };
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancesPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [recordDialog, setRecordDialog] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState<FinancialRecord | null>(null);
  const [form, setForm] = useState({ month: "Jan", year: new Date().getFullYear(), donations: 0, expenses: 0, notes: "" });
  const [summaryForm, setSummaryForm] = useState({ totalSpent: 0, bankBalance: 0, totalGoal: 0, totalRaised: 0, remainingNeeded: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("records");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ categoryId: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] });
  const [expenseTotal, setExpenseTotal] = useState(0);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/finances");
      const data = await res.json();
      setRecords(data.records || []);
      setSummary(data.summary || null);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); fetchExpenses(); fetchCategories(); }, []);

  const fetchReport = async (year: number) => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/finances/reports?year=${year}`);
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/finances/expenses");
      const data = await res.json();
      setExpenses(data.expenses || []);
      setExpenseTotal(data.summary?.totalAmount || 0);
    } catch (e) { console.error("Error fetching expenses:", e); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/finances/categories");
      const data = await res.json();
      setExpenseCategories(data.categories || []);
    } catch (e) { console.error("Error fetching categories:", e); }
  };

  const downloadCSV = async () => {
    try {
      const res = await fetch(`/api/finances/reports?year=${reportYear}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "csv" }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${reportYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Finances</h1><p className="text-gray-500 mt-1">Track donations and expenses</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowReports(true); fetchReport(reportYear); }}>
            <BarChart3 className="h-4 w-4 mr-2" />Reports
          </Button>
          <Button className="mocha-gradient hover:opacity-90" onClick={openCreateRecord}><Plus className="h-4 w-4 mr-2" />Add Record</Button>
        </div>
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
            {summary.totalGoal > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Goal Progress</span>
                  <span>{Math.round((summary.totalRaised / summary.totalGoal) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (summary.totalRaised / summary.totalGoal) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="records">Monthly Records</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          {activeTab === "expenses" && (
            <Button onClick={() => { setExpenseForm({ categoryId: expenseCategories[0]?.id || "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] }); setExpenseDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Expense
            </Button>
          )}
        </div>

        <TabsContent value="records" className="mt-4">
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
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Expenses</CardTitle>
                <p className="text-lg font-bold text-red-600">Total: ${expenseTotal.toLocaleString()}</p>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? <p className="text-center py-8 text-gray-500">No expenses recorded.</p> : (
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: exp.category?.color || "#6B7280" }} />
                        <div>
                          <p className="font-medium">{exp.description}</p>
                          <p className="text-sm text-gray-500">{exp.category?.name} &bull; {new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">-${exp.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reports Dialog */}
      <Dialog open={showReports} onOpenChange={setShowReports}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />Financial Reports
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Select value={reportYear.toString()} onValueChange={(v) => { setReportYear(parseInt(v)); fetchReport(parseInt(v)); }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={downloadCSV} disabled={!report}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" />
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-600">Total Donations</p>
                    <p className="text-2xl font-bold text-green-700">${report.summary.totalDonations.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-red-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">${report.summary.totalExpenses.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-600">Net Income</p>
                    <p className="text-2xl font-bold text-blue-700">${report.summary.totalNet.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-purple-600">Avg Donation</p>
                    <p className="text-2xl font-bold text-purple-700">${report.summary.averageDonation.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5" />Monthly Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.monthlyBreakdown.map((month) => (
                      <div key={month.month} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium">{month.month}</div>
                        <div className="flex-1">
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                            {month.donations > 0 && (
                              <div
                                className="bg-green-500 h-full"
                                style={{ width: `${Math.min(100, (month.donations / Math.max(...report.monthlyBreakdown.map((m) => Math.max(m.donations, m.expenses)))) * 100)}%` }}
                              />
                            )}
                            {month.expenses > 0 && (
                              <div
                                className="bg-red-500 h-full"
                                style={{ width: `${Math.min(100, (month.expenses / Math.max(...report.monthlyBreakdown.map((m) => Math.max(m.donations, m.expenses)))) * 100)}%` }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="w-32 text-right text-sm">
                          <span className="text-green-600">+${month.donations.toLocaleString()}</span>
                          <span className="text-gray-300 mx-1">|</span>
                          <span className="text-red-600">-${month.expenses.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Trends</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Monthly Donations</span>
                      <span className="font-medium">${report.trends.averageDonations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Monthly Expenses</span>
                      <span className="font-medium">${report.trends.averageExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Best Donation Month</span>
                      <Badge variant="secondary">{report.trends.maxDonationMonth}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Highest Expense Month</span>
                      <Badge variant="outline">{report.trends.maxExpenseMonth}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* By Category */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-4 w-4" />Donations by Campaign</CardTitle></CardHeader>
                  <CardContent>
                    {report.byCategory.length > 0 ? (
                      <div className="space-y-2">
                        {report.byCategory.map((cat, i) => (
                          <div key={cat.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${(i * 360) / report.byCategory.length}, 70%, 50%)` }} />
                              <span className="text-sm">{cat.name}</span>
                            </div>
                            <span className="font-medium">${cat.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No donation data</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Report generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No report data available</p>
          )}
        </DialogContent>
      </Dialog>

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
          <DialogFooter><Button variant="outline" onClick={() => setRecordDialog(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSaveRecord} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={expenseForm.categoryId} onValueChange={(v) => setExpenseForm({ ...expenseForm, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Expense description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($)</Label><Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Date</Label><Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button>
            <Button className="mocha-gradient hover:opacity-90" onClick={async () => {
              if (!expenseForm.categoryId || !expenseForm.description || !expenseForm.amount) return;
              setSaving(true);
              try {
                const res = await fetch("/api/finances/expenses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(expenseForm),
                });
                if (res.ok) { setExpenseDialog(false); fetchExpenses(); }
              } catch (e) { console.error(e); }
              finally { setSaving(false); }
            }} disabled={saving}>{saving ? "Saving..." : "Add Expense"}</Button>
          </DialogFooter>
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
          <DialogFooter><Button variant="outline" onClick={() => setSummaryDialog(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSaveSummary} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Record?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

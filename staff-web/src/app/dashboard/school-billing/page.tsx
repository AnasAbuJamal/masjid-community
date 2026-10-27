"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw, Plus, AlertCircle, CheckCircle } from "lucide-react";

interface StudentChoice {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
}
interface Invoice {
  id: number;
  studentId: number;
  description: string;
  amountCents: number;
  currency: string;
  dueDate: string;
  status: "pending" | "paid" | "refunded" | "void";
  paidAt: string | null;
  createdAt: string;
  student: { firstName: string; lastName: string; studentId: number };
}
interface BillingResponse { invoices: Invoice[]; students: StudentChoice[] }

const currency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function SchoolBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<StudentChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/school/invoices", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to fetch billing records");
      const data: BillingResponse = await response.json();
      setInvoices(data.invoices);
      setStudents(data.students);
      setError("");
    } catch {
      setError("Unable to load school billing. Check your permissions and connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredStudents = useMemo(() => students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.studentId}`.toLowerCase().includes(search.trim().toLowerCase())
  ).slice(0, 100), [students, search]);
  const pending = invoices.filter(invoice => invoice.status === "pending");
  const outstanding = pending.reduce((sum, invoice) => sum + invoice.amountCents, 0);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!studentId || !description.trim() || !dueDate ||
        !Number.isSafeInteger(cents) || cents < 100 || cents > 10_000_000) {
      setError("Select a student, amount between $1 and $100,000, description, and due date.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/school/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(studentId), amountCents: cents,
          description: description.trim(), dueDate: `${dueDate}T12:00:00`,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create invoice");
      setNotice("Invoice created. The family will see it when they open School Payments.");
      setDescription(""); setAmount(""); setDueDate("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invoice could not be created");
    } finally { setSaving(false); }
  }

  async function voidInvoice(invoice: Invoice) {
    if (!window.confirm(`Void invoice #${invoice.id}? This cannot be undone.`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/school/invoices/${invoice.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not void invoice");
      setNotice(`Invoice #${invoice.id} was voided.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to void invoice");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">School Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and review actual tuition and program invoices.</p>
        </div>
        <button type="button" onClick={() => void load()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted">
          <RefreshCw size={17} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Outstanding invoices</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{currency(outstanding)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{pending.length} awaiting payment</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Invoice records</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{invoices.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Most recent 100 records</p>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"><AlertCircle size={18} />{error}</div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm text-foreground"><CheckCircle size={18} />{notice}</div>}

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Plus size={19} /> New Invoice
        </h2>
        <form onSubmit={createInvoice} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Search students
            <input className="block min-h-11 w-full rounded-xl border border-input bg-card p-3 text-base text-foreground"
              placeholder="Search name or student ID" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Student
            <select required value={studentId} onChange={e => setStudentId(e.target.value)}
              className="block min-h-11 w-full rounded-xl border border-input bg-card p-3 text-base text-foreground">
              <option value="">Choose a student</option>
              {filteredStudents.map(student => (
                <option key={student.id} value={String(student.id)}>
                  {student.firstName} {student.lastName} (#{student.studentId})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Description
            <input required maxLength={300} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Tuition or program charge" className="block min-h-11 w-full rounded-xl border border-input bg-card p-3 text-base text-foreground" />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Amount (USD)
            <input type="number" min="1" max="100000" step="0.01" required value={amount}
              onChange={e => setAmount(e.target.value)}
              className="block min-h-11 w-full rounded-xl border border-input bg-card p-3 text-base text-foreground" />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Due date
            <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="block min-h-11 w-full rounded-xl border border-input bg-card p-3 text-base text-foreground" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving}
              className="min-h-11 w-full rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : "Create invoice"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <FileText size={19} /> Recent Invoices
        </h2>
        {loading ? <p role="status" className="text-sm text-muted-foreground">Loading invoices…</p>
          : invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices have been issued.</p>
          : <div className="grid gap-3 sm:grid-cols-2">
              {invoices.map(invoice => (
                <article key={invoice.id} className="min-w-0 space-y-3 rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{invoice.description}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invoice.student.firstName} {invoice.student.lastName} · #{invoice.student.studentId}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">{currency(invoice.amountCents)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    <span className="capitalize text-foreground">{invoice.status}</span>
                  </div>
                  {invoice.status === "pending" && (
                    <button type="button" onClick={() => void voidInvoice(invoice)} disabled={saving}
                      className="min-h-11 rounded-xl border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50">
                      Void invoice
                    </button>
                  )}
                </article>
              ))}
            </div>}
      </section>
    </div>
  );
}

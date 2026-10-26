"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, Plus, RefreshCw, Trash2, Pencil } from "lucide-react";

interface Category { id: number; name: string }
interface Budget {
  id: number;
  categoryId: number;
  year: number;
  month: number;
  allocated: number;
  isPublished: boolean;
  category: { name: string; color: string | null };
}
interface Form {
  categoryId: string; year: string; month: string; allocated: string; isPublished: boolean;
}
const today = new Date();
const blank: Form = {
  categoryId: "", year: String(today.getFullYear()),
  month: String(today.getMonth() + 1), allocated: "", isPublished: false,
};
const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function FinanceBudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/finances/budgets", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to read budgets");
      const data = await response.json();
      setBudgets(data.budgets);
      setCategories(data.categories);
      setError("");
    } catch {
      setError("Budget data is unavailable. Check your permissions.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/finances/budgets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: Number(form.categoryId), year: Number(form.year), month: Number(form.month),
          allocated: Number(form.allocated), isPublished: form.isPublished,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save budget");
      setNotice("Monthly budget saved.");
      setForm(blank); await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save budget");
    } finally { setSaving(false); }
  }

  function edit(budget: Budget) {
    setForm({
      categoryId: String(budget.categoryId),
      year: String(budget.year), month: String(budget.month),
      allocated: String(budget.allocated), isPublished: budget.isPublished,
    });
    setError(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(budget: Budget) {
    if (!window.confirm(`Delete the budget for ${budget.category.name} in ${budget.year}-${budget.month}?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/finances/budgets/${budget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete budget");
      setNotice("Budget deleted."); await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete budget");
    } finally { setSaving(false); }
  }

  const input = "min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground";
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <Wallet size={26} /> Monthly Budgets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and publish budget allocations. Actual spending comes from recorded expenses.
          </p>
        </div>
        <button onClick={() => void load()} type="button"
          className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm text-foreground hover:bg-muted">
          <RefreshCw size={17} /> Refresh
        </button>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-border bg-card p-3 text-foreground">{notice}</div>}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Set category budget</h2>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm font-medium text-foreground">
            Category
            <select className={input} required value={form.categoryId}
              onChange={e => setForm(v => ({ ...v, categoryId: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-foreground">
            Year
            <input className={input} required type="number" min={2020} max={2100}
              value={form.year} onChange={e => setForm(v => ({ ...v, year: e.target.value }))} />
          </label>
          <label className="space-y-1 text-sm font-medium text-foreground">
            Month
            <select className={input} required value={form.month}
              onChange={e => setForm(v => ({ ...v, month: e.target.value }))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {new Date(2026, i, 1).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-foreground">
            Allocation (USD)
            <input className={input} required type="number" min={0} max={100000000} step="0.01"
              value={form.allocated} onChange={e => setForm(v => ({ ...v, allocated: e.target.value }))} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isPublished}
              onChange={e => setForm(v => ({ ...v, isPublished: e.target.checked }))} />
            Publish in community financial report
          </label>
          <div className="flex items-end sm:col-span-1 lg:col-span-3">
            <button disabled={saving} type="submit"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">
              <Plus size={16} /> {saving ? "Saving…" : "Save budget"}
            </button>
          </div>
        </form>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Budget allocations</h2>
        {loading ? <p role="status" className="text-sm text-muted-foreground">Loading budgets…</p>
          : budgets.length === 0 ? <p className="text-sm text-muted-foreground">No monthly budgets have been recorded.</p>
          : <div className="grid gap-3 sm:grid-cols-2">
              {budgets.map(budget => (
                <article key={budget.id} className="min-w-0 rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{budget.category.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(budget.year, budget.month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">{money(budget.allocated)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {budget.isPublished ? "Published to community" : "Private draft"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => edit(budget)} disabled={saving} type="button"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-foreground hover:bg-muted">
                      <Pencil size={15} /> Edit
                    </button>
                    <button onClick={() => void remove(budget)} disabled={saving} type="button"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-foreground hover:bg-muted">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>}
      </section>
    </div>
  );
}

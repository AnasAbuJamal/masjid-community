"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from "lucide-react";

const TYPES = ["video", "document", "link", "audio", "image"] as const;
type ResourceType = typeof TYPES[number];
interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ResourceType;
  url: string;
  tags: string[];
  gradeLevels: string[];
  createdBy?: string;
  duration?: number;
  fileSize?: number;
  isFeatured: boolean;
  isPublished: boolean;
  viewCount: number;
}
interface EditableResource {
  title: string; description: string; category: string; type: ResourceType; url: string;
  tags: string; gradeLevels: string; createdBy: string;
  isFeatured: boolean; isPublished: boolean;
}
const empty: EditableResource = {
  title: "", description: "", category: "", type: "link", url: "",
  tags: "", gradeLevels: "", createdBy: "", isFeatured: false, isPublished: false,
};
const format = (r: Resource): EditableResource => ({
  title: r.title, description: r.description, category: r.category, type: r.type,
  url: r.url, tags: r.tags.join(", "), gradeLevels: r.gradeLevels.join(", "),
  createdBy: r.createdBy ?? "", isFeatured: r.isFeatured, isPublished: r.isPublished,
});

export default function ResourcesDashboard() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EditableResource>(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/resources", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load resources");
      const json = await response.json();
      setResources(json.resources);
      setError("");
    } catch {
      setError("Unable to retrieve educational resources. Check your access and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => resources.filter(r => {
    const search = query.trim().toLowerCase();
    return !search || [r.title, r.category, r.type, r.description].some(v => v.toLowerCase().includes(search));
  }), [resources, query]);

  const change = (key: keyof EditableResource, value: string | boolean) => {
    setForm(current => ({ ...current, [key]: value }));
  };
  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); setError(""); setNotice(""); };
  const openEdit = (r: Resource) => {
    setEditing(r.id); setForm(format(r)); setShowForm(true); setError(""); setNotice("");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const data = {
        ...form,
        title: form.title.trim(), category: form.category.trim(),
        description: form.description.trim(), url: form.url.trim(),
        createdBy: form.createdBy.trim(),
        tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        gradeLevels: form.gradeLevels.split(",").map(level => level.trim()).filter(Boolean),
        thumbnailUrl: null, duration: null, fileSize: null,
      };
      const response = await fetch(editing ? `/api/admin/resources/${editing}` : "/api/admin/resources", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save resource");
      setNotice(editing ? "Resource updated." : "Resource created.");
      setShowForm(false); setEditing(null); setForm(empty);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save resource");
    } finally { setSaving(false); }
  };

  const remove = async (r: Resource) => {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/resources/${r.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete resource");
      setNotice("Resource deleted.");
      await load();
    } catch {
      setError("Could not delete this resource. Try again.");
    } finally { setSaving(false); }
  };

  const inputClass = "block w-full min-h-11 rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <BookOpen className="h-7 w-7" /> School Resources
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Curate and publish educational links for phones, tablets and computers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void load()} type="button"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted">
            <RefreshCw size={17} /> Refresh
          </button>
          <button onClick={openNew} type="button"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <Plus size={17} /> Add Resource
          </button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-border bg-card p-3 text-foreground">{notice}</div>}

      {showForm && (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit resource" : "Add educational resource"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Resources are unpublished until you enable the Publish checkbox.</p>
          <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-foreground">
              Title
              <input className={inputClass} required maxLength={180} value={form.title}
                onChange={e => change("title", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Category
              <input className={inputClass} required maxLength={90} value={form.category}
                onChange={e => change("category", e.target.value)} placeholder="Quran, Arabic, Islamic Studies…" />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Resource type
              <select className={inputClass} value={form.type} onChange={e => change("type", e.target.value)}>
                {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Secure resource URL (HTTPS)
              <input className={inputClass} type="url" required pattern="https://.*" value={form.url}
                onChange={e => change("url", e.target.value)} placeholder="https://example.org/resource" />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground md:col-span-2">
              Description
              <textarea className={inputClass} rows={3} maxLength={3000} value={form.description}
                onChange={e => change("description", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Tags (comma separated)
              <input className={inputClass} value={form.tags}
                onChange={e => change("tags", e.target.value)} placeholder="Beginner, tajweed" />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Grade levels (comma separated)
              <input className={inputClass} value={form.gradeLevels}
                onChange={e => change("gradeLevels", e.target.value)} placeholder="All, Grade 1" />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Instructor or creator
              <input className={inputClass} maxLength={120} value={form.createdBy}
                onChange={e => change("createdBy", e.target.value)} />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={form.isPublished}
                  onChange={e => change("isPublished", e.target.checked)} /> Publish
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={form.isFeatured}
                  onChange={e => change("isFeatured", e.target.checked)} /> Featured
              </label>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50" type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Resource"}
              </button>
              <button className="min-h-11 rounded-xl border border-border px-5 font-medium text-foreground hover:bg-muted" type="button" disabled={saving}
                onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Resource Library ({filtered.length})</h2>
          <input aria-label="Search resources" placeholder="Search resources"
            className={inputClass + " max-w-sm"} value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        {loading ? <p role="status" className="text-sm text-muted-foreground">Loading resources…</p>
          : filtered.length === 0 ? <p className="text-sm text-muted-foreground">No resources match these filters.</p>
          : <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map(resource => (
                <article key={resource.id} className="min-w-0 space-y-3 rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">{resource.category} · {resource.type}</p>
                    </div>
                    <span className={resource.isPublished
                      ? "rounded-lg bg-muted px-2 py-1 text-xs text-foreground"
                      : "rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground"}>
                      {resource.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={resource.url} rel="noopener noreferrer" target="_blank"
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-primary hover:bg-muted">
                      <ExternalLink size={16} /> Open
                    </a>
                    <button onClick={() => openEdit(resource)} disabled={saving} type="button"
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-foreground hover:bg-muted">
                      <Pencil size={16} /> Edit
                    </button>
                    <button onClick={() => void remove(resource)} disabled={saving} type="button"
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-red-700 hover:bg-muted dark:text-red-300">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>}
      </section>
    </div>
  );
}

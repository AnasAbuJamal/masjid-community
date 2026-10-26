"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, RefreshCw, Info } from "lucide-react";

type ConfigKey = "site_name" | "site_tagline" | "contact_email" | "contact_phone" |
  "address" | "kiosk_rotation_interval";
type Config = Record<ConfigKey, string>;

const empty: Config = {
  site_name: "Masjid Al-Momineen", site_tagline: "", contact_email: "",
  contact_phone: "", address: "", kiosk_rotation_interval: "8",
};

const FIELDS: { key: ConfigKey; label: string; description: string;
  maxLength: number; inputType?: string }[] = [
  { key: "site_name", label: "Masjid name", description: "Shown on public kiosk displays", maxLength: 120 },
  { key: "site_tagline", label: "Tagline", description: "A short community description", maxLength: 250 },
  { key: "contact_email", label: "Public contact email", description: "Email shown to members", maxLength: 254, inputType: "email" },
  { key: "contact_phone", label: "Public phone", description: "Phone number for the office", maxLength: 80, inputType: "tel" },
  { key: "address", label: "Public location", description: "Office address; leave blank if not published", maxLength: 400 },
  { key: "kiosk_rotation_interval", label: "Kiosk slide interval (seconds)",
    description: "Between 5 and 60 seconds", maxLength: 2, inputType: "number" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Config>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) throw new Error("Settings unavailable");
      const data = await response.json() as { settings: Partial<Config> };
      setSettings({ ...empty, ...data.settings });
      setError("");
    } catch {
      setError("Unable to load saved settings. Check your administrator access and connection.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function change(key: ConfigKey, value: string) {
    setSettings(old => ({ ...old, [key]: value }));
    setNotice("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save settings");
      setNotice("Public masjid settings saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save settings");
    } finally { setSaving(false); }
  }

  const inputStyle = "mt-2 block min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <SettingsIcon size={27} /> Masjid Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            These details are saved in the database and shared across public and TV displays.
          </p>
        </div>
        <button type="button" onClick={() => void load()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 font-medium text-foreground hover:bg-muted">
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-border bg-card p-4 text-foreground">{notice}</div>}

      {loading ? <p role="status" className="py-12 text-center text-muted-foreground">Loading saved settings…</p>
        : <form onSubmit={save} className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            {FIELDS.map(field => (
              <label key={field.key} className="text-sm font-semibold text-foreground">
                {field.label}
                <input className={inputStyle} type={field.inputType || "text"}
                  min={field.key === "kiosk_rotation_interval" ? 5 : undefined}
                  max={field.key === "kiosk_rotation_interval" ? 60 : undefined}
                  maxLength={field.maxLength}
                  required={field.key === "site_name" || field.key === "kiosk_rotation_interval"}
                  value={settings[field.key]}
                  onChange={event => change(field.key, event.target.value)} />
                <span className="mt-1 block text-xs font-normal text-muted-foreground">{field.description}</span>
              </label>
            ))}
          </div>
          <div className="mt-6 flex gap-2 rounded-xl bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
            <Info size={19} className="shrink-0" />
            Changes to authentication rules, system maintenance, notification delivery and backups must be
            configured and verified separately. This screen does not claim to control those infrastructure services.
          </div>
          <button type="submit" disabled={saving}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Save size={17} /> {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>}
    </div>
  );
}

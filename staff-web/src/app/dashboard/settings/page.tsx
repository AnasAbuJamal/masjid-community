"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface SettingsGroup {
  title: string;
  icon: string;
  settings: { key: string; label: string; type: "text" | "boolean" | "number"; }[];
}

const settingsGroups: SettingsGroup[] = [
  {
    title: "General",
    icon: "🕌",
    settings: [
      { key: "mosque_name", label: "Mosque Name", type: "text" },
      { key: "mosque_address", label: "Address", type: "text" },
      { key: "mosque_phone", label: "Phone", type: "text" },
      { key: "mosque_email", label: "Email", type: "text" },
      { key: "timezone", label: "Timezone", type: "text" },
    ],
  },
  {
    title: "Kiosk Mode",
    icon: "📺",
    settings: [
      { key: "kiosk_auto_refresh", label: "Auto Refresh Interval (seconds)", type: "number" },
      { key: "kiosk_show_donations", label: "Show Donation QR Code", type: "boolean" },
      { key: "kiosk_show_construction", label: "Show Construction Progress", type: "boolean" },
      { key: "kiosk_scroll_speed", label: "Announcement Scroll Speed", type: "number" },
    ],
  },
  {
    title: "Notifications",
    icon: "🔔",
    settings: [
      { key: "notify_new_donation", label: "Notify on New Donation", type: "boolean" },
      { key: "notify_new_volunteer", label: "Notify on Volunteer Signup", type: "boolean" },
      { key: "notify_new_proposal", label: "Notify on New Proposal", type: "boolean" },
      { key: "notification_email", label: "Notification Email", type: "text" },
    ],
  },
  {
    title: "Security",
    icon: "🔒",
    settings: [
      { key: "session_timeout", label: "Session Timeout (minutes)", type: "number" },
      { key: "require_2fa", label: "Require Two-Factor Authentication", type: "boolean" },
      { key: "max_login_attempts", label: "Max Login Attempts", type: "number" },
      { key: "password_min_length", label: "Min Password Length", type: "number" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data.settings || {});
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* empty */ } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure site settings and preferences</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Theme Toggle Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5 text-blue-400" /> : <Sun className="h-5 w-5 text-yellow-500" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark color scheme</p>
            </div>
            <div className="flex items-center gap-3">
              <Sun className="h-4 w-4 text-gray-400" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {settingsGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{group.icon}</span>{group.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <Label className="text-gray-700 dark:text-gray-300 font-medium">{setting.label}</Label>
                  {setting.type === "boolean" ? (
                    <Switch
                      checked={settings[setting.key] === "true"}
                      onCheckedChange={(checked) => updateSetting(setting.key, checked ? "true" : "false")}
                    />
                  ) : setting.type === "number" ? (
                    <Input
                      type="number"
                      className="w-48"
                      value={settings[setting.key] || ""}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      className="w-80"
                      value={settings[setting.key] || ""}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

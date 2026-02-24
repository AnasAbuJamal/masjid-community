import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Bell, Palette, Shield, Database, Tv } from "lucide-react";

async function getSettings() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return settingsMap;
  } catch {
    return {};
  }
}

export default async function SettingsPage() {
  const settings = await getSettings();

  const categories = [
    {
      title: "General",
      icon: Globe,
      settings: [
        { key: "masjidName", label: "Masjid Name", value: settings.masjidName || "Masjid Al-Momineen" },
        { key: "address", label: "Address", value: settings.address || "Not set" },
        { key: "phone", label: "Phone", value: settings.phone || "Not set" },
      ],
    },
    {
      title: "Kiosk Mode",
      icon: Tv,
      settings: [
        { key: "kioskEnabled", label: "Kiosk Enabled", value: settings.kioskEnabled === "true" ? "Yes" : "No" },
        { key: "donationPortalUrl", label: "Donation URL", value: settings.donationPortalUrl || "/donate" },
        { key: "kioskTheme", label: "Theme", value: settings.kioskTheme || "dark" },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        { key: "prayerReminders", label: "Prayer Reminders", value: settings.prayerReminders === "false" ? "Disabled" : "Enabled" },
        { key: "announcementAlerts", label: "Announcement Alerts", value: settings.announcementAlerts === "false" ? "Disabled" : "Enabled" },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      settings: [
        { key: "maintenanceMode", label: "Maintenance Mode", value: settings.maintenanceMode === "true" ? "On" : "Off" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure site settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{setting.label}</span>
                    <Badge variant="outline">{setting.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

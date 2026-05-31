"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Heart, QrCode, Calendar } from "lucide-react";

interface PrayerTimes {
  fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string;
  jummah1?: string; jummah2?: string;
}

interface Announcement {
  id: string; title: string; message: string; type: string;
}

interface ConstructionProject {
  id: string; title: string; progressPercent: number;
}

interface KioskContent {
  bannerImage: string | null;
  masjidName: string;
  welcomeMessage: string | null;
  donationEnabled: boolean;
  donationUrl: string | null;
  footerText: string | null;
}

interface KioskData {
  prayers: PrayerTimes | null;
  announcements: Announcement[];
  projects: ConstructionProject[];
  settings: Record<string, string>;
  kioskContent: KioskContent | null;
}

function getNextPrayer(prayers: PrayerTimes | null) {
  if (!prayers) return null;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const prayerTimes = [
    { name: "Fajr", time: prayers.fajr },
    { name: "Dhuhr", time: prayers.dhuhr },
    { name: "Asr", time: prayers.asr },
    { name: "Maghrib", time: prayers.maghrib },
    { name: "Isha", time: prayers.isha },
  ];

  for (const prayer of prayerTimes) {
    const [h, m] = prayer.time.split(":").map(Number);
    if (h * 60 + m > currentTime) return { name: prayer.name, time: prayer.time };
  }
  return { name: "Fajr", time: prayers.fajr };
}

export default function KioskTVPage() {
  const [data, setData] = useState<KioskData | null>(null);
  const [time, setTime] = useState(new Date());
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/kiosk/schedule");
      const result = await res.json();
      if (result.announcements) {
        setData((prev) => prev ? { ...prev, announcements: result.announcements } : null);
      }
    } catch { /* empty */ }
  }, []);

  const fetchFullData = useCallback(async () => {
    try {
      const res = await fetch("/api/kiosk/tv-data");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const [projectsRes, settingsRes, contentRes] = await Promise.all([
          fetch("/api/public/construction"),
          fetch("/api/settings"),
          fetch("/api/kiosk/content"),
        ]);
        const projects = await projectsRes.json();
        const settings = await settingsRes.json();
        let kioskContent = null;
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          kioskContent = contentData.content || null;
        }
        setData({
          prayers: null,
          announcements: [],
          projects: projects.projects || [],
          settings: settings.settings || {},
          kioskContent,
        });
      }
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    fetchFullData();
    const interval = setInterval(() => {
      setTime(new Date());
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchFullData, fetchData]);

  // Rotate announcements
  useEffect(() => {
    if (!data?.announcements?.length) return;
    const annInterval = setInterval(() => {
      setCurrentAnnIndex((prev) => (prev + 1) % data.announcements.length);
    }, 10000);
    return () => clearInterval(annInterval);
  }, [data?.announcements?.length]);

  const content = data?.kioskContent;
  const masjidName = content?.masjidName || "Masjid Al-Momineen";
  const welcomeMessage = content?.welcomeMessage || "";
  const donationUrl = content?.donationUrl || data?.settings?.donationPortalUrl || "masjidalmomineen.com/donate";
  const footerText = content?.footerText || "";
  const bannerImage = content?.bannerImage || "";
  const donationEnabled = content?.donationEnabled !== false;

  const nextPrayer = getNextPrayer(data?.prayers || null);
  const today = time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const avgProgress = data?.projects?.length
    ? Math.round(data.projects.reduce((acc, p) => acc + p.progressPercent, 0) / data.projects.length)
    : 0;

  const currentAnn = data?.announcements?.[currentAnnIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Header */}
        <div
          className="col-span-12 flex items-center justify-between bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-6"
          style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          <div className={bannerImage ? "bg-black/40 p-4 rounded-xl" : ""}>
            <h1 className="text-4xl font-bold">{masjidName}</h1>
            {welcomeMessage && <p className="text-emerald-200 text-lg mt-1">{welcomeMessage}</p>}
            <p className="text-emerald-200 text-xl mt-1">{today}</p>
            <p className="text-emerald-300 text-lg mt-1">{currentTime}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-emerald-300">Next Prayer</h2>
            {nextPrayer ? (
              <>
                <p className="text-5xl font-bold">{nextPrayer.name}</p>
                <p className="text-emerald-200 text-xl">{nextPrayer.time}</p>
              </>
            ) : (
              <p className="text-3xl">-</p>
            )}
          </div>
        </div>

        {/* Prayer Times */}
        <div className="col-span-7 bg-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-400" />
            Prayer Times
          </h2>
          {data?.prayers ? (
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: "Fajr", time: data.prayers.fajr },
                { name: "Sunrise", time: data.prayers.sunrise },
                { name: "Dhuhr", time: data.prayers.dhuhr },
                { name: "Asr", time: data.prayers.asr },
                { name: "Maghrib", time: data.prayers.maghrib },
                { name: "Isha", time: data.prayers.isha },
                { name: "Jummah 1", time: data.prayers.jummah1 || "-" },
                { name: "Jummah 2", time: data.prayers.jummah2 || "-" },
              ].map((p) => (
                <div key={p.name} className="bg-gray-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">{p.name}</p>
                  <p className="text-2xl font-bold">{p.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Prayer times not set</p>
          )}
        </div>

        {/* Donation QR */}
        {donationEnabled && (
          <div className="col-span-5 bg-gradient-to-br from-emerald-700 to-teal-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Heart className="h-6 w-6" />
              Support the Masjid
            </h2>
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center">
                <QrCode className="h-20 w-20 text-gray-800" />
              </div>
              <p className="mt-4 text-xl font-semibold">Scan to Donate</p>
              <p className="text-emerald-200">{donationUrl}</p>
            </div>
          </div>
        )}

        {/* Announcements */}
        <div className="col-span-7 bg-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-400" />
            Announcements
          </h2>
          {currentAnn ? (
            <div className="bg-gray-700 rounded-xl p-6 min-h-[180px] flex flex-col justify-center">
              <h3 className="font-bold text-2xl mb-2">{currentAnn.title}</h3>
              <p className="text-gray-300 text-lg">{currentAnn.message}</p>
              <div className="flex gap-1 mt-4 justify-center">
                {data.announcements.map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full ${i === currentAnnIndex ? "bg-emerald-400" : "bg-gray-600"}`} />
                ))}
              </div>
            </div>
          ) : data?.announcements?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No announcements</p>
          ) : (
            <p className="text-gray-500 text-center py-8">Loading announcements...</p>
          )}
        </div>

        {/* Construction Progress */}
        <div className="col-span-5 bg-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-6 w-6 text-orange-400" />
            Construction Progress
          </h2>
          {data?.projects?.length > 0 ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-6xl font-bold text-orange-400">{avgProgress}%</p>
                <p className="text-gray-400">Overall Progress</p>
              </div>
              {data.projects.slice(0, 3).map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{project.title}</span>
                    <span>{project.progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${project.progressPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No projects</p>
          )}
        </div>

        {/* Footer */}
        <div className="col-span-12 bg-gray-800 rounded-2xl p-4 text-center">
          <p className="text-gray-400">
            {footerText || `${masjidName} \u2022 ${data?.settings?.mosque_address || "1234 Peachtree Rd, Atlanta, GA"} \u2022 ${data?.settings?.mosque_phone || "(404) 555-0000"}`}
          </p>
        </div>
      </div>
    </div>
  );
}

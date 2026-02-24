import prisma from "@/lib/prisma";
import { Clock, Calendar, Heart, QrCode, MapPin, Phone } from "lucide-react";
import QRCode from "qrcode";

async function getKioskData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [prayers, announcements, projects, settings] = await Promise.all([
      prisma.prayerTime.findFirst({
        where: { date: { gte: today } },
        orderBy: { date: "asc" },
      }),
      prisma.kioskAnnouncement.findMany({
        where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        orderBy: { priority: "desc" },
        take: 3,
      }),
      prisma.constructionProject.findMany({ orderBy: { progressPercent: "desc" } }),
      prisma.siteSetting.findMany(),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return { prayers, announcements, projects, settings: settingsMap };
  } catch {
    return { prayers: null, announcements: [], projects: [], settings: {} };
  }
}

function getNextPrayer(prayers: { fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string } | null) {
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
    if (h * 60 + m > currentTime) {
      return { name: prayer.name, time: prayer.time };
    }
  }
  return { name: "Fajr", time: prayers.fajr };
}

export default async function KioskTVPage() {
  const { prayers, announcements, projects, settings } = await getKioskData();
  const nextPrayer = getNextPrayer(prayers);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length)
    : 0;

  const donationUrl = settings.donationPortalUrl || "/donate";
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(donationUrl, { width: 150, margin: 1 });
  } catch {}

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Header */}
        <div className="col-span-12 flex items-center justify-between bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-6">
          <div>
            <h1 className="text-4xl font-bold">Masjid Al-Momineen</h1>
            <p className="text-emerald-200 text-xl mt-1">{today}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-emerald-300">Next Prayer</h2>
            {nextPrayer ? (
              <>
                <p className="text-5xl font-bold">{nextPrayer.name}</p>
                <p className="text-emerald-200 text-xl">{nextPrayer.time}</p>
              </>
            ) : (
              <p className="text-3xl">Not Set</p>
            )}
          </div>
        </div>

        {/* Prayer Times */}
        <div className="col-span-7 bg-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-400" />
            Prayer Times
          </h2>
          {prayers ? (
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: "Fajr", time: prayers.fajr },
                { name: "Sunrise", time: prayers.sunrise },
                { name: "Dhuhr", time: prayers.dhuhr },
                { name: "Asr", time: prayers.asr },
                { name: "Maghrib", time: prayers.maghrib },
                { name: "Isha", time: prayers.isha },
                { name: "Jummah 1", time: prayers.jummah1 || "-" },
                { name: "Jummah 2", time: prayers.jummah2 || "-" },
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
        <div className="col-span-5 bg-gradient-to-br from-emerald-700 to-teal-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-6 w-6" />
            Support the Masjid
          </h2>
          <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Donation QR" className="w-40 h-40 rounded-xl bg-white p-2" />
            ) : (
              <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center">
                <QrCode className="h-20 w-20 text-gray-800" />
              </div>
            )}
            <p className="mt-4 text-xl font-semibold">Scan to Donate</p>
            <p className="text-emerald-200">{donationUrl}</p>
          </div>
        </div>

        {/* Announcements */}
        <div className="col-span-7 bg-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-400" />
            Announcements
          </h2>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-gray-700 rounded-xl p-4">
                  <h3 className="font-semibold text-lg">{ann.title}</h3>
                  <p className="text-gray-400 mt-1">{ann.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No announcements</p>
          )}
        </div>

        {/* Construction Progress */}
        <div className="col-span-5 bg-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-6 w-6 text-orange-400" />
            Construction Progress
          </h2>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-6xl font-bold text-orange-400">{avgProgress}%</p>
              <p className="text-gray-400">Overall Progress</p>
            </div>
            {projects.slice(0, 3).map((project) => (
              <div key={project.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{project.title}</span>
                  <span>{project.progressPercent}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="col-span-12 bg-gray-800 rounded-2xl p-4 text-center">
          <p className="text-gray-400">
            Masjid Al-Momineen • 1234 Peachtree Rd, Atlanta, GA • (404) 555-0000
          </p>
        </div>
      </div>
    </div>
  );
}

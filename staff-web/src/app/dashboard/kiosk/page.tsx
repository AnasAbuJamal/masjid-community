import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tv, ExternalLink, Calendar, Clock, Heart, AlertTriangle, Megaphone } from "lucide-react";
import Link from "next/link";

async function getKioskData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [prayers, announcements, projects] = await Promise.all([
      prisma.prayerTime.findFirst({
        where: { date: { gte: today } },
        orderBy: { date: "asc" },
      }),
      prisma.kioskAnnouncement.findMany({
        where: { isActive: true },
        orderBy: { priority: "desc" },
        take: 5,
      }),
      prisma.constructionProject.findMany({
        orderBy: { progressPercent: "desc" },
      }),
    ]);
    return { prayers, announcements, projects };
  } catch {
    return { prayers: null, announcements: [], projects: [] };
  }
}

export default async function KioskPage() {
  const { prayers, announcements, projects } = await getKioskData();
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kiosk / TV Mode</h1>
          <p className="text-gray-500 mt-1">Digital signage for mosque lobby TVs</p>
        </div>
        <Link href="/kiosk/tv" target="_blank">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Tv className="h-4 w-4 mr-2" />
            Open TV Display
          </Button>
        </Link>
      </div>

      {/* Preview */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            TV Display Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Tv className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Click &quot;Open TV Display&quot; to view</p>
              <p className="text-sm mt-2">Runs at /kiosk/tv</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Prayer Times</p>
                <p className="text-2xl font-bold">{prayers ? "Available" : "Not Set"}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Announcements</p>
                <p className="text-2xl font-bold text-purple-600">{announcements.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Construction Progress</p>
                <p className="text-2xl font-bold text-orange-600">{avgProgress}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Active Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No active announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{ann.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{ann.message}</p>
                    </div>
                    <Badge variant="outline">{ann.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

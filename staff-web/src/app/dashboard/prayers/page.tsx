import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Plus, Clock, Calendar } from "lucide-react";

async function getPrayerTimes() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [prayers, thisMonth] = await Promise.all([
      prisma.prayerTime.findMany({
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.prayerTime.findMany({
        where: {
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
          },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return { prayers, thisMonth, today: today.toISOString().split("T")[0] };
  } catch {
    return { prayers: [], thisMonth: [], today: new Date().toISOString().split("T")[0] };
  }
}

export default async function PrayerTimesPage() {
  const { prayers, thisMonth, today } = await getPrayerTimes();
  const todayPrayer = prayers.find((p) => p.date.toISOString().split("T")[0] === today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prayer Times</h1>
          <p className="text-gray-500 mt-1">Manage daily prayer times for the mosque</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Prayer Times
        </Button>
      </div>

      {/* Today's Prayer Times */}
      {todayPrayer && (
        <Card className="border-gray-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Today&apos;s Prayer Times
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: "Fajr", time: todayPrayer.fajr },
                { name: "Sunrise", time: todayPrayer.sunrise },
                { name: "Dhuhr", time: todayPrayer.dhuhr },
                { name: "Asr", time: todayPrayer.asr },
                { name: "Maghrib", time: todayPrayer.maghrib },
                { name: "Isha", time: todayPrayer.isha },
                { name: "Jummah", time: todayPrayer.jummah1 || "N/A" },
              ].map((prayer) => (
                <div
                  key={prayer.name}
                  className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <p className="text-sm font-medium text-gray-500">{prayer.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{prayer.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prayer Times Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            All Prayer Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fajr</TableHead>
                <TableHead>Sunrise</TableHead>
                <TableHead>Dhuhr</TableHead>
                <TableHead>Asr</TableHead>
                <TableHead>Maghrib</TableHead>
                <TableHead>Isha</TableHead>
                <TableHead>Jummah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No prayer times found. Add your first entry.
                  </TableCell>
                </TableRow>
              ) : (
                prayers.map((prayer) => (
                  <TableRow key={prayer.id}>
                    <TableCell className="font-medium">
                      {prayer.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{prayer.fajr}</TableCell>
                    <TableCell>{prayer.sunrise}</TableCell>
                    <TableCell>{prayer.dhuhr}</TableCell>
                    <TableCell>{prayer.asr}</TableCell>
                    <TableCell>{prayer.maghrib}</TableCell>
                    <TableCell>{prayer.isha}</TableCell>
                    <TableCell>
                      {prayer.jummah1 ? (
                        <div className="flex gap-1">
                          <Badge variant="outline">{prayer.jummah1}</Badge>
                          {prayer.jummah2 && <Badge variant="outline">{prayer.jummah2}</Badge>}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

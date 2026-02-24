import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal, Crown } from "lucide-react";

async function getLeaderboard() {
  try {
    const students = await prisma.student.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        totalPoints: true,
        currentLevel: true,
        attendanceRate: true,
      },
      orderBy: { totalPoints: "desc" },
      take: 20,
    });
    return students;
  } catch {
    return [];
  }
}

const levelIcons: Record<number, React.ElementType> = {
  1: Star,
  2: Medal,
  3: Crown,
  4: Trophy,
};

const levelColors: Record<number, string> = {
  1: "text-gray-400",
  2: "text-blue-400",
  3: "text-purple-400",
  4: "text-yellow-400",
};

export default async function GamificationPage() {
  const leaderboard = await getLeaderboard();
  const totalPoints = leaderboard.reduce((acc, s) => acc + s.totalPoints, 0);
  const avgAttendance = leaderboard.length > 0
    ? leaderboard.reduce((acc, s) => acc + s.attendanceRate, 0) / leaderboard.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gamification</h1>
        <p className="text-gray-500 mt-1">Student leaderboard and achievements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Points Distributed</p>
                <p className="text-3xl font-bold text-yellow-600">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Attendance</p>
                <p className="text-3xl font-bold text-green-600">{avgAttendance.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-3xl font-bold text-blue-600">{leaderboard.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Medal className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Student Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No students found.</p>
            ) : (
              leaderboard.map((student, index) => {
                const LevelIcon = levelIcons[student.currentLevel] || Star;
                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0 ? "bg-yellow-50 border border-yellow-200" :
                      index === 1 ? "bg-gray-50 border border-gray-200" :
                      index === 2 ? "bg-orange-50 border border-orange-200" :
                      "bg-white border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-yellow-400 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-orange-400 text-white" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          STU-{student.studentId.slice(-4).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Attendance</p>
                        <p className="font-semibold">{student.attendanceRate.toFixed(0)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Level</p>
                        <LevelIcon className={`h-5 w-5 ${levelColors[student.currentLevel]}`} />
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm text-gray-500">Points</p>
                        <p className="font-bold text-lg text-yellow-600">{student.totalPoints.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

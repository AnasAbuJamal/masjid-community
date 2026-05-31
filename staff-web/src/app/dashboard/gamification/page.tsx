"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Trophy, Star, Medal, Crown } from "lucide-react";

interface Student {
  id: number; firstName: string; lastName: string; studentId: number;
  totalPoints: number; currentLevel: number; attendanceRate: number;
}

const levelIcons: Record<number, React.ElementType> = { 1: Star, 2: Medal, 3: Crown, 4: Trophy };
const levelColors: Record<number, string> = { 1: "text-gray-400", 2: "text-blue-400", 3: "text-purple-400", 4: "text-yellow-400" };
const levelNames: Record<number, string> = { 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Champion" };

export default function GamificationPage() {
  const [leaderboard, setLeaderboard] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsDialog, setPointsDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(10);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/classroom/students");
      const data = await res.json();
      const students = (data.students || []).sort((a: Student, b: Student) => b.totalPoints - a.totalPoints);
      setLeaderboard(students);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const totalPoints = leaderboard.reduce((acc, s) => acc + s.totalPoints, 0);
  const avgAttendance = leaderboard.length > 0 ? leaderboard.reduce((acc, s) => acc + s.attendanceRate, 0) / leaderboard.length : 0;

  const openPointsDialog = (s: Student) => { setSelectedStudent(s); setPointsToAdd(10); setPointsDialog(true); };
  
  const handleAddPoints = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      await fetch(`/api/classroom/students/${selectedStudent.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPoints: selectedStudent.totalPoints + pointsToAdd }),
      });
      setPointsDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Gamification</h1><p className="text-gray-500 mt-1">Student leaderboard and achievements</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Points Distributed</p><p className="text-3xl font-bold text-yellow-600">{totalPoints.toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Trophy className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Average Attendance</p><p className="text-3xl font-bold text-green-600">{avgAttendance.toFixed(1)}%</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Star className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active Students</p><p className="text-3xl font-bold text-blue-600">{leaderboard.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Medal className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map((idx) => {
            const student = leaderboard[idx];
            const LevelIcon = levelIcons[student.currentLevel] || Star;
            const medals = ["🥈", "🥇", "🥉"];
            return (
              <Card key={student.id} className={`text-center ${idx === 0 ? "border-yellow-300 bg-yellow-50 order-first md:order-none" : ""}`}>
                <CardContent className="pt-6">
                  <p className="text-4xl mb-2">{medals[idx]}</p>
                  <p className="font-bold text-lg">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-gray-500 font-mono">{student.studentId}</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{student.totalPoints.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">points</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => openPointsDialog(student)}>
                    <Star className="h-3 w-3 mr-1" /> Award Points
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Student Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.length === 0 ? <p className="text-center py-8 text-gray-500">No students found.</p> : (
              leaderboard.map((student, index) => {
                const LevelIcon = levelIcons[student.currentLevel] || Star;
                return (
                  <div key={student.id} className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0 ? "bg-yellow-50 border border-yellow-200" :
                    index === 1 ? "bg-gray-50 border border-gray-200" :
                    index === 2 ? "bg-orange-50 border border-orange-200" :
                    "bg-white border border-gray-100"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-yellow-400 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-orange-400 text-white" :
                        "bg-gray-100 text-gray-600"
                      }`}>{index + 1}</div>
                      <div>
                        <p className="font-semibold">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-500 font-mono">{student.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right"><p className="text-sm text-gray-500">Attendance</p><p className="font-semibold">{student.attendanceRate.toFixed(0)}%</p></div>
                      <div className="text-right"><p className="text-sm text-gray-500">Level</p><div className="flex items-center gap-1"><LevelIcon className={`h-5 w-5 ${levelColors[student.currentLevel]}`} /><span className="text-xs">{levelNames[student.currentLevel]}</span></div></div>
                      <div className="text-right min-w-[80px]"><p className="text-sm text-gray-500">Points</p><p className="font-bold text-lg text-yellow-600">{student.totalPoints.toLocaleString()}</p></div>
                      <Button variant="outline" size="sm" onClick={() => openPointsDialog(student)}><Star className="h-3 w-3 mr-1" />Award</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={pointsDialog} onOpenChange={setPointsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Award Points to {selectedStudent?.firstName} {selectedStudent?.lastName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center"><p className="text-sm text-gray-500">Current Points</p><p className="text-3xl font-bold text-yellow-600">{selectedStudent?.totalPoints.toLocaleString()}</p></div>
            <div>
              <Label>Points to Add</Label>
              <div className="flex gap-2 mt-2">
                {[5, 10, 25, 50, 100].map((p) => (
                  <Button key={p} variant={pointsToAdd === p ? "default" : "outline"} size="sm" onClick={() => setPointsToAdd(p)} className={pointsToAdd === p ? "mocha-gradient" : ""}>+{p}</Button>
                ))}
              </div>
              <Input type="number" value={pointsToAdd} onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)} className="mt-2" />
            </div>
            <div className="text-center"><p className="text-sm text-gray-500">New Total</p><p className="text-2xl font-bold text-green-600">{((selectedStudent?.totalPoints || 0) + pointsToAdd).toLocaleString()}</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPointsDialog(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleAddPoints} disabled={saving}>{saving ? "Saving..." : "Award Points"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

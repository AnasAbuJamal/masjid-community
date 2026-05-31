"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Download, GraduationCap, BookOpen, CalendarCheck, FileText,
  User, ChevronLeft, Printer, Medal, Clock, CheckCircle, XCircle,
} from "lucide-react";

interface Student {
  id: number; firstName: string; lastName: string; studentId: number;
  parentName: string; parentEmail: string | null; parentPhone: string | null;
  class: { id: number; name: string };
  totalPoints: number; currentLevel: number; attendanceRate: number;
  attendanceStatus: string; isActive: boolean; createdAt: string;
}

interface AttendanceRecord {
  id: number; date: string; status: string; notes?: string;
  class: { name: string; teacherName: string };
}

interface StudentReport {
  id: number; title: string; content: string; category: string;
  createdAt: string; teacher?: { firstName: string; lastName: string };
}

interface Assignment {
  id: number; date: string; type: string; location: string;
  description: string; status: string; rating: string;
}

const levelNames: Record<number, string> = { 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Champion" };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHistory, setStudentHistory] = useState<{
    attendance: AttendanceRecord[]; reports: StudentReport[]; assignments: Assignment[];
  }>({ attendance: [], reports: [], assignments: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch("/api/classroom/students"),
        fetch("/api/classroom/classes"),
      ]);
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      setStudents(studentsData.students || []);
      setClasses(classesData.classes || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fetchStudentHistory = async (student: Student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    setActiveTab("overview");
    try {
      const [attendanceRes, reportsRes] = await Promise.all([
        fetch(`/api/classroom/attendance?studentId=${student.id}&limit=100`),
        fetch(`/api/student-reports?studentId=${student.id}`),
      ]);
      const attendanceData = await attendanceRes.json();
      const reportsData = await reportsRes.json();
      setStudentHistory({
        attendance: attendanceData.records || [],
        reports: reportsData.reports || [],
        assignments: [],
      });
    } catch { /* empty */ } finally { setHistoryLoading(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || String(s.studentId).includes(q);
    const matchesClass = selectedClass === "all" || String(s.class.id) === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-700">{rate.toFixed(0)}%</Badge>;
    if (rate >= 75) return <Badge className="bg-blue-100 text-blue-700">{rate.toFixed(0)}%</Badge>;
    if (rate >= 60) return <Badge className="bg-yellow-100 text-yellow-700">{rate.toFixed(0)}%</Badge>;
    return <Badge className="bg-red-100 text-red-700">{rate.toFixed(0)}%</Badge>;
  };
  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      present: "bg-green-100 text-green-700", absent: "bg-red-100 text-red-700",
      late: "bg-yellow-100 text-yellow-700", excused: "bg-blue-100 text-blue-700",
    };
    return <Badge className={config[status] || "bg-gray-100"}>{status}</Badge>;
  };
  const getLevelBadge = (level: number) => {
    const colors: Record<number, string> = { 1: "bg-gray-100 text-gray-600", 2: "bg-blue-100 text-blue-600", 3: "bg-purple-100 text-purple-600", 4: "bg-yellow-100 text-yellow-600" };
    return <Badge className={colors[level] || "bg-gray-100"}>{levelNames[level] || level}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h1>
              <p className="text-sm text-gray-500">Student ID: {selectedStudent.studentId} &bull; Class: {selectedStudent.class.name}</p>
            </div>
          </div>
          <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Download PDF</Button>
        </div>

        <div ref={printRef} className="space-y-6" id="student-history-print">
          <style>{`@media print { body { -webkit-print-color-adjust: exact; } }`}</style>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Level</p><p className="text-2xl font-bold">{levelNames[selectedStudent.currentLevel]}</p></div><Medal className="h-6 w-6 text-yellow-500" /></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Points</p><p className="text-2xl font-bold text-yellow-600">{selectedStudent.totalPoints}</p></div><Medal className="h-6 w-6 text-yellow-500" /></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Attendance</p><p className="text-2xl font-bold">{getAttendanceBadge(selectedStudent.attendanceRate)}</p></div><CalendarCheck className="h-6 w-6 text-green-500" /></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Parent</p><p className="text-sm font-medium">{selectedStudent.parentName}</p></div><User className="h-6 w-6 text-blue-500" /></div></CardContent></Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-2"><User className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" />Attendance ({studentHistory.attendance.length})</TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2"><FileText className="h-4 w-4" />Reports ({studentHistory.reports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p></div>
                    <div><p className="text-sm text-gray-500">Student ID</p><p className="font-mono font-medium">{selectedStudent.studentId}</p></div>
                    <div><p className="text-sm text-gray-500">Class</p><p className="font-medium">{selectedStudent.class.name}</p></div>
                    <div><p className="text-sm text-gray-500">Parent Name</p><p className="font-medium">{selectedStudent.parentName}</p></div>
                    <div><p className="text-sm text-gray-500">Parent Email</p><p className="font-medium">{selectedStudent.parentEmail || "—"}</p></div>
                    <div><p className="text-sm text-gray-500">Parent Phone</p><p className="font-medium">{selectedStudent.parentPhone || "—"}</p></div>
                    <div><p className="text-sm text-gray-500">Level</p><p className="font-medium">{levelNames[selectedStudent.currentLevel]} ({selectedStudent.currentLevel})</p></div>
                    <div><p className="text-sm text-gray-500">Total Points</p><p className="font-medium text-yellow-600">{selectedStudent.totalPoints}</p></div>
                    <div><p className="text-sm text-gray-500">Attendance Rate</p><p className="font-medium">{(selectedStudent.attendanceRate * 100).toFixed(1)}%</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
                <CardContent>
                  {studentHistory.attendance.length === 0 ? (
                    <p className="text-gray-500 py-4 text-center">No attendance records found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Class</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentHistory.attendance.slice(0, 10).map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                            <TableCell>{getStatusBadge(r.status)}</TableCell>
                            <TableCell>{r.class?.name || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Full Attendance History</CardTitle></CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="text-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-mocha-600 border-t-transparent mx-auto" /></div>
                  ) : studentHistory.attendance.length === 0 ? (
                    <p className="text-gray-500 py-4 text-center">No attendance records</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Class</TableHead><TableHead>Teacher</TableHead><TableHead>Notes</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentHistory.attendance.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                            <TableCell>{getStatusBadge(r.status)}</TableCell>
                            <TableCell>{r.class?.name || "—"}</TableCell>
                            <TableCell>{r.class?.teacherName || "—"}</TableCell>
                            <TableCell className="text-sm text-gray-500">{r.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Student Reports</CardTitle></CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="text-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-mocha-600 border-t-transparent mx-auto" /></div>
                  ) : studentHistory.reports.length === 0 ? (
                    <p className="text-gray-500 py-4 text-center">No reports found</p>
                  ) : (
                    <div className="space-y-4">
                      {studentHistory.reports.map((r) => (
                        <Card key={r.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{r.title}</h3>
                                <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()} &bull; By: {r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : "Unknown"}</p>
                              </div>
                              <Badge variant="outline">{r.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage and view student records</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">{students.length} active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Students</p><p className="text-3xl font-bold">{students.length}</p></div><GraduationCap className="h-6 w-6 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Classes</p><p className="text-3xl font-bold">{classes.length}</p></div><BookOpen className="h-6 w-6 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Avg Attendance</p><p className="text-3xl font-bold text-green-600">{(students.reduce((a, s) => a + s.attendanceRate, 0) / (students.length || 1)).toFixed(0)}%</p></div><CalendarCheck className="h-6 w-6 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Points</p><p className="text-3xl font-bold text-yellow-600">{students.reduce((a, s) => a + s.totalPoints, 0).toLocaleString()}</p></div><Medal className="h-6 w-6 text-yellow-500" /></div></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Student Directory</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Search className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p>No students found</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => fetchStudentHistory(student)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{student.firstName} {student.lastName}</h3>
                        <p className="text-sm text-gray-500 font-mono">#{student.studentId}</p>
                      </div>
                      {getLevelBadge(student.currentLevel)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Class</span>
                        <span className="font-medium">{student.class.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Points</span>
                        <span className="font-medium text-yellow-600">{student.totalPoints}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Attendance</span>
                        {getAttendanceBadge(student.attendanceRate)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, History, FileText, Plus, Search } from "lucide-react";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: number;
  class: { id: number; name: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes?: string;
  student: { id: number; firstName: string; lastName: string; studentId: number; class: { name: string } };
}

interface Class {
  id: number;
  name: string;
  teacherName: string;
  schedule: string;
  students: Student[];
}

interface StudentReport {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  teacher?: { firstName: string; lastName: string };
  student?: { firstName: string; lastName: string; studentId: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
  absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
  late: { label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
};

type ViewTab = "daily" | "history" | "reports";

export default function AttendancePage() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ViewTab>("daily");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });

  // History
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyFrom, setHistoryFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [historyTo, setHistoryTo] = useState<string>(new Date().toISOString().split("T")[0]);
  const [historyStudentId, setHistoryStudentId] = useState<string>("");

  // Reports
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [newReport, setNewReport] = useState({ studentId: "", title: "", content: "", category: "general" });

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classroom/classes?includeStudents=true");
      const data = await res.json();
      setClasses(data.classes || []);
      if (data.classes?.length > 0 && !selectedClass) {
        setSelectedClass(String(data.classes[0].id));
      }
    } catch (error) { console.error("Error fetching classes:", error); }
  };

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/attendance?classId=${selectedClass}&date=${selectedDate}`);
      const data = await res.json();
      setRecords(data.records || []);
      const attendanceMap: Record<string, string> = {};
      data.records?.forEach((r: AttendanceRecord) => { attendanceMap[r.student.id] = r.status; });
      setBulkAttendance(attendanceMap);
      const counts = { present: 0, absent: 0, late: 0, excused: 0, total: data.records?.length || 0 };
      data.records?.forEach((r: AttendanceRecord) => { if (counts[r.status as keyof typeof counts] !== undefined) counts[r.status as keyof typeof counts]++; });
      setStats(counts);
    } catch (error) { console.error("Error fetching attendance:", error); } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `/api/classroom/attendance?dateFrom=${historyFrom}&dateTo=${historyTo}`;
      if (selectedClass) url += `&classId=${selectedClass}`;
      if (historyStudentId.trim()) url += `&studentId=${historyStudentId.trim()}`;
      const res = await fetch(url);
      const data = await res.json();
      setHistoryRecords(data.records || []);
    } catch (error) { console.error("Error fetching history:", error); } finally { setLoading(false); }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student-reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) { console.error("Error fetching reports:", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    if (activeView === "daily" && selectedClass && selectedDate) fetchAttendance();
  }, [selectedClass, selectedDate, activeView]);

  useEffect(() => {
    if (activeView === "history") fetchHistory();
  }, [activeView]);

  useEffect(() => {
    if (activeView === "reports") fetchReports();
  }, [activeView]);

  useEffect(() => {
    const currentClass = classes.find((c) => String(c.id) === selectedClass);
    setStudents(currentClass?.students || []);
  }, [selectedClass, classes]);

  const handleBulkMark = async () => {
    if (!selectedClass || !selectedDate) return;
    setBulkLoading(true);
    try {
      const records = students.map((s) => ({ studentId: s.id, status: bulkAttendance[s.id] || "present" }));
      const res = await fetch("/api/classroom/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, date: selectedDate, records }),
      });
      if (res.ok) { fetchAttendance(); setShowBulkModal(false); toast({ title: "Attendance saved", description: `Marked ${records.length} students` }); }
      else { const err = await res.json(); toast({ title: "Error saving attendance", description: err.error || "Unauthorized", variant: "destructive" }); }
    } catch (error) { toast({ title: "Error saving attendance", description: "Network error", variant: "destructive" }); } finally { setBulkLoading(false); }
  };

  const handleIndividualMark = async (studentId: string, status: string) => {
    try {
      const res = await fetch("/api/classroom/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classId: selectedClass, date: selectedDate, status }),
      });
      if (res.ok) { fetchAttendance(); toast({ title: "Marked as " + status }); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Failed to mark", variant: "destructive" }); }
    } catch (error) { toast({ title: "Error marking attendance", description: "Network error", variant: "destructive" }); }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleCreateReport = async () => {
    if (!newReport.studentId || !newReport.title || !newReport.content) return;
    try {
      await fetch("/api/student-reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport),
      });
      setShowReportDialog(false);
      setNewReport({ studentId: "", title: "", content: "", category: "general" });
      fetchReports();
    } catch (error) { console.error("Error creating report:", error); }
  };

  const tabs = [
    { key: "daily" as ViewTab, label: "Daily View", icon: Calendar },
    { key: "history" as ViewTab, label: "History", icon: History },
    { key: "reports" as ViewTab, label: "Student Reports", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">Track student attendance</p>
        </div>
        <div className="flex gap-2">
          {activeView === "daily" && (
            <>
              <Button variant="outline" onClick={() => fetchAttendance()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowBulkModal(true)} disabled={!selectedClass}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Bulk Mark
              </Button>
            </>
          )}
          {activeView === "reports" && (
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === tab.key
                  ? "border-mocha-600 text-mocha-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Daily View */}
      {activeView === "daily" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = stats[key as keyof typeof stats] || 0;
              const colorMap: Record<string, string> = {
                present: "green", absent: "red", late: "yellow", excused: "blue",
              };
              const bgMap: Record<string, string> = {
                present: "bg-green-100", absent: "bg-red-100", late: "bg-yellow-100", excused: "bg-blue-100",
              };
              const textMap: Record<string, string> = {
                present: "text-green-600", absent: "text-red-600", late: "text-yellow-600", excused: "text-blue-600",
              };
              return (
                <Card key={key}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{config.label}</p>
                        <p className={`text-3xl font-bold ${textMap[key]}`}>{count}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${bgMap[key]} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${textMap[key]}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>{cls.name} - {cls.teacherName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
                <Button variant="outline" size="icon" onClick={() => changeDate(1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Attendance for {selectedDate}</span>
                <Badge variant="secondary">{stats.total} / {students.length} marked</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-mocha-600" /></div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p>No students in this class</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Student ID</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Quick Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const record = records.find((r) => r.student.id === student.id);
                      const status = record?.status || "";
                      const config = statusConfig[status] || { label: "Not marked", color: "bg-gray-100 text-gray-700", icon: AlertCircle };
                      const StatusIcon = config.icon;
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                          <TableCell><Badge className={config.color}><StatusIcon className="h-3 w-3 mr-1" />{config.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(["present", "absent", "late", "excused"] as const).map((s) => (
                                <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => handleIndividualMark(String(student.id), s)} className="h-8 px-2">{s.charAt(0).toUpperCase()}</Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* History View */}
      {activeView === "history" && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <Label>From</Label>
              <Input type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex-1">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Student ID</Label>
              <Input
                placeholder="Filter by student ID"
                value={historyStudentId}
                onChange={(e) => setHistoryStudentId(e.target.value)}
              />
            </div>
            <Button onClick={fetchHistory} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-mocha-600" /></div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p>No attendance records found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Date</TableHead><TableHead>Student ID</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.map((record) => {
                      const config = statusConfig[record.status] || { label: record.status, color: "bg-gray-100 text-gray-700", icon: AlertCircle };
                      const StatusIcon = config.icon;
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono">{record.student.studentId}</TableCell>
                          <TableCell className="font-medium">{record.student.firstName} {record.student.lastName}</TableCell>
                          <TableCell>{record.student.class.name}</TableCell>
                          <TableCell><Badge className={config.color}><StatusIcon className="h-3 w-3 mr-1" />{config.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Reports View */}
      {activeView === "reports" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Student Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-mocha-600" /></div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p>No reports yet</p></div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{report.title}</h3>
                            {report.student && (
                              <p className="text-sm text-gray-500">Student: {report.student.firstName} {report.student.lastName} (ID: {report.student.studentId})</p>
                            )}
                          </div>
                          <Badge variant="outline">{report.category}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{report.content}</p>
                        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                          <span>By: {report.teacher ? `${report.teacher.firstName} ${report.teacher.lastName}` : "Unknown"}</span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Student Report</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student ID (numeric)</Label>
                  <Input
                    type="number"
                    placeholder="Enter student's internal ID"
                    value={newReport.studentId}
                    onChange={(e) => setNewReport({ ...newReport, studentId: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Use the student's auto-increment ID from the database</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newReport.category} onValueChange={(v) => setNewReport({ ...newReport, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={newReport.title} onChange={(e) => setNewReport({ ...newReport, title: e.target.value })} placeholder="Report title" />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea rows={5} value={newReport.content} onChange={(e) => setNewReport({ ...newReport, content: e.target.value })} placeholder="Write your report..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateReport} disabled={!newReport.studentId || !newReport.title || !newReport.content}>
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Bulk Mark Dialog */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Mark Attendance for {selectedDate}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => {
                const all: Record<string, string> = {};
                students.forEach((s) => (all[s.id] = "present"));
                setBulkAttendance(all);
              }}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const all: Record<string, string> = {};
                students.forEach((s) => (all[s.id] = "absent"));
                setBulkAttendance(all);
              }}>Mark All Absent</Button>
            </div>
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                </div>
                <Select value={bulkAttendance[student.id] || "present"} onValueChange={(v) => setBulkAttendance({ ...bulkAttendance, [student.id]: v })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button onClick={handleBulkMark} disabled={bulkLoading}>{bulkLoading ? "Saving..." : "Save Attendance"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History query fix: the attendance API already supports date filters via the `date` param */}
    </div>
  );
}

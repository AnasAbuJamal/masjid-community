"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Download, ChevronLeft, ChevronRight } from "lucide-react";

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
  student: {
    id: number;
    firstName: string;
    lastName: string;
    studentId: number;
    class: { name: string };
  };
}

interface Class {
  id: number;
  name: string;
  teacherName: string;
  schedule: string;
  students: Student[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
  absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
  late: { label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classroom/classes?includeStudents=true");
      const data = await res.json();
      setClasses(data.classes || []);
      if (data.classes?.length > 0 && !selectedClass) {
        setSelectedClass(String(data.classes[0].id));
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/attendance?classId=${selectedClass}&date=${selectedDate}`);
      const data = await res.json();
      setRecords(data.records || []);

      const attendanceMap: Record<string, string> = {};
      data.records?.forEach((r: AttendanceRecord) => {
        attendanceMap[r.student.id] = r.status;
      });
      setBulkAttendance(attendanceMap);

      const counts = { present: 0, absent: 0, late: 0, excused: 0, total: data.records?.length || 0 };
      data.records?.forEach((r: AttendanceRecord) => {
        if (counts[r.status as keyof typeof counts] !== undefined) {
          counts[r.status as keyof typeof counts]++;
        }
      });
      setStats(counts);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const currentClass = classes.find((c) => c.id === selectedClass);
  const students = currentClass?.students || [];

  const handleBulkMark = async () => {
    if (!selectedClass || !selectedDate) return;
    setBulkLoading(true);

    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: bulkAttendance[s.id] || "present",
      }));

      const res = await fetch("/api/classroom/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          records,
        }),
      });

      if (res.ok) {
        fetchAttendance();
        setShowBulkModal(false);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleIndividualMark = async (studentId: string, status: string) => {
    try {
      await fetch("/api/classroom/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          classId: selectedClass,
          date: selectedDate,
          status,
        }),
      });
      fetchAttendance();
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">Track student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAttendance()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowBulkModal(true)} disabled={!selectedClass}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Bulk Mark
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Excused</p>
                <p className="text-3xl font-bold text-blue-600">{stats.excused}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={String(cls.id)}>
                  {cls.name} - {cls.teacherName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
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
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-mocha-600" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No students in this class</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quick Actions</TableHead>
                </TableRow>
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
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(["present", "absent", "late", "excused"] as const).map((s) => (
                            <Button
                              key={s}
                              variant={status === s ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleIndividualMark(student.id, s)}
                              className="h-8 px-2"
                            >
                              {s.charAt(0).toUpperCase()}
                            </Button>
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

      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark Attendance for {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const all: Record<string, string> = {};
                  students.forEach((s) => (all[s.id] = "present"));
                  setBulkAttendance(all);
                }}
              >
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const all: Record<string, string> = {};
                  students.forEach((s) => (all[s.id] = "absent"));
                  setBulkAttendance(all);
                }}
              >
                Mark All Absent
              </Button>
            </div>
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                </div>
                <Select
                  value={bulkAttendance[student.id] || "present"}
                  onValueChange={(v) => setBulkAttendance({ ...bulkAttendance, [student.id]: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
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
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkMark} disabled={bulkLoading}>
              {bulkLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

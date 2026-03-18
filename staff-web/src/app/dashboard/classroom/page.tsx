"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GraduationCap, Users, Star, Pencil, Trash2, Clock } from "lucide-react";

interface Student {
  id: string; studentId: string; firstName: string; lastName: string;
  classId: string; parentName: string; parentEmail?: string; parentPhone?: string;
  totalPoints: number; currentLevel: number; attendanceRate: number;
  attendanceStatus: string; isActive: boolean; photoUrl?: string;
}
interface ClassItem {
  id: string; name: string; teacherName: string; schedule: string;
  students: Student[];
}

const statusColors: Record<string, string> = {
  excellent: "bg-green-100 text-green-700", very_good: "bg-blue-100 text-blue-700",
  good: "bg-yellow-100 text-yellow-700", needs_improvement: "bg-orange-100 text-orange-700", poor: "bg-red-100 text-red-700",
};

export default function ClassroomPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classDialog, setClassDialog] = useState(false);
  const [studentDialog, setStudentDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [classForm, setClassForm] = useState({ name: "", teacherName: "", schedule: "" });
  const [studentForm, setStudentForm] = useState({ firstName: "", lastName: "", classId: "", parentName: "", parentEmail: "", parentPhone: "" });
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: "class" | "student"; id: string } | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/classroom/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0);

  const openCreateClass = () => { setEditingClass(null); setClassForm({ name: "", teacherName: "", schedule: "" }); setClassDialog(true); };
  const openEditClass = (cls: ClassItem) => { setEditingClass(cls); setClassForm({ name: cls.name, teacherName: cls.teacherName, schedule: cls.schedule }); setClassDialog(true); };
  const openCreateStudent = () => { setEditingStudent(null); setStudentForm({ firstName: "", lastName: "", classId: classes[0]?.id || "", parentName: "", parentEmail: "", parentPhone: "" }); setStudentDialog(true); };
  const openEditStudent = (s: Student) => { setEditingStudent(s); setStudentForm({ firstName: s.firstName, lastName: s.lastName, classId: s.classId, parentName: s.parentName, parentEmail: s.parentEmail || "", parentPhone: s.parentPhone || "" }); setStudentDialog(true); };

  const handleSaveClass = async () => {
    setSaving(true);
    try {
      if (editingClass) {
        await fetch(`/api/classroom/classes/${editingClass.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(classForm) });
      } else {
        await fetch("/api/classroom/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(classForm) });
      }
      setClassDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleSaveStudent = async () => {
    setSaving(true);
    try {
      if (editingStudent) {
        await fetch(`/api/classroom/students/${editingStudent.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentForm) });
      } else {
        await fetch("/api/classroom/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentForm) });
      }
      setStudentDialog(false); fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const endpoint = deleteItem.type === "class" ? `/api/classroom/classes/${deleteItem.id}` : `/api/classroom/students/${deleteItem.id}`;
      await fetch(endpoint, { method: "DELETE" });
      setDeleteItem(null); fetchData();
    } catch { /* empty */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-500 mt-1">Manage Islamic school classes and students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCreateStudent}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreateClass}><Plus className="h-4 w-4 mr-2" />Add Class</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Classes</p><p className="text-3xl font-bold">{classes.length}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><GraduationCap className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active Students</p><p className="text-3xl font-bold text-blue-600">{totalStudents}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Points</p><p className="text-3xl font-bold text-yellow-600">{classes.reduce((acc, cls) => acc + (cls.students || []).reduce((a, s) => a + s.totalPoints, 0), 0).toLocaleString()}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Star className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
      </div>

      {/* Classes */}
      <div className="grid gap-4">
        {classes.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No classes found. Create your first class.</p></CardContent></Card>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-purple-600" />{cls.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{cls.students?.length || 0} students</Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEditClass(cls)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteItem({ type: "class", id: cls.id })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2"><Clock className="h-4 w-4" />{cls.schedule} • Teacher: {cls.teacherName}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader><TableRow><TableHead>Student ID</TableHead><TableHead>Name</TableHead><TableHead>Parent</TableHead><TableHead>Attendance</TableHead><TableHead>Points</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(!cls.students || cls.students.length === 0) ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-500">No students in this class</TableCell></TableRow>
                    ) : (
                      cls.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                          <TableCell className="text-sm text-gray-500">{student.parentName}</TableCell>
                          <TableCell><Badge className={statusColors[student.attendanceStatus]}>{student.attendanceStatus.replace("_", " ")}</Badge></TableCell>
                          <TableCell>{student.totalPoints.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditStudent(student)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteItem({ type: "student", id: student.id })}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Class Dialog */}
      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingClass ? "Edit Class" : "Add Class"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Class Name</Label><Input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="e.g., Quran Level 1" /></div>
            <div><Label>Teacher Name</Label><Input value={classForm.teacherName} onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })} /></div>
            <div><Label>Schedule</Label><Input value={classForm.schedule} onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })} placeholder="e.g., Sat & Sun 10-12 AM" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setClassDialog(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveClass} disabled={saving}>{saving ? "Saving..." : editingClass ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={studentDialog} onOpenChange={setStudentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStudent ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} /></div>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={studentForm.classId} onValueChange={(v) => setStudentForm({ ...studentForm, classId: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((cls) => (<SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Parent Name</Label><Input value={studentForm.parentName} onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Parent Email</Label><Input type="email" value={studentForm.parentEmail} onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })} /></div>
              <div><Label>Parent Phone</Label><Input value={studentForm.parentPhone} onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStudentDialog(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveStudent} disabled={saving}>{saving ? "Saving..." : editingStudent ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete {deleteItem?.type}?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

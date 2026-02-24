import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Plus, GraduationCap, Users, Clock, Star } from "lucide-react";

async function getClasses() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        students: {
          where: { isActive: true },
          select: { id: true, firstName: true, lastName: true, totalPoints: true, attendanceStatus: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return classes;
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  very_good: "bg-blue-100 text-blue-700",
  good: "bg-yellow-100 text-yellow-700",
  needs_improvement: "bg-orange-100 text-orange-700",
  poor: "bg-red-100 text-red-700",
};

export default async function ClassroomPage() {
  const classes = await getClasses();
  const totalStudents = classes.reduce((acc, cls) => acc + cls.students.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-500 mt-1">Manage Islamic school classes and students</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-3xl font-bold">{classes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {classes.reduce((acc, cls) => acc + cls.students.reduce((a, s) => a + s.totalPoints, 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes */}
      <div className="grid gap-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No classes found. Create your first class.</p>
            </CardContent>
          </Card>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    {cls.name}
                  </CardTitle>
                  <Badge variant="outline">{cls.students.length} students</Badge>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {cls.schedule}
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Attendance Status</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cls.students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No students in this class
                        </TableCell>
                      </TableRow>
                    ) : (
                      cls.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">
                            STU-{student.id.slice(-4).toUpperCase()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[student.attendanceStatus]}>
                              {student.attendanceStatus.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{student.totalPoints.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              {Array.from({ length: student.totalPoints > 500 ? 3 : student.totalPoints > 200 ? 2 : 1 }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
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
    </div>
  );
}

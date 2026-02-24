import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Plus, ClipboardList, CheckCircle, Clock, XCircle } from "lucide-react";

async function getAssignments() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
      take: 50,
    });
    return assignments;
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
};

const ratingColors: Record<string, string> = {
  none: "bg-gray-100 text-gray-700",
  weak: "bg-red-100 text-red-700",
  good: "bg-blue-100 text-blue-700",
  very_good: "bg-purple-100 text-purple-700",
  excellent: "bg-green-100 text-green-700",
};

export default async function AssignmentsPage() {
  const assignments = await getAssignments();
  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">Track student assignments and progress</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Assignments</p>
                <p className="text-3xl font-bold">{assignments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
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
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
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
                <p className="text-sm text-gray-500">Excellent Ratings</p>
                <p className="text-3xl font-bold text-purple-600">
                  {assignments.filter((a) => a.rating === "excellent").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No assignments found.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.student.firstName} {assignment.student.lastName}
                      <p className="text-xs text-gray-500 font-mono">
                        STU-{assignment.student.studentId.slice(-4).toUpperCase()}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{assignment.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.type.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.location}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[assignment.status]}>{assignment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={ratingColors[assignment.rating]}>{assignment.rating.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{assignment.date.toLocaleDateString()}</TableCell>
                    <TableCell>{assignment.teacher.firstName} {assignment.teacher.lastName}</TableCell>
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

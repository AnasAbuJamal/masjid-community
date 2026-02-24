import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Briefcase, Users, MapPin, Clock, Building } from "lucide-react";

async function getJobs() {
  try {
    const [postings, applications, workers] = await Promise.all([
      prisma.jobPosting.findMany({
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.jobApplication.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.workerProfile.count({ where: { status: "approved" } }),
    ]);
    return { postings, applications, workers };
  } catch {
    return { postings: [], applications: [], workers: 0 };
  }
}

const statusColors: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-gray-100 text-gray-700",
  expired: "bg-red-100 text-red-700",
  closed: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

const appStatusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  reviewed: "bg-purple-100 text-purple-700",
  shortlisted: "bg-yellow-100 text-yellow-700",
  hired: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export default async function JobsPage() {
  const { postings, applications, workers } = await getJobs();
  const activeCount = postings.filter((p) => p.status === "active").length;
  const pendingCount = postings.filter((p) => p.status === "pending_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Jobs Board</h1>
        <p className="text-gray-500 mt-1">Manage job postings and worker profiles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
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
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
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
                <p className="text-sm text-gray-500">Worker Profiles</p>
                <p className="text-3xl font-bold text-purple-600">{workers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Postings */}
        <Card>
          <CardHeader>
            <CardTitle>Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            {postings.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No job postings found.</p>
            ) : (
              <div className="space-y-3">
                {postings.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Building className="h-4 w-4" />
                          {job.company}
                        </p>
                      </div>
                      <Badge className={statusColors[job.status]}>{job.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job._count.applications} applicants
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No applications yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.applicantName}</TableCell>
                      <TableCell className="text-sm">{app.applicantEmail}</TableCell>
                      <TableCell>
                        <Badge className={appStatusColors[app.status]}>{app.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, HardHat, AlertTriangle, GripVertical } from "lucide-react";

async function getProjects() {
  try {
    const projects = await prisma.constructionProject.findMany({
      orderBy: [{ isUrgent: "desc" }, { displayOrder: "asc" }],
    });
    return projects;
  } catch {
    return [];
  }
}

export default async function ConstructionPage() {
  const projects = await getProjects();
  const totalProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length)
    : 0;
  const urgentCount = projects.filter((p) => p.isUrgent).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Construction</h1>
          <p className="text-gray-500 mt-1">Track mosque construction and renovation projects</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <HardHat className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Progress</p>
                <p className="text-3xl font-bold text-blue-600">{totalProgress}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <HardHat className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Urgent Projects</p>
                <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HardHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No construction projects found.</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className={project.isUrgent ? "border-red-300" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                    <CardTitle>{project.title}</CardTitle>
                    {project.isUrgent && (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-2">{project.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold">{project.progressPercent}%</span>
                  </div>
                  <Progress value={project.progressPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

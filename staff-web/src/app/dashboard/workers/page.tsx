"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  UserCheck, UserX, Shield, Clock, Eye, CheckCircle, XCircle, Pause, Briefcase
} from "lucide-react";

interface WorkerProfile {
  id: string; fullName: string; email: string; phone?: string;
  headline: string; bio: string; skills: string[]; experience: unknown[];
  education: unknown[]; certifications: string[]; location: string;
  availability: string; portfolioUrl?: string; photoUrl?: string;
  resumeUrl?: string; isPublic: boolean; status: string;
  createdAt: string; updatedAt: string;
  _count?: { applications: number };
  applications?: { id: string; status: string; job: { title: string; company: string } }[];
}

const statusColors: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-gray-100 text-gray-700",
};
const availColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  open_to_offers: "bg-blue-100 text-blue-700",
  not_available: "bg-gray-100 text-gray-700",
};

export default function WorkersPage() {
  const [profiles, setProfiles] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailProfile, setDetailProfile] = useState<WorkerProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | "suspended" | null>(null);
  const [actionProfileId, setActionProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const url = statusFilter === "all" ? "/api/workers" : `/api/workers?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [statusFilter]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/workers/${id}`);
      const data = await res.json();
      setDetailProfile(data);
    } catch { /* empty */ } finally { setDetailLoading(false); }
  };

  const openAction = (profileId: string, type: "approved" | "rejected" | "suspended") => {
    setActionProfileId(profileId);
    setActionType(type);
    setActionDialog(true);
  };

  const handleAction = async () => {
    if (!actionProfileId || !actionType) return;
    setSaving(true);
    try {
      await fetch(`/api/workers/${actionProfileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionType }),
      });
      setActionDialog(false);
      setActionProfileId(null);
      setActionType(null);
      fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const pendingCount = profiles.filter((p) => p.status === "pending_review").length;
  const approvedCount = profiles.filter((p) => p.status === "approved").length;
  const rejectedCount = profiles.filter((p) => p.status === "rejected").length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Worker Profiles</h1>
        <p className="text-gray-500 mt-1">Review and manage worker/freelancer profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Profiles</p><p className="text-3xl font-bold">{profiles.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Briefcase className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending Review</p><p className="text-3xl font-bold text-yellow-600">{pendingCount}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Approved</p><p className="text-3xl font-bold text-green-600">{approvedCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><UserCheck className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Rejected</p><p className="text-3xl font-bold text-red-600">{rejectedCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><UserX className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <div className="flex gap-2">
        {["all", "pending_review", "approved", "rejected", "suspended"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter(s); setLoading(true); }} className={statusFilter === s ? "bg-emerald-600" : ""}>
            {s === "all" ? "All" : s.replace("_", " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Profiles</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Headline</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No worker profiles found.</TableCell></TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="font-medium">{profile.fullName}</div>
                      <div className="text-xs text-gray-500">{profile.email}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{profile.headline}</TableCell>
                    <TableCell className="text-sm text-gray-500">{profile.location}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {profile.skills.length > 3 && <Badge variant="outline" className="text-xs">+{profile.skills.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={availColors[profile.availability] || "bg-gray-100 text-gray-700"}>{profile.availability.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[profile.status]}>{profile.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-center">{profile._count?.applications || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(profile.id)}><Eye className="h-4 w-4" /></Button>
                        {profile.status !== "approved" && (
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => openAction(profile.id, "approved")} title="Approve"><CheckCircle className="h-4 w-4" /></Button>
                        )}
                        {profile.status !== "rejected" && (
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => openAction(profile.id, "rejected")} title="Reject"><XCircle className="h-4 w-4" /></Button>
                        )}
                        {profile.status !== "suspended" && profile.status === "approved" && (
                          <Button variant="ghost" size="sm" className="text-yellow-600" onClick={() => openAction(profile.id, "suspended")} title="Suspend"><Pause className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailProfile} onOpenChange={() => setDetailProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detailProfile?.fullName}</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
          ) : detailProfile && (
            <div className="space-y-5">
              <div className="flex gap-2 flex-wrap">
                <Badge className={statusColors[detailProfile.status]}>{detailProfile.status.replace("_", " ")}</Badge>
                <Badge className={availColors[detailProfile.availability]}>{detailProfile.availability.replace("_", " ")}</Badge>
                {detailProfile.isPublic ? <Badge className="bg-green-100 text-green-700">Public</Badge> : <Badge variant="outline">Private</Badge>}
              </div>

              <p className="text-lg font-medium text-gray-700">{detailProfile.headline}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Email</p><p>{detailProfile.email}</p></div>
                <div><p className="text-gray-500">Phone</p><p>{detailProfile.phone || "N/A"}</p></div>
                <div><p className="text-gray-500">Location</p><p>{detailProfile.location}</p></div>
                <div><p className="text-gray-500">Joined</p><p>{new Date(detailProfile.createdAt).toLocaleDateString()}</p></div>
              </div>

              <div><p className="font-medium text-gray-700 mb-1">Bio</p><p className="text-sm text-gray-600 whitespace-pre-wrap">{detailProfile.bio}</p></div>

              <div>
                <p className="font-medium text-gray-700 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">{detailProfile.skills.map((s, i) => (<Badge key={i} variant="outline">{s}</Badge>))}</div>
              </div>

              {detailProfile.certifications.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">{detailProfile.certifications.map((c, i) => (<Badge key={i} variant="outline">{c}</Badge>))}</div>
                </div>
              )}

              {detailProfile.experience.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Experience</p>
                  <div className="space-y-2">
                    {(detailProfile.experience as { title?: string; company?: string; years?: number }[]).map((exp, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{exp.title || "Position"}</p>
                        {exp.company && <p className="text-sm text-gray-500">{exp.company}</p>}
                        {exp.years && <p className="text-xs text-gray-400">{exp.years} year(s)</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailProfile.education.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Education</p>
                  <div className="space-y-2">
                    {(detailProfile.education as { degree?: string; institution?: string; year?: number }[]).map((edu, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{edu.degree || "Degree"}</p>
                        {edu.institution && <p className="text-sm text-gray-500">{edu.institution}</p>}
                        {edu.year && <p className="text-xs text-gray-400">{edu.year}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {detailProfile.portfolioUrl && <a href={detailProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-sm">Portfolio →</a>}
                {detailProfile.resumeUrl && <a href={detailProfile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-sm">Resume →</a>}
              </div>

              {detailProfile.applications && detailProfile.applications.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Job Applications ({detailProfile.applications.length})</p>
                  <div className="space-y-2">
                    {detailProfile.applications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div><p className="font-medium text-sm">{app.job.title}</p><p className="text-xs text-gray-500">{app.job.company}</p></div>
                        <Badge variant="outline">{app.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approved" && "Approve Profile"}
              {actionType === "rejected" && "Reject Profile"}
              {actionType === "suspended" && "Suspend Profile"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">
            {actionType === "approved" && "This will make the worker profile public and visible to employers."}
            {actionType === "rejected" && "This will reject the worker profile. They will need to resubmit."}
            {actionType === "suspended" && "This will temporarily suspend the worker profile from public visibility."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(false)}>Cancel</Button>
            <Button
              className={
                actionType === "approved" ? "bg-green-600 hover:bg-green-700" :
                actionType === "rejected" ? "bg-red-600 hover:bg-red-700" :
                "bg-yellow-600 hover:bg-yellow-700"
              }
              onClick={handleAction}
              disabled={saving}
            >
              {saving ? "Saving..." : actionType === "approved" ? "Approve" : actionType === "rejected" ? "Reject" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

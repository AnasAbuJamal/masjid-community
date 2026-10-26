import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [jobs, volunteers] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { applicantEmail: user.email },
      include: { job: { select: { title: true, company: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
    prisma.volunteerApplication.findMany({
      where: { userEmail: user.email },
      include: { opportunity: { select: { title: true, eventDate: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
  ]);
  return NextResponse.json({
    jobs: jobs.map(j => ({
      id: String(j.id), jobId: String(j.jobId), jobTitle: j.job.title,
      company: j.job.company, status: j.status, appliedAt: j.createdAt.toISOString(),
      coverLetter: j.coverLetter,
    })),
    volunteers: volunteers.map(v => ({
      id: String(v.id), opportunityId: String(v.opportunityId), title: v.opportunity.title,
      eventDate: v.opportunity.eventDate.toISOString(),
      status: v.status, appliedAt: v.createdAt.toISOString(),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

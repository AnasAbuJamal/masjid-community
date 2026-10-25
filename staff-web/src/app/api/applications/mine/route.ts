import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [jobs, volunteers] = await Promise.all([
    prisma.jobApplication.findMany({ where: { applicantEmail: { equals: session.user.email, mode: "insensitive" } }, include: { job: { select: { title: true, company: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.volunteerApplication.findMany({ where: { userEmail: { equals: session.user.email, mode: "insensitive" } }, include: { opportunity: { select: { title: true, eventDate: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return NextResponse.json({
    jobs: jobs.map(j => ({ id: String(j.id), jobId: String(j.jobId), jobTitle: j.job.title, company: j.job.company, status: j.status, appliedAt: j.createdAt })),
    volunteers: volunteers.map(v => ({ id: String(v.id), opportunityId: String(v.opportunityId), title: v.opportunity.title, eventDate: v.opportunity.eventDate, status: v.status, appliedAt: v.createdAt })),
  }, { headers: { "Cache-Control": "no-store" } });
}

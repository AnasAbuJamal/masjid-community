import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`job-application:${getClientIp(req)}:${user.id}`, 15, 60 * 60000).success)
    return NextResponse.json({ error: "Too many applications" }, { status: 429 });
  const { jobId } = await params;
  if (!/^\d+$/.test(jobId)) return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: Number(jobId) } });
    if (!job || job.status !== "active" || (job.expiresAt && job.expiresAt <= new Date()))
      return NextResponse.json({ error: "This job is not accepting applications" }, { status: 400 });
    const body = await req.json();
    if (body.coverLetter !== undefined && (typeof body.coverLetter !== "string" || body.coverLetter.length > 5000))
      return NextResponse.json({ error: "Cover letter is too long" }, { status: 400 });
    if (body.resumeUrl !== undefined && (typeof body.resumeUrl !== "string" ||
        !/^https:\/\//.test(body.resumeUrl) || body.resumeUrl.length > 2000))
      return NextResponse.json({ error: "Invalid resume link" }, { status: 400 });
    const existing = await prisma.jobApplication.findFirst({
      where: { jobId: job.id, applicantEmail: user.email },
    });
    if (existing) return NextResponse.json({ error: "You already applied to this job" }, { status: 409 });
    const app = await prisma.jobApplication.create({ data: {
      jobId: job.id, applicantName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      applicantEmail: user.email, coverLetter: body.coverLetter || null,
      resumeUrl: body.resumeUrl || null, status: "submitted",
    } });
    return NextResponse.json({ id: String(app.id), status: app.status }, { status: 201 });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json({ error: "Unable to apply" }, { status: 500 });
  }
}

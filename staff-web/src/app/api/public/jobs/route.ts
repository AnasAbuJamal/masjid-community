import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { jobApplicationSchema, isJobAcceptingApplications } from "@/lib/job-application";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const locationType = searchParams.get("locationType");

  const where: Record<string, unknown> = {
    status: "active",
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };

  if (category) where.category = category;
  if (locationType) where.locationType = locationType;

  const jobs = await prisma.jobPosting.findMany({
    where,
    select: {
      id: true,
      title: true,
      company: true,
      description: true,
      requirements: true,
      location: true,
      locationType: true,
      employmentType: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      category: true,
      isUrgent: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.email) return NextResponse.json({ error: "Please sign in to apply" }, { status: 401 });
    const body = await req.json().catch(() => null);
    const parsed = jobApplicationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Provide a valid job and a cover letter of 50–10000 characters" }, { status: 400 });
    const { jobId, coverLetter, resumeUrl } = parsed.data;
    const applicantEmail = session.user.email.trim().toLowerCase();
    // Applicant identity is derived from the session, never client-supplied fields.
    const applicantName = session.user.name || applicantEmail;
    const submit = () => prisma.$transaction(async tx => {
      const job = await tx.jobPosting.findUnique({ where: { id: jobId } });
      if (!job) return { error: "Job not found", status: 404 } as const;
      if (!isJobAcceptingApplications(job)) return { error: "This job is no longer accepting applications", status: 409 } as const;
      const existing = await tx.jobApplication.findFirst({
        where: { jobId, applicantEmail: { equals: applicantEmail, mode: "insensitive" } },
      });
      if (existing) return { error: "You have already applied for this job", status: 409 } as const;
      const application = await tx.jobApplication.create({
        data: { jobId, applicantEmail, applicantName, coverLetter, resumeUrl, status: "submitted" },
      });
      return { job, application };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    // Serializable conflicts are retried; the next attempt sees a concurrent application.
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { result = await submit(); break; }
      catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 2) throw error;
      }
    }
    if (!result) throw new Error("Application transaction failed");
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const { job, application } = result;

    // Notification failures must not turn a committed application into a reported failure.
    try {
    if (await shouldNotify("notify_new_job_application")) {
      const notifyEmails = await getNotificationEmails();
      if (notifyEmails.length > 0) {
        await sendEmail({
          to: notifyEmails,
          template: "new_job_application",
          data: {
            jobTitle: job.title,
            applicantName,
            applicantEmail,
          },
        });
      }
    }

    } catch {
      console.error("Application saved but staff notification failed");
    }
    return NextResponse.json({
      message: "Application submitted successfully",
      applicationId: application.id
    }, { status: 201 });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

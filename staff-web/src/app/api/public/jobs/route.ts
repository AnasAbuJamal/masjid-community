import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const locationType = searchParams.get("locationType");

  const where: Record<string, unknown> = {
    status: "active",
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
    const body = await req.json();
    const { 
      jobId, 
      applicantName, 
      applicantEmail, 
      applicantPhone, 
      resumeUrl, 
      coverLetter,
      workerProfileId,
    } = body;

    if (!jobId || !applicantName || !applicantEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "active") {
      return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantName,
        applicantEmail,
        applicantPhone,
        resumeUrl,
        coverLetter,
        workerProfileId,
        status: "submitted",
      },
    });

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

    return NextResponse.json({ 
      message: "Application submitted successfully",
      applicationId: application.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET() {
  const opportunities = await prisma.volunteerOpportunity.findMany({
    where: { status: "open" },
    orderBy: { eventDate: "asc" },
  });
  return NextResponse.json({ opportunities });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityId, userName, userEmail, userPhone, skills } = body;

    if (!opportunityId || !userName || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const opportunity = await prisma.volunteerOpportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    if (opportunity.status !== "open") {
      return NextResponse.json({ error: "This opportunity is no longer open" }, { status: 400 });
    }

    const application = await prisma.volunteerApplication.create({
      data: {
        opportunityId,
        userName,
        userEmail,
        userPhone,
        skills,
        status: "pending",
      },
    });

    await prisma.volunteerOpportunity.update({
      where: { id: opportunityId },
      data: { spotsFilled: { increment: 1 } },
    });

    if (await shouldNotify("notify_new_volunteer")) {
      const notifyEmails = await getNotificationEmails();
      if (notifyEmails.length > 0) {
        await sendEmail({
          to: notifyEmails,
          template: "new_volunteer",
          data: {
            name: userName,
            email: userEmail,
            phone: userPhone || "Not provided",
            skills: skills || "Not provided",
            opportunity: opportunity.title,
          },
        });
      }
    }

    return NextResponse.json({ 
      message: "Application submitted successfully",
      applicationId: application.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Volunteer signup error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

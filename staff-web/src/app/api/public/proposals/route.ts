import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET() {
  const proposals = await prisma.projectProposal.findMany({
    where: { status: { in: ["approved", "in_progress", "completed"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      category: true,
      status: true,
      coverImage: true,
      completionPercent: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ proposals });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      summary,
      description,
      category,
      submitterName,
      submitterEmail,
      submitterPhone,
      submitterRole,
      totalBudget,
      fundingSource,
      isFundingSecured,
      objectives,
      timeline,
      estimatedDuration,
      resourcesNeeded,
      volunteersNeeded,
      skillsRequired,
      targetAudience,
      expectedImpact,
      communityNeed,
      successMetrics,
    } = body;

    if (!title || !summary || !description || !category || !submitterName || !submitterEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const proposal = await prisma.projectProposal.create({
      data: {
        title,
        summary,
        description,
        category,
        submitterName,
        submitterEmail,
        submitterPhone,
        submitterRole,
        totalBudget: totalBudget || 0,
        fundingSource,
        isFundingSecured: isFundingSecured || false,
        objectives: objectives || [],
        timeline: timeline || [],
        estimatedDuration,
        resourcesNeeded: resourcesNeeded || [],
        volunteersNeeded,
        skillsRequired: skillsRequired || [],
        targetAudience,
        expectedImpact,
        communityNeed,
        successMetrics: successMetrics || [],
        status: "pending",
        priority: "normal",
      },
    });

    if (await shouldNotify("notify_new_proposal")) {
      const notifyEmails = await getNotificationEmails();
      if (notifyEmails.length > 0) {
        await sendEmail({
          to: notifyEmails,
          template: "new_proposal",
          data: {
            title,
            submitterName,
            category,
            budget: totalBudget ? `$${totalBudget.toLocaleString()}` : "Not specified",
          },
        });
      }
    }

    return NextResponse.json({ 
      message: "Proposal submitted successfully",
      proposalId: proposal.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Proposal submission error:", error);
    return NextResponse.json({ error: "Failed to submit proposal" }, { status: 500 });
  }
}

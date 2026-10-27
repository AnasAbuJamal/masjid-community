import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET() {
  const proposals = await prisma.projectProposal.findMany({
    where: { status: { in: ["approved", "in_progress", "completed", "pending"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      category: true,
      status: true,
      coverImage: true,
      completionPercent: true,
      createdAt: true,
      submitterName: true,
    },
  });

  const counts = proposals.length ? await prisma.proposalVote.groupBy({
    by: ['proposalId'], where: { proposalId: { in: proposals.map(p => p.id) } }, _count: { _all: true },
  }) : [];
  const voteCounts = new Map(counts.map(c => [c.proposalId, c._count._all]));

  const mapped = proposals.map((p) => ({
    id: String(p.id),
    title: p.title,
    description: p.description || p.summary,
    author: p.submitterName || "Anonymous",
    status: p.status,
    votes: voteCounts.get(p.id) || 0,
    createdAt: p.createdAt.toISOString(),
  }));

  return NextResponse.json({ proposals: mapped });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both full proposals and simplified (mobile) submissions
    const isSimpleSubmission = !body.submitterName && !body.summary;

    if (isSimpleSubmission) {
      const { title, description, category } = body;
      if (!title || !description) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const proposal = await prisma.projectProposal.create({
        data: {
          title,
          summary: description.substring(0, 200),
          description,
          category: category || "other",
          submitterName: "Anonymous",
          submitterEmail: "anonymous@masjid.org",
          totalBudget: 0,
          budgetItems: [],
          milestones: [],
          attachments: [],
          estimatedDuration: "Not specified",
          objectives: [],
          timeline: [],
          resourcesNeeded: [],
          skillsRequired: [],
          successMetrics: [],
          status: "pending",
          priority: "normal",
        },
      });

      return NextResponse.json({
        message: "Proposal submitted successfully",
        proposalId: proposal.id,
      }, { status: 201 });
    }

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
        totalBudget: Number.isFinite(Number(totalBudget)) ? Number(totalBudget) : 0,
        budgetItems: Array.isArray(body.budgetItems) ? body.budgetItems : [],
        milestones: Array.isArray(body.milestones) ? body.milestones : [],
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        fundingSource,
        isFundingSecured: isFundingSecured || false,
        objectives: objectives || [],
        timeline: timeline || [],
        estimatedDuration: estimatedDuration || "Not specified",
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

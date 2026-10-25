import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { proposalInput, publicProposalStatuses } from "@/lib/proposal-access";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET() {
  const proposals = await prisma.projectProposal.findMany({
    where: { status: { in: publicProposalStatuses } },
    orderBy: { createdAt: "desc" },
    select: {
      _count: { select: { votes: true } },
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

  const mapped = proposals.map((p) => ({
    id: String(p.id),
    title: p.title,
    description: p.description || p.summary,
    author: p.submitterName || "Anonymous",
    status: p.status,
    votes: p._count.votes,
    createdAt: p.createdAt.toISOString(),
  }));

  return NextResponse.json({ proposals: mapped });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user.email) return NextResponse.json({ error: 'Please sign in to submit a proposal' }, { status: 401 });
  const input = proposalInput.safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Check the proposal title, description, category and optional fields' }, { status: 400 });
  const data = input.data;
  try {
    const proposal = await prisma.projectProposal.create({ data: {
      ...data,
      summary: data.summary || data.description.substring(0, 200),
      submitterName: session.user.name || 'Community member',
      submitterEmail: session.user.email,
      submitterRole: session.user.role,
      totalBudget: data.totalBudget ?? 0,
      estimatedDuration: data.estimatedDuration || 'To be confirmed',
      objectives: data.objectives || [], timeline: data.timeline || [],
      resourcesNeeded: data.resourcesNeeded || [], skillsRequired: data.skillsRequired || [],
      successMetrics: data.successMetrics || [],
      status: 'pending', priority: 'normal',
    } });
    try {
      if (await shouldNotify('notify_new_proposal')) {
        const recipients = await getNotificationEmails();
        if (recipients.length) await sendEmail({ to: recipients, template: 'new_proposal', data: {
          title: proposal.title, submitterName: proposal.submitterName, category: proposal.category,
          budget: proposal.totalBudget ? `$${proposal.totalBudget.toLocaleString()}` : 'Not specified',
        } });
      }
    } catch { console.error('Proposal saved but staff notification failed'); }
    return NextResponse.json({ message: 'Proposal submitted successfully', proposalId: proposal.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 });
  }
}

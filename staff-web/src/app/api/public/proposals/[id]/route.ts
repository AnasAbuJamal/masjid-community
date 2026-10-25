import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { publicProposalStatuses, proposalIdSchema } from '@/lib/proposal-access';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const parsed = proposalIdSchema.safeParse((await params).id);
 if (!parsed.success) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
 const proposal = await prisma.projectProposal.findFirst({ where: { id: parsed.data, status: { in: publicProposalStatuses } },
 select: { id: true, title: true, description: true, submitterName: true, status: true, createdAt: true, category: true, totalBudget: true, estimatedDuration: true,
 _count: { select: { votes: true } }, comments: { where: { isInternal: false }, orderBy: { createdAt: 'asc' }, select: { id: true, authorName: true, message: true, createdAt: true } } } });
 if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
 return NextResponse.json({ proposal: { id: String(proposal.id), title: proposal.title, description: proposal.description, author: proposal.submitterName,
 status: proposal.status, createdAt: proposal.createdAt, category: proposal.category, budget: proposal.totalBudget, timeline: proposal.estimatedDuration, votes: proposal._count.votes },
 comments: proposal.comments.map(c => ({ id: String(c.id), author: c.authorName, content: c.message, createdAt: c.createdAt })) });
}

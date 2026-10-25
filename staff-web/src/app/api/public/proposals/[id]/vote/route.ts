import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { publicProposalStatuses, proposalIdSchema, commentSchema } from '@/lib/proposal-access';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const session = await auth();
 if (!session) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
 const parsed = proposalIdSchema.safeParse((await params).id);
 if (!parsed.success) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
 const proposal = await prisma.projectProposal.findFirst({ where: { id: parsed.data, status: { in: publicProposalStatuses } } });
 if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
 await prisma.proposalVote.upsert({ where: { proposalId_userId: { proposalId: proposal.id, userId: Number(session.user.id) } }, update: {}, create: { proposalId: proposal.id, userId: Number(session.user.id) } });
 const votes = await prisma.proposalVote.count({ where: { proposalId: proposal.id } });
 return NextResponse.json({ votes });
}

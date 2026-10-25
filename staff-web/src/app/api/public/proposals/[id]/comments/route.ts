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
 const body = commentSchema.safeParse(await req.json().catch(() => null));
 if (!body.success) return NextResponse.json({ error: 'Comment must be 1–5000 characters' }, { status: 400 });
 const comment = await prisma.proposalComment.create({ data: { proposalId: proposal.id, authorName: session.user.name || 'Community member', authorRole: session.user.role, message: body.data.message, isInternal: false } });
 return NextResponse.json({ id: String(comment.id), author: comment.authorName, content: comment.message, createdAt: comment.createdAt }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export async function POST(req: NextRequest, { params }: { params: Promise<{ proposalId: string }> }) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`proposal-vote:${getClientIp(req)}:${user.id}`, 30, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { proposalId } = await params;
  if (!/^\d+$/.test(proposalId)) return NextResponse.json({ error: "Invalid proposal" }, { status: 400 });
  const proposal = await prisma.projectProposal.findUnique({
    where: { id: Number(proposalId) }, select: { id: true, status: true },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["pending", "approved"].includes(proposal.status))
    return NextResponse.json({ error: "Voting is closed for this proposal" }, { status: 409 });
  try {
    await prisma.proposalVote.upsert({
      where: { proposalId_userId: { proposalId: proposal.id, userId: user.id } },
      create: { proposalId: proposal.id, userId: user.id }, update: {},
    });
    const votes = await prisma.proposalVote.count({ where: { proposalId: proposal.id } });
    return NextResponse.json({ success: true, votes });
  } catch {
    return NextResponse.json({ error: "Could not record vote" }, { status: 500 });
  }
}

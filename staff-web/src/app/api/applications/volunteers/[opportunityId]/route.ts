import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export async function POST(req: NextRequest, { params }: { params: Promise<{ opportunityId: string }> }) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`volunteer-application:${getClientIp(req)}:${user.id}`, 15, 60 * 60000).success)
    return NextResponse.json({ error: "Too many applications" }, { status: 429 });
  const { opportunityId } = await params;
  if (!/^\d+$/.test(opportunityId)) return NextResponse.json({ error: "Invalid opportunity" }, { status: 400 });
  try {
    const opportunity = await prisma.volunteerOpportunity.findUnique({ where: { id: Number(opportunityId) } });
    if (!opportunity || opportunity.status !== "open" || opportunity.spotsFilled >= opportunity.spotsTotal ||
        opportunity.eventDate < new Date()) {
      return NextResponse.json({ error: "This opportunity is not available" }, { status: 400 });
    }
    const body = await req.json();
    const skills = typeof body.skills === "string" ? body.skills.trim().slice(0, 1000) : null;
    const existing = await prisma.volunteerApplication.findFirst({
      where: { opportunityId: opportunity.id, userEmail: user.email },
    });
    if (existing) return NextResponse.json({ error: "You already applied" }, { status: 409 });
    const application = await prisma.volunteerApplication.create({ data: {
      opportunityId: opportunity.id,
      userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      userEmail: user.email, skills, status: "pending",
    } });
    return NextResponse.json({ id: String(application.id), status: application.status }, { status: 201 });
  } catch (error) {
    console.error("Volunteer application error:", error);
    return NextResponse.json({ error: "Unable to apply" }, { status: 500 });
  }
}

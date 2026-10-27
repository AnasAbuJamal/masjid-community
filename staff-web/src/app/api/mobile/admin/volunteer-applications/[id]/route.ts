import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

class NoCapacityError extends Error {}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1)
    return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
  const data = await req.json().catch(() => null);
  if (!data || Object.keys(data).length !== 1 || !["approved", "rejected"].includes(data.status))
    return NextResponse.json({ error: "Choose approved or rejected" }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.volunteerApplication.findUnique({
        where: { id: Number(raw) },
        include: { opportunity: { select: { id: true, spotsTotal: true } } },
      });
      if (!application) return null;
      const desired = data.status as "approved" | "rejected";
      if (application.status === desired) return application;
      // Claim this exact transition first, so two reviewers cannot double-count one applicant.
      const transition = await tx.volunteerApplication.updateMany({
        where: { id: application.id, status: application.status },
        data: { status: desired },
      });
      if (transition.count !== 1) throw new NoCapacityError("Application changed. Refresh and retry.");

      if (desired === "approved" && application.status !== "approved") {
        // Conditional database update prevents assigning more volunteers than capacity.
        const capacity = await tx.volunteerOpportunity.updateMany({
          where: {
            id: application.opportunityId,
            status: "open",
            spotsFilled: { lt: application.opportunity.spotsTotal },
          },
          data: { spotsFilled: { increment: 1 } },
        });
        if (!capacity.count) throw new NoCapacityError("No volunteer spots remain");
      } else if (application.status === "approved" && desired === "rejected") {
        await tx.volunteerOpportunity.updateMany({
          where: { id: application.opportunityId, spotsFilled: { gt: 0 } },
          data: { spotsFilled: { decrement: 1 } },
        });
      }
      return { ...application, status: desired };
    });
    if (!result) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    await logAudit({
      action: "review_mobile_volunteer_application",
      userId: String(actor.id), details: `Reviewed volunteer application ${raw}: ${data.status}`,
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({ id: raw, status: result.status }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof NoCapacityError)
      return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Volunteer application review failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to review application" }, { status: 500 });
  }
}

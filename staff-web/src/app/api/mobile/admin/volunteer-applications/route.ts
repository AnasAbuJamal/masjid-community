import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const page = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get("page")) || 1));
  const limit = 50;
  const status = req.nextUrl.searchParams.get("status") || "";
  if (status && !Object.values(ApplicationStatus).includes(status as ApplicationStatus))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const where = {
    ...(status ? { status: status as ApplicationStatus } : {}),
    ...(q ? { OR: [
      { userName: { contains: q, mode: "insensitive" as const } },
      { userEmail: { contains: q, mode: "insensitive" as const } },
      { opportunity: { title: { contains: q, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const [applications, total] = await Promise.all([
    prisma.volunteerApplication.findMany({
      where, orderBy: { createdAt: "desc" },
      take: limit, skip: (page - 1) * limit,
      select: {
        id: true, userName: true, userEmail: true, userPhone: true,
        skills: true, status: true, createdAt: true,
        opportunity: { select: {
          id: true, title: true, eventDate: true, spotsTotal: true, spotsFilled: true,
        } },
      },
    }),
    prisma.volunteerApplication.count({ where }),
  ]);
  return NextResponse.json({
    applications: applications.map(application => ({
      id: String(application.id), applicantName: application.userName,
      applicantEmail: application.userEmail, applicantPhone: application.userPhone,
      skills: application.skills, status: application.status,
      appliedDate: application.createdAt.toISOString(),
      opportunityId: String(application.opportunity.id),
      opportunity: application.opportunity.title,
      eventDate: application.opportunity.eventDate.toISOString(),
      capacity: application.opportunity.spotsTotal,
      approvedCount: application.opportunity.spotsFilled,
    })),
    total, page, hasMore: page * limit < total,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

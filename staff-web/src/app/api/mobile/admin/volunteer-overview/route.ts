import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [opportunities, approved, pendingCount] = await Promise.all([
    prisma.volunteerOpportunity.findMany({
      orderBy: { eventDate: "asc" }, take: 120,
      select: { id: true, title: true, description: true,
        eventDate: true, spotsTotal: true, spotsFilled: true, status: true },
    }),
    prisma.volunteerApplication.findMany({
      where: { status: "approved" }, orderBy: { createdAt: "desc" }, take: 250,
      select: {
        id: true, userName: true, userEmail: true, skills: true,
        opportunity: { select: { title: true, eventDate: true } },
      },
    }),
    prisma.volunteerApplication.count({ where: { status: "pending" } }),
  ]);
  const volunteers = new Map<string, {
    email: string; name: string; skills: string[];
    approvedApplications: number; upcomingEvents: string[];
  }>();
  for (const app of approved) {
    const key = app.userEmail.toLowerCase();
    const current = volunteers.get(key) || {
      email: app.userEmail, name: app.userName, skills: [],
      approvedApplications: 0, upcomingEvents: [],
    };
    current.approvedApplications++;
    const event = app.opportunity;
    if (event.eventDate >= new Date() && current.upcomingEvents.length < 5)
      current.upcomingEvents.push(event.title);
    if (app.skills) {
      const values = app.skills.split(",").map(skill => skill.trim()).filter(Boolean);
      current.skills = [...new Set([...current.skills, ...values])].slice(0, 12);
    }
    volunteers.set(key, current);
  }
  return NextResponse.json({
    opportunities: opportunities.map(opp => ({
      ...opp, id: String(opp.id), eventDate: opp.eventDate.toISOString(),
    })),
    volunteers: [...volunteers.values()],
    counts: { pendingApplications: pendingCount, approvedApplications: approved.length },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

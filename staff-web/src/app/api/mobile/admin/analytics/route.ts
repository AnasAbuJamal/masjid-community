import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

interface MonthlySum { month: string; total: number }
interface MonthlyCount { month: string; count: number }

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const [donationRows, expenseRows, memberRows, activeMembers, students,
    activeVolunteers, pendingJobApplications, pendingVolunteerApplications, openBookings,
    recentEvents] = await Promise.all([
    prisma.$queryRaw<MonthlySum[]>`
      SELECT to_char(date_trunc('month', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
             COALESCE(SUM("amount"), 0)::float AS total
      FROM "Donation"
      WHERE status = 'completed' AND "createdAt" >= ${start}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<MonthlySum[]>`
      SELECT to_char(date_trunc('month', "date" AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
             COALESCE(SUM("amount"), 0)::float AS total
      FROM "FinancialExpense"
      WHERE date >= ${start}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<MonthlyCount[]>`
      SELECT to_char(date_trunc('month', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
             COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${start}
      GROUP BY 1 ORDER BY 1`,
    prisma.user.count({ where: { isActive: true } }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.volunteerApplication.count({ where: { status: "approved" } }),
    prisma.jobApplication.count({ where: { status: "submitted" } }),
    prisma.volunteerApplication.count({ where: { status: "pending" } }),
    prisma.rentalBooking.count({ where: { status: "pending" } }),
    prisma.event.findMany({
      where: { isPublic: true, status: { not: "cancelled" },
        startDate: { gte: start } },
      orderBy: { startDate: "desc" }, take: 12,
      select: { id: true, title: true, startDate: true, capacity: true,
        rsvps: { where: { status: "attending" }, select: { id: true } } },
    }),
  ]);

  const donations = new Map(donationRows.map(r => [r.month, Number(r.total) / 100]));
  const expenses = new Map(expenseRows.map(r => [r.month, Number(r.total)]));
  const members = new Map(memberRows.map(r => [r.month, Number(r.count)]));
  const months = Array.from({ length: 6 }, (_, index) => {
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const key = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      month: key, donations: donations.get(key) || 0,
      expenses: expenses.get(key) || 0, newMembers: members.get(key) || 0,
    };
  });
  const amounts = months.reduce((totals, m) => ({
    donations: totals.donations + m.donations,
    expenses: totals.expenses + m.expenses,
  }), { donations: 0, expenses: 0 });

  return NextResponse.json({
    months, totals: {
      ...amounts, net: amounts.donations - amounts.expenses,
      activeMembers, activeStudents: students,
      approvedVolunteerApplications: activeVolunteers,
      pendingJobApplications, pendingVolunteerApplications, pendingRentalBookings: openBookings,
    },
    // RSVPs are registrations, not actual attendance. Do not present them as check-ins.
    events: recentEvents.map(event => ({
      id: String(event.id), title: event.title, date: event.startDate.toISOString(),
      confirmedRSVPs: event.rsvps.length, capacity: event.capacity,
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

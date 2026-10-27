import { NextRequest, NextResponse } from "next/server";
import { CrmTaskPriority, CrmTaskStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const serialize = (task: {
  id: number; title: string; description: string; assignedTo: string | null;
  dueDate: Date | null; category: string; priority: CrmTaskPriority;
  status: CrmTaskStatus; createdAt: Date;
}) => ({
  ...task, id: String(task.id),
  dueDate: task.dueDate?.toISOString() || null,
  createdAt: task.createdAt.toISOString(),
});

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const page = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("page")) || 1));
  const category = req.nextUrl.searchParams.get("category") || "";
  if (category && !["general", "follow_up"].includes(category))
    return NextResponse.json({ error: "Invalid task category" }, { status: 400 });
  const status = req.nextUrl.searchParams.get("status") || "";
  if (status && !Object.values(CrmTaskStatus).includes(status as CrmTaskStatus))
    return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
  const limit = 60;
  const where = {
    ...(category ? { category } : {}),
    ...(status ? { status: status as CrmTaskStatus } : {}),
  };
  const [tasks, total, pendingVolunteerApplications, pendingJobApplications, pendingRentalBookings] = await Promise.all([
    prisma.crmTask.findMany({
      where, orderBy: [{ status: "asc" }, { dueDate: "asc" }, { id: "desc" }],
      take: limit, skip: (page - 1) * limit,
    }),
    prisma.crmTask.count({ where }),
    prisma.volunteerApplication.count({ where: { status: "pending" } }),
    prisma.jobApplication.count({ where: { status: "submitted" } }),
    prisma.rentalBooking.count({ where: { status: "pending" } }),
  ]);
  return NextResponse.json({
    tasks: tasks.map(serialize),
    pending: { volunteer: pendingVolunteerApplications, jobs: pendingJobApplications,
      rentals: pendingRentalBookings },
    total, page, hasMore: page * limit < total,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`crm-task-create:${actor.id}:${getClientIp(req)}`, 120, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo.trim() : "";
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (!title || title.length > 160 || description.length > 3000 || assignedTo.length > 180 ||
      !Object.values(CrmTaskPriority).includes(body.priority) ||
      !["general", "follow_up"].includes(body.category) ||
      (dueDate && !Number.isFinite(dueDate.getTime())))
    return NextResponse.json({ error: "Invalid title, due date, category or priority" }, { status: 400 });
  const task = await prisma.crmTask.create({
    data: { title, description, assignedTo: assignedTo || null,
      dueDate, category: body.category, priority: body.priority,
      status: "pending" },
  });
  await logAudit({ action: "create_crm_task", userId: String(actor.id),
    details: `Created CRM task ${task.id}`, ipAddress: getClientIp(req) });
  return NextResponse.json(serialize(task), { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const page = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get("page")) || 1));
  const limit = 50;
  const status = req.nextUrl.searchParams.get("status") || "";
  if (status && !["pending_review", "active", "paused", "expired", "closed", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const where = {
    ...(status ? { status: status as "active" } : {}),
    ...(q ? { OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { company: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [jobs, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where, include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.jobPosting.count({ where }),
  ]);
  return NextResponse.json({
    jobs: jobs.map(j => ({
      id: String(j.id), title: j.title, company: j.company, description: j.description,
      location: j.location, employmentType: j.employmentType,
      status: j.status, applicationCount: j._count.applications,
      postedAt: j.createdAt.toISOString(), isUrgent: j.isUrgent,
    })),
    page, total, hasMore: page * limit < total,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`admin-job-create:${admin.id}:${getClientIp(req)}`, 30, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const required = ["title", "company", "contactName", "contactEmail", "description", "location", "category"];
  if (required.some(key => typeof body[key] !== "string" ||
      !body[key].trim() || body[key].length > 1500) ||
      body.title.length > 180 || body.company.length > 180 || body.location.length > 180 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail) ||
      !["full_time", "part_time", "contract", "volunteer", "internship"].includes(body.employmentType))
    return NextResponse.json({ error: "Complete all required job fields and a valid email" }, { status: 400 });
  const job = await prisma.jobPosting.create({ data: {
    title: body.title.trim(), company: body.company.trim(),
    contactName: body.contactName.trim(),
    contactEmail: body.contactEmail.toLowerCase().trim(),
    description: body.description.trim(), requirements: [],
    location: body.location.trim(), category: body.category.trim(),
    employmentType: body.employmentType, status: "active",
  } });
  await logAudit({ action: "create_mobile_job_posting", userId: String(admin.id),
    details: `Published job posting ${job.id}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ id: String(job.id), status: job.status }, { status: 201 });
}

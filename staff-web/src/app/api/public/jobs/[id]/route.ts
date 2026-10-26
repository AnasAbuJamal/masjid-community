import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  const job = await prisma.jobPosting.findFirst({
    where: { id: Number(id), status: "active", OR: [
      { expiresAt: null }, { expiresAt: { gt: new Date() } },
    ] },
    select: { id: true, title: true, company: true, description: true, requirements: true,
      location: true, employmentType: true, salaryMin: true, salaryMax: true,
      salaryPeriod: true, isUrgent: true, createdAt: true, status: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({
    ...job, id: String(job.id), postedAt: job.createdAt.toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
  const worker = await prisma.workerProfile.findFirst({ where: {
    id: Number(id), status: "approved", isPublic: true,
  }, select: {
    id: true, fullName: true, headline: true, bio: true, skills: true,
    location: true, availability: true, photoUrl: true, portfolioUrl: true,
    experience: true, education: true, certifications: true,
  } });
  if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(worker);
}

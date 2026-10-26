import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`resource-view:${getClientIp(req)}`, 40, 60 * 60 * 1000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const changed = await prisma.educationalResource.updateMany({
    where: { id: Number(id), isPublished: true }, data: { viewCount: { increment: 1 } },
  });
  if (!changed.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

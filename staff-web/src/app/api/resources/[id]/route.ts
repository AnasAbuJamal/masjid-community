import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serializeResource } from "@/lib/educational-resources";
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) ||
      Number(id) < 1) return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
  const resource = await prisma.educationalResource.findFirst({
    where: { id: Number(id), isPublished: true },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  return NextResponse.json(serializeResource(resource), {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

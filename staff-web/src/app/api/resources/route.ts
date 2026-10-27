import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serializeResource } from "@/lib/educational-resources";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = (searchParams.get("search") || "").trim().slice(0, 120);
  const category = (searchParams.get("category") || "").trim().slice(0, 90);
  const type = (searchParams.get("type") || "").trim().slice(0, 40);
  const featured = searchParams.get("featured") === "true";
  const page = Math.max(1, Math.min(100, Number(searchParams.get("page")) || 1));
  const limit = 50;
  const where = {
    isPublished: true,
    ...(category ? { category } : {}),
    ...(type ? { type } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(query ? { OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [resources, total, categories] = await Promise.all([
    prisma.educationalResource.findMany({
      where, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit, skip: (page - 1) * limit,
    }),
    prisma.educationalResource.count({ where }),
    prisma.educationalResource.groupBy({
      by: ["category"], where: { isPublished: true }, _count: { _all: true },
      orderBy: { category: "asc" }, take: 100,
    }),
  ]);
  return NextResponse.json({
    resources: resources.map(serializeResource),
    categories: categories.map(c => ({
      id: c.category, name: c.category, resourceCount: c._count._all,
      description: "", icon: "folder-open",
    })),
    page, total, hasMore: page * limit < total,
  }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}

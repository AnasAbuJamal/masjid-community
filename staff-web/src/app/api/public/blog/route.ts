import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (slug) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    return NextResponse.json({ post });
  }

  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      slug: true,
      body: true,
      coverImage: true,
      tags: true,
      author: { select: { firstName: true, lastName: true } },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ posts });
}

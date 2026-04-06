import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const tag = searchParams.get("tag");

    const where: Prisma.BlogPostWhereInput = {};
    if (status) where.status = status as "draft" | "published" | "archived";
    if (categoryId) where.categoryId = categoryId;
    if (tag) where.tags = { has: tag };

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                author: { select: { firstName: true, lastName: true } },
                category: { select: { id: true, name: true, slug: true, color: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { tags, categoryId, metaTitle, metaDescription, seoImage, scheduledFor, ...rest } = body;

    const post = await prisma.blogPost.create({
        data: {
            ...rest,
            slug: slugify(body.title),
            authorId: session.user.id,
            tags: tags || [],
            categoryId: categoryId || null,
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
            seoImage: seoImage || null,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            publishedAt: body.status === "published" && !body.scheduledFor ? new Date() : null,
        },
    });

    await logAudit({ action: "create_blog_post", userId: session.user.id, details: `Created blog post "${body.title}"`, ipAddress: getClientIp(req) });

    return NextResponse.json(post, { status: 201 });
}

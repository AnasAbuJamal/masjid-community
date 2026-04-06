import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
        where: { id },
        include: { author: { select: { firstName: true, lastName: true } } },
    });

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { tags, categoryId, metaTitle, metaDescription, seoImage, scheduledFor, publishedAt, ...rest } = body;

    const data: Prisma.BlogPostUpdateInput = { ...rest };
    if (body.title) data.slug = slugify(body.title);
    if (tags !== undefined) data.tags = tags;
    if (categoryId !== undefined) data.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
    if (metaTitle !== undefined) data.metaTitle = metaTitle || null;
    if (metaDescription !== undefined) data.metaDescription = metaDescription || null;
    if (seoImage !== undefined) data.seoImage = seoImage || null;
    if (scheduledFor !== undefined) data.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    if (publishedAt !== undefined) data.publishedAt = publishedAt ? new Date(publishedAt) : null;

    const post = await prisma.blogPost.update({ where: { id }, data });
    await logAudit({ action: "update_blog_post", userId: session.user.id, details: `Updated blog post ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    await logAudit({ action: "delete_blog_post", userId: session.user.id, details: `Deleted blog post ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}

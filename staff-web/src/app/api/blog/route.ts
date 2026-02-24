import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where = status ? { status: status as "draft" | "published" | "archived" } : {};

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: { author: { select: { firstName: true, lastName: true } } },
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
    if (!session || (session.user as { role: string }).role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const post = await prisma.blogPost.create({
        data: {
            ...body,
            slug: slugify(body.title),
            authorId: (session.user as { id: string }).id,
        },
    });

    return NextResponse.json(post, { status: 201 });
}

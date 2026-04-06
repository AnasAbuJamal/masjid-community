import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { posts: true } } },
    });

    return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, color } = await req.json();

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await prisma.category.findFirst({
        where: { OR: [{ name }, { slug }] },
    });

    if (existing) {
        return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await prisma.category.create({
        data: { name, slug, description, color },
    });

    return NextResponse.json(category, { status: 201 });
}

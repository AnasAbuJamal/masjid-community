import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const folder = searchParams.get("folder");

    const where = folder ? { folder } : {};

    const [files, total] = await Promise.all([
        prisma.mediaFile.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.mediaFile.count({ where }),
    ]);

    const folders = await prisma.mediaFile.findMany({
        where: { folder: { not: null } },
        select: { folder: true },
        distinct: ["folder"],
    });

    return NextResponse.json({
        files,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        folders: folders.map((f) => f.folder).filter(Boolean),
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { filename, originalName, mimeType, size, url, folder } = body;

    if (!filename || !mimeType || !size || !url) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const file = await prisma.mediaFile.create({
        data: {
            filename,
            originalName: originalName || filename,
            mimeType,
            size,
            url,
            folder: folder || null,
            uploadedBy: session.user.id,
        },
    });

    return NextResponse.json(file, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
        await prisma.mediaFile.delete({ where: { id } });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID required" }, { status: 400 });
}

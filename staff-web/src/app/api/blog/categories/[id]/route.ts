import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { name, description, color } = await req.json();

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : undefined;

    const category = await prisma.category.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(slug && { slug }),
            ...(description !== undefined && { description }),
            ...(color !== undefined && { color }),
        },
    });

    await logAudit({ action: "update_blog_category", userId: session.user.id, details: `Updated blog category ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    await logAudit({ action: "delete_blog_category", userId: session.user.id, details: `Deleted blog category ${id}`, ipAddress: "" });
    return NextResponse.json({ success: true });
}

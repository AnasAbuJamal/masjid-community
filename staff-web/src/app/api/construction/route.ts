import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projects = await prisma.constructionProject.findMany({
        orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const project = await prisma.constructionProject.create({ data: body });
    await logAudit({ action: "create_construction", userId: session.user.id, details: `Created construction project "${body.title}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(project, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [opportunities, applications] = await Promise.all([
        prisma.volunteerOpportunity.findMany({
            include: { _count: { select: { applications: true } } },
            orderBy: { eventDate: "desc" },
        }),
        prisma.volunteerApplication.findMany({
            include: { opportunity: { select: { title: true } } },
            orderBy: { createdAt: "desc" },
            take: 30,
        }),
    ]);

    return NextResponse.json({ opportunities, applications });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.description || !body.eventDate) {
        return NextResponse.json({ error: "Title, description, and event date are required" }, { status: 400 });
    }
    body.eventDate = new Date(body.eventDate);
    if (isNaN(body.eventDate.getTime())) {
        return NextResponse.json({ error: "Invalid event date" }, { status: 400 });
    }
    if (body.spotsTotal !== undefined) body.spotsTotal = parseInt(String(body.spotsTotal));
    if (body.spotsFilled !== undefined) body.spotsFilled = parseInt(String(body.spotsFilled));

    const opportunity = await prisma.volunteerOpportunity.create({ data: body });
    await logAudit({ action: "create_volunteer_opp", userId: session.user.id, details: `Created volunteer opportunity "${body.title}"`, ipAddress: getClientIp(req) });
    return NextResponse.json(opportunity, { status: 201 });
}

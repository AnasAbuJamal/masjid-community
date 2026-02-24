import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    body.eventDate = new Date(body.eventDate);

    const opportunity = await prisma.volunteerOpportunity.create({ data: body });
    return NextResponse.json(opportunity, { status: 201 });
}

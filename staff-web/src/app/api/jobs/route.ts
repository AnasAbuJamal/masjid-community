import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [postings, applications, workers] = await Promise.all([
        prisma.jobPosting.findMany({
            include: { _count: { select: { applications: true } } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.jobApplication.findMany({
            include: {
                job: { select: { title: true, company: true } },
                workerProfile: { select: { fullName: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 30,
        }),
        prisma.workerProfile.findMany({
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return NextResponse.json({ postings, applications, workers });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

    const posting = await prisma.jobPosting.create({ data: body });
    return NextResponse.json(posting, { status: 201 });
}

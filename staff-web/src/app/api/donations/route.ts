import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const donations = await prisma.donation.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    const stats = await prisma.donation.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
        _count: true,
    });

    return NextResponse.json({ donations, totalRaised: stats._sum.amount || 0, totalCount: stats._count || 0 });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const days = parseInt(searchParams.get("days") || "30");
    const limit = parseInt(searchParams.get("limit") || "50");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [recentQueries, topQueries, stats] = await Promise.all([
        prisma.searchQuery.findMany({
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: "desc" },
            take: limit,
        }),
        prisma.searchQuery.groupBy({
            by: ["query"],
            where: { createdAt: { gte: startDate } },
            _count: true,
            orderBy: { _count: { query: "desc" } },
            take: limit,
        }),
        prisma.searchQuery.aggregate({
            where: { createdAt: { gte: startDate } },
            _count: true,
            _avg: { results: true },
        }),
    ]);

    const uniqueQueries = await prisma.searchQuery.findMany({
        where: { createdAt: { gte: startDate } },
        select: { query: true },
        distinct: ["query"],
    });

    const zeroResultQueries = recentQueries.filter((q) => q.results === 0);

    return NextResponse.json({
        stats: {
            totalSearches: stats._count,
            uniqueQueries: uniqueQueries.length,
            avgResults: stats._avg.results || 0,
            zeroResultSearches: zeroResultQueries.length,
        },
        topQueries: topQueries.map((q) => ({
            query: q.query,
            count: q._count,
        })),
        recentSearches: recentQueries,
        zeroResultQueries,
    });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const daysOld = parseInt(searchParams.get("daysOld") || "90");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.searchQuery.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
    });

    return NextResponse.json({ deleted: result.count });
}

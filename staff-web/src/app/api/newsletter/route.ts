import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.NewsletterSubscriptionWhereInput = {};

    if (status === "active") {
        where.isActive = true;
    } else if (status === "inactive") {
        where.isActive = false;
    }

    if (search) {
        where.OR = [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
        ];
    }

    const [subscriptions, total] = await Promise.all([
        prisma.newsletterSubscription.findMany({
            where,
            orderBy: { subscribedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.newsletterSubscription.count({ where }),
    ]);

    const activeCount = await prisma.newsletterSubscription.count({ where: { isActive: true } });
    const inactiveCount = await prisma.newsletterSubscription.count({ where: { isActive: false } });

    return NextResponse.json({
        subscriptions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: {
            total: total,
            active: activeCount,
            inactive: inactiveCount,
        },
    });
}

export async function POST(req: NextRequest) {
    const { email, firstName } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    try {
        const existing = await prisma.newsletterSubscription.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existing) {
            if (!existing.isActive) {
                await prisma.newsletterSubscription.update({
                    where: { id: existing.id },
                    data: { isActive: true, unsubscribedAt: null },
                });
            }
            return NextResponse.json({ success: true, message: "Already subscribed" });
        }

        await prisma.newsletterSubscription.create({
            data: {
                email: email.toLowerCase(),
                firstName: firstName || null,
                isActive: true,
                source: "website",
            },
        });

        return NextResponse.json({ success: true, message: "Subscribed successfully" });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (id) {
        await prisma.newsletterSubscription.delete({ where: { id } });
        return NextResponse.json({ success: true });
    }

    if (email) {
        await prisma.newsletterSubscription.update({
            where: { email: email.toLowerCase() },
            data: { isActive: false, unsubscribedAt: new Date() },
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID or email required" }, { status: 400 });
}

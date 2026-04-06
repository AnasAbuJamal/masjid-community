import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const campaign = searchParams.get("campaign");

    const where: Prisma.DonationWhereInput = {};
    if (status) where.status = status as Prisma.EnumDonationStatusFilter;
    if (campaign) where.campaign = campaign;

    const [donations, total, stats] = await Promise.all([
        prisma.donation.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.donation.count({ where }),
        prisma.donation.aggregate({
            where: { ...where, status: "completed" },
            _sum: { amount: true },
            _count: true,
        }),
    ]);

    return NextResponse.json({
        donations,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        totalRaised: stats._sum.amount || 0,
        totalCount: stats._count || 0,
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const donation = await prisma.donation.create({
        data: {
            stripeSessionId: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            donorName: body.donorName,
            donorEmail: body.email || null,
            amount: body.amount,
            campaign: body.campaign || "general",
            status: (body.status || "completed") as "completed" | "pending" | "failed" | "refunded",
            stripePaymentId: body.transactionId || null,
            isRecurring: body.isRecurring || false,
            stripeSubId: body.stripeSubId || null,
        },
    });

    await logAudit({ action: "create_donation", userId: session.user.id, details: `Created donation $${body.amount} from ${body.donorName}`, ipAddress: getClientIp(req) });
    return NextResponse.json(donation, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.donation.delete({ where: { id } });
    await logAudit({ action: "delete_donation", userId: session.user.id, details: `Deleted donation ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json({ success: true });
}

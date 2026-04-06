import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email, firstName } = await req.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existing = await prisma.newsletterSubscription.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing) {
            if (!existing.isActive) {
                await prisma.newsletterSubscription.update({
                    where: { id: existing.id },
                    data: { isActive: true, unsubscribedAt: null, source: "website" },
                });
                return NextResponse.json({
                    success: true,
                    message: "Welcome back! Your subscription has been reactivated."
                });
            }
            return NextResponse.json({
                success: true,
                message: "You're already subscribed!"
            });
        }

        await prisma.newsletterSubscription.create({
            data: {
                email: normalizedEmail,
                firstName: firstName || null,
                isActive: true,
                source: "website",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Thank you for subscribing!"
        });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const subscription = await prisma.newsletterSubscription.findUnique({
            where: { email: normalizedEmail },
        });

        if (!subscription) {
            return NextResponse.json({ success: true, message: "Already unsubscribed" });
        }

        await prisma.newsletterSubscription.update({
            where: { email: normalizedEmail },
            data: { isActive: false, unsubscribedAt: new Date() },
        });

        return NextResponse.json({
            success: true,
            message: "You've been unsubscribed."
        });
    } catch (error) {
        console.error("Newsletter unsubscribe error:", error);
        return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
    }
}

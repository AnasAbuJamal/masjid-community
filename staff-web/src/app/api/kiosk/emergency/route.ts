import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { title, message, expiresInMinutes } = await req.json();

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message required" }, { status: 400 });
        }

        await prisma.siteSetting.upsert({
            where: { key: "emergency_broadcast_title" },
            create: { key: "emergency_broadcast_title", value: title },
            update: { value: title },
        });

        await prisma.siteSetting.upsert({
            where: { key: "emergency_broadcast_message" },
            create: { key: "emergency_broadcast_message", value: message },
            update: { value: message },
        });

        const expiresAt = expiresInMinutes
            ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
            : null;

        if (expiresAt) {
            await prisma.siteSetting.upsert({
                where: { key: "emergency_broadcast_expires" },
                create: { key: "emergency_broadcast_expires", value: expiresAt.toISOString() },
                update: { value: expiresAt.toISOString() },
            });
        }

        await logAudit({
            action: "emergency_broadcast",
            userId: session.user.id,
            details: `Emergency broadcast: ${title}`,
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json({ success: true, message: "Emergency broadcast activated" });
    } catch (error) {
        console.error("Emergency broadcast error:", error);
        return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await prisma.siteSetting.deleteMany({
            where: {
                key: {
                    in: ["emergency_broadcast_title", "emergency_broadcast_message", "emergency_broadcast_expires"],
                },
            },
        });

        await logAudit({
            action: "emergency_broadcast_cleared",
            userId: session.user.id,
            details: "Emergency broadcast cleared",
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json({ success: true, message: "Emergency broadcast cleared" });
    } catch (error) {
        console.error("Clear emergency error:", error);
        return NextResponse.json({ error: "Failed to clear broadcast" }, { status: 500 });
    }
}

export async function GET() {
    const [titleSetting, messageSetting, expiresSetting] = await Promise.all([
        prisma.siteSetting.findUnique({ where: { key: "emergency_broadcast_title" } }),
        prisma.siteSetting.findUnique({ where: { key: "emergency_broadcast_message" } }),
        prisma.siteSetting.findUnique({ where: { key: "emergency_broadcast_expires" } }),
    ]);

    const isActive =
        titleSetting?.value &&
        messageSetting?.value &&
        (!expiresSetting?.value || new Date(expiresSetting.value) > new Date());

    return NextResponse.json({
        isActive,
        title: titleSetting?.value || null,
        message: messageSetting?.value || null,
        expiresAt: expiresSetting?.value || null,
    });
}

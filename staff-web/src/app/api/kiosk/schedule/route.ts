import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const includeEmergency = searchParams.get("includeEmergency") !== "false";

    const now = new Date();

    const [announcements, emergencyBroadcast] = await Promise.all([
        prisma.kioskAnnouncement.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
            orderBy: [
                { priority: "desc" },
                { createdAt: "desc" },
            ],
            take: 10,
        }),
        includeEmergency ? getActiveEmergencyBroadcast() : Promise.resolve(null),
    ]);

    const scheduled = announcements.filter((a) => {
        const startsAt = a.startsAt ? new Date(a.startsAt) : null;
        const expiresAt = a.expiresAt ? new Date(a.expiresAt) : null;
        return (!startsAt || startsAt <= now) && (!expiresAt || expiresAt > now);
    });

    const rotationInterval = await getKioskSetting("rotation_interval", "10");
    const displayDuration = await getKioskSetting("display_duration", "30000");

    return NextResponse.json({
        announcements: scheduled,
        emergency: emergencyBroadcast,
        rotation: {
            intervalSeconds: parseInt(rotationInterval),
            displayDurationMs: parseInt(displayDuration),
            totalItems: scheduled.length + (emergencyBroadcast ? 1 : 0),
        },
        generatedAt: now.toISOString(),
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rotationInterval, displayDuration } = await req.json();

    try {
        if (rotationInterval !== undefined) {
            await prisma.siteSetting.upsert({
                where: { key: "rotation_interval" },
                create: { key: "rotation_interval", value: rotationInterval.toString() },
                update: { value: rotationInterval.toString() },
            });
        }

        if (displayDuration !== undefined) {
            await prisma.siteSetting.upsert({
                where: { key: "display_duration" },
                create: { key: "display_duration", value: displayDuration.toString() },
                update: { value: displayDuration.toString() },
            });
        }

        return NextResponse.json({ success: true, message: "Kiosk settings updated" });
    } catch (error) {
        console.error("Kiosk settings error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}

async function getActiveEmergencyBroadcast() {
    const [titleSetting, messageSetting, expiresSetting] = await Promise.all([
        prisma.siteSetting.findUnique({ where: { key: "emergency_broadcast_title" } }),
        prisma.siteSetting.findUnique({ where: { key: "emergency_broadcast_message" } }),
        prisma.siteSetting.findUnique({ where: { key: "emergency_broadcast_expires" } }),
    ]);

    const isActive =
        titleSetting?.value &&
        messageSetting?.value &&
        (!expiresSetting?.value || new Date(expiresSetting.value) > new Date());

    if (!isActive) return null;

    return {
        title: titleSetting?.value,
        message: messageSetting?.value,
        expiresAt: expiresSetting?.value,
    };
}

async function getKioskSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await prisma.siteSetting.findUnique({
        where: { key },
    });
    return setting?.value || defaultValue;
}

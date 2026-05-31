import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

// Allowed settings keys to prevent arbitrary key injection
const ALLOWED_SETTINGS = [
    'site_name', 'site_tagline', 'contact_email', 'contact_phone',
    'address', 'kiosk_mode', 'kiosk_rotation_interval', 'kiosk_display_duration',
    'theme', 'notification_email', 'notification_push',
    'donation_goal', 'maintenance_mode', 'emergency_broadcast_title',
    'emergency_broadcast_message', 'emergency_broadcast_expires',
    'social_facebook', 'social_twitter', 'social_instagram',
    'registration_enabled', 'require_email_verification',
];

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value; });

    return NextResponse.json({ settings: settingsMap });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    const entries = Object.entries(body);
    if (entries.length === 0) {
        return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    const results = [];
    for (const [key, value] of entries) {
        if (!ALLOWED_SETTINGS.includes(key)) {
            continue;
        }

        const stringValue = String(value);
        if (stringValue.length > 1000) continue;

        const setting = await prisma.siteSetting.upsert({
            where: { key },
            update: { value: stringValue },
            create: { key, value: stringValue },
        });
        results.push(setting);
    }

    await logAudit({ action: "update_settings", userId: session.user.id, details: `Updated ${results.length} setting(s)`, ipAddress: getClientIp(req) });

    return NextResponse.json({ success: true, count: results.length, settings: results });
}

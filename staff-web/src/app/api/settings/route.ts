import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

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
    const results = [];

    for (const [key, value] of Object.entries(body)) {
        const setting = await prisma.siteSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        });
        results.push(setting);
    }

    await logAudit({ action: "update_settings", userId: session.user.id, details: `Updated ${results.length} setting(s)`, ipAddress: getClientIp(req) });

    return NextResponse.json({ success: true, settings: results });
}

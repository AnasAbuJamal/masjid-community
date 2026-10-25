import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
    try {
        if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) throw new Error("Missing configuration");
        // Checking a model verifies the schema as well as connectivity.
        await prisma.user.count();
        return NextResponse.json({ status: "ok", database: "ready" }, { headers: { "Cache-Control": "no-store" } });
    } catch {
        return NextResponse.json({ status: "unavailable", database: "not_ready" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
}

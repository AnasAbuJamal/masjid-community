import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public deployment readiness probe. Deliberately never returns secrets, schema,
// a database host name, exception messages, or application account information.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "reachable" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ status: "unavailable", database: "unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}

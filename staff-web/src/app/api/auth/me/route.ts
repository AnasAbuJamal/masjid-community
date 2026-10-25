import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, role: true, createdAt: true,
    } });
    return NextResponse.json({ ...user, id: String(user.id) }, { headers: { "Cache-Control": "no-store" } });
}

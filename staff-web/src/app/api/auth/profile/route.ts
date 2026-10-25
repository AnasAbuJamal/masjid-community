import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { profileSchema } from "@/lib/auth-validation";
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = profileSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid profile fields" }, { status: 400 });
    const user = await prisma.user.update({ where: { id: session.user.id }, data: parsed.data, select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, role: true,
    } });
    return NextResponse.json({ ...user, id: String(user.id) });
}

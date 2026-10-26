import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
export async function PATCH(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const updates: { firstName?: string; lastName?: string; phone?: string | null } = {};
    for (const key of ["firstName", "lastName"] as const) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== "string" || !body[key].trim() || body[key].length > 100)
          return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
        updates[key] = body[key].trim();
      }
    }
    if (body.phone !== undefined) {
      if (body.phone !== null && (typeof body.phone !== "string" || body.phone.length > 30))
        return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
      updates.phone = typeof body.phone === "string" ? body.phone.trim() : null;
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: updates });
    return NextResponse.json({
      id: String(updated.id), email: updated.email, firstName: updated.firstName,
      lastName: updated.lastName, role: updated.role, phone: updated.phone,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to update profile" }, { status: 400 });
  }
}

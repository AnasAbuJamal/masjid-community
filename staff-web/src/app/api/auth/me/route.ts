import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
export async function GET(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: String(user.id), email: user.email, firstName: user.firstName,
    lastName: user.lastName, role: user.role, phone: user.phone,
  }, { headers: { "Cache-Control": "no-store" } });
}

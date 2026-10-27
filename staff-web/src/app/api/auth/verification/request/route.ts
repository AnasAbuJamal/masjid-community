import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getApiIdentity } from "@/lib/api-identity";
import { sendEmailVerification } from "@/lib/email-verification";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const identity = await getApiIdentity(req);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (identity.isVerified) return NextResponse.json({ success: true, verified: true });
  const limit = rateLimit(`verify-email:${identity.id}:${getClientIp(req)}`, 3, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Try again later" }, { status: 429 });
  const user = await prisma.user.findUnique({ where: { id: identity.id } });
  if (!user?.isActive) return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  const sent = await sendEmailVerification(user);
  if (!sent) return NextResponse.json({ error: "Email delivery is unavailable; please contact support" }, { status: 503 });
  return NextResponse.json({ success: true, message: "Verification instructions sent" });
}

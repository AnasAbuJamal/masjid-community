import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const validExpoToken = (token: unknown): token is string =>
  typeof token === "string" && token.length <= 250 &&
  /^(?:Expo|Exponent)PushToken\[[a-zA-Z0-9_-]{8,200}\]$/.test(token);

export async function POST(req: NextRequest) {
  const identity = await getApiIdentity(req);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`register-push:${identity.id}:${getClientIp(req)}`, 25, 60 * 60000).success)
    return NextResponse.json({ error: "Too many registration attempts" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!validExpoToken(body?.token))
    return NextResponse.json({ error: "Valid Expo push token required" }, { status: 400 });

  try {
    // Signing into a shared device transfers notification ownership. Delivery jobs
    // must only use tokens where userId equals the intended recipient.
    await prisma.pushToken.upsert({
      where: { token: body.token },
      update: { userId: identity.id },
      create: { token: body.token, userId: identity.id },
    });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to register device" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const identity = await getApiIdentity(req);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!validExpoToken(body?.token))
    return NextResponse.json({ error: "Valid Expo push token required" }, { status: 400 });
  const removed = await prisma.pushToken.deleteMany({
    where: { token: body.token, userId: identity.id },
  });
  return NextResponse.json({ success: true, removed: removed.count }, {
    headers: { "Cache-Control": "no-store" },
  });
}

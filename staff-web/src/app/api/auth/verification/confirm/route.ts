import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'self'; style-src 'unsafe-inline'",
};

function page(heading: string, message: string, formToken?: string) {
  return new NextResponse(`<!doctype html><html lang="en"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email verification — Al-Momineen</title></head>
    <body style="font-family:system-ui,sans-serif;margin:0;background:#f5f5f7;color:#1d1d1f;min-height:100vh;display:grid;place-items:center">
      <main style="background:white;max-width:420px;margin:20px;padding:32px;border-radius:18px">
        <h1 style="font-size:24px">${heading}</h1><p>${message}</p>
        ${formToken ? `<form method="post" action="/api/auth/verification/confirm">
          <input type="hidden" name="token" value="${formToken}">
          <button type="submit" style="min-height:44px;padding:12px 24px;background:#007aff;color:white;border:0;border-radius:12px;font-size:16px">Confirm my email</button>
        </form>` : ""}
      </main>
    </body></html>`, { headers: HEADERS });
}
const isToken = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!isToken(token)) return page("Invalid link", "Please request a new verification email.");
  const match = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
  });
  if (!match || match.expiresAt <= new Date())
    return page("Link expired", "Please request a new verification email.");
  return page("Confirm your email", "Use the button below to verify your address and enable private account features.", token);
}

export async function POST(req: NextRequest) {
  const token = (await req.formData().catch(() => null))?.get("token");
  if (!isToken(token)) return page("Invalid link", "Please request a new verification email.");
  const match = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
  });
  if (!match || match.expiresAt <= new Date())
    return page("Link expired", "Please request a new verification email.");
  const user = await prisma.user.findUnique({ where: { id: match.userId } });
  if (!user?.isActive) return page("Account unavailable", "Contact support for help.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { isVerified: true } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
  ]);
  return page("Email verified", "You can return to the Masjid Community app and sign in.");
}

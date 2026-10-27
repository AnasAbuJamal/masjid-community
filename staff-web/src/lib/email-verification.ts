import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const TTL_MS = 30 * 60 * 1000;

export function hashVerificationToken(raw: string) {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function sendEmailVerification(user: {
  id: number; email: string; firstName: string; isVerified: boolean;
}): Promise<boolean> {
  if (user.isVerified) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || (!appUrl.startsWith("https://") &&
      !(process.env.NODE_ENV !== "production" && appUrl.startsWith("http://localhost:")))) {
    console.error("Email verification URL is not configured securely");
    return false;
  }
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(raw);
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  const url = `${appUrl}/api/auth/verification/confirm?token=${raw}`;
  const firstName = user.firstName.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const sent = await sendEmail({
    to: user.email,
    subject: "Verify your Al-Momineen community email",
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto">
      <h1>Confirm your email</h1>
      <p>Assalamu Alaikum ${firstName},</p>
      <p>Confirm your email address to access private parent and account records.</p>
      <p><a href="${url}">Verify email address</a></p>
      <p>This link expires in 30 minutes. If you did not request it, ignore this email.</p>
    </div>`,
  });
  if (!sent) {
    await prisma.emailVerificationToken.deleteMany({ where: { tokenHash } });
  }
  return sent;
}

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

type TokenClaims = { sub: number; iat: number; exp: number; v: string };
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters");
  }
  return secret;
}

function passwordVersion(passwordHash: string): string {
  return createHmac("sha256", signingSecret()).update(passwordHash).digest("hex").slice(0, 16);
}

/** Short-lived, HMAC-authenticated access token for the native mobile app. */
export function createMobileToken(user: { id: number; passwordHash: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    v: passwordVersion(user.passwordHash),
  } satisfies TokenClaims)).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", signingSecret()).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyMobileToken(token: string): TokenClaims | null {
  if (token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const [header, payload, signature] = parts;
    const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (decodedHeader.alg !== "HS256" || decodedHeader.typ !== "JWT") return null;
    const expected = createHmac("sha256", signingSecret()).update(`${header}.${payload}`).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return null;
    const claims: TokenClaims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(claims.sub) || claims.sub <= 0 ||
        !Number.isInteger(claims.iat) || claims.iat > now + 60 ||
        !Number.isInteger(claims.exp) || claims.exp <= now ||
        claims.exp - claims.iat > TOKEN_TTL_SECONDS ||
        typeof claims.v !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}

export async function getMobileAuthUser(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const claims = verifyMobileToken(authorization.slice(7));
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user?.isActive || passwordVersion(user.passwordHash) !== claims.v) return null;
  return user;
}

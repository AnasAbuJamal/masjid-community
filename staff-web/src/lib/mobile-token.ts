import { encode, decode } from "next-auth/jwt";

export const MOBILE_TOKEN_MAX_AGE = 30 * 60;
function secret() {
    if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required");
    return process.env.AUTH_SECRET;
}
export async function issueMobileToken(userId: number) {
    return encode({ secret: secret(), maxAge: MOBILE_TOKEN_MAX_AGE,
        token: { sub: String(userId), purpose: "mobile-access" } });
}
export async function verifyMobileToken(token: string) {
    try {
        const payload = await decode({ token, secret: secret() });
        if (payload?.purpose !== "mobile-access" || !payload.sub || !payload.exp) return null;
        if (!/^\d+$/.test(payload.sub) || Number(payload.exp) <= Date.now() / 1000) return null;
        return payload;
    } catch { return null; }
}

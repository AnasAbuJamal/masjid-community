import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "./db";
import { HttpError } from "./http";

const SESSION = "masjid_session";
const DAYS = 7;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export type Actor = { id: string; role: UserRole; email: string; verifiedAt: Date | null; firstName: string; lastName: string };
export async function actor(req: NextRequest): Promise<Actor | null> {
  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : req.cookies.get(SESSION)?.value;
  if (!token || token.length < 30 || token.length > 200) return null;
  const session = await db.authSession.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { select: { id: true, role: true, email: true, verifiedAt: true, firstName: true, lastName: true, status: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "active") return null;
  const { status: _status, ...identity } = session.user;
  return identity;
}
export async function requireActor(req: NextRequest, roles?: UserRole[]): Promise<Actor> {
  const user = await actor(req);
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in.");
  if (roles && !roles.includes(user.role)) throw new HttpError(403, "FORBIDDEN", "You cannot perform this action.");
  return user;
}
export async function requireVerified(req: NextRequest, roles?: UserRole[]) {
  const user = await requireActor(req, roles);
  if (!user.verifiedAt) throw new HttpError(403, "EMAIL_NOT_VERIFIED", "Verify your email first.");
  return user;
}
export async function startSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.authSession.create({
    data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + DAYS * 86400000) },
  });
  return token;
}
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: DAYS * 86400,
  });
}
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION, "", { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict",path:"/",maxAge:0 });
}
export async function revokeSession(token: string) {
  await db.authSession.updateMany({ where:{tokenHash:hash(token)},data:{revokedAt:new Date()} });
}
export async function checkPassword(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.passwordHash)))
    throw new HttpError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  return user;
}
export function sessionFrom(req: NextRequest) {
  const bearer = req.headers.get("authorization");
  return bearer?.startsWith("Bearer ") ? bearer.slice(7) : req.cookies.get(SESSION)?.value || "";
}
export async function audit(actorId: string, action: string, entity: string, entityId: string) {
  await db.auditEvent.create({ data: {actorId,action,entity,entityId} });
}
export const tokenHash = hash;

export async function checkLoginThrottle(email: string) {
  const keyHash=hash("login:"+email.toLowerCase());
  const row=await db.authThrottle.findUnique({where:{keyHash}});
  if(row?.blockedUntil&&row.blockedUntil>new Date())
    throw new HttpError(429,"LOGIN_THROTTLED","Too many sign-in attempts. Please try again later.");
}
export async function recordFailedLogin(email: string) {
  const keyHash=hash("login:"+email.toLowerCase());
  const row=await db.authThrottle.findUnique({where:{keyHash}});
  const recent=!!row && row.updatedAt>new Date(Date.now()-15*60_000);
  const failures=recent?(row?.failures||0)+1:1;
  await db.authThrottle.upsert({where:{keyHash},
    create:{keyHash,failures,blockedUntil:failures>=6?new Date(Date.now()+15*60_000):null},
    update:{failures,blockedUntil:failures>=6?new Date(Date.now()+15*60_000):null}});
}
export async function clearLoginThrottle(email:string){
  await db.authThrottle.deleteMany({where:{keyHash:hash("login:"+email.toLowerCase())}});
}

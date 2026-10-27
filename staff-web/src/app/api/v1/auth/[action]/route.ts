import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { actor, checkPassword, clearSessionCookie, requireActor, revokeSession, sessionFrom, setSessionCookie, startSession, tokenHash } from "@/lib/auth";
import { requestVerification } from "@/lib/email";
import { assertSameOrigin, fail, handled, HttpError, jsonBody, ok } from "@/lib/http";

const register = z.object({email:z.email().max(254),password:z.string().min(12).max(128),firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100)});
const login = z.object({email:z.email(),password:z.string().min(1)});
type Context={params:Promise<{action:string}>};
export async function GET(req: NextRequest,{params}:Context) {
  return handled(async()=>{
    const { action }=await params;
    if(action!=="me")throw new HttpError(404,"NOT_FOUND","Unknown action.");
    const user=await actor(req);
    return ok(user ? {id:user.id,firstName:user.firstName,lastName:user.lastName,email:user.email,role:user.role,isVerified:!!user.verifiedAt}:null);
  });
}
export async function POST(req:NextRequest,{params}:Context) {
 return handled(async()=>{
  assertSameOrigin(req);
  const {action}=await params;
  if(action==="register"){
    const values=register.parse(await jsonBody(req));
    const email=values.email.trim().toLowerCase();
    if(await db.user.findUnique({where:{email}})) throw new HttpError(409,"ALREADY_REGISTERED","This email is already registered.");
    const user=await db.user.create({data:{email,firstName:values.firstName,lastName:values.lastName,passwordHash:await bcrypt.hash(values.password,12),role:"member"}});
    const verificationSent=await requestVerification(user).catch(()=>false);
    return ok({registered:true,verificationSent,message:verificationSent?"Check your email to verify your account.":"Account created; email delivery is not yet configured. Contact the organization."},201);
  }
  if(action==="login"){
    const values=login.parse(await jsonBody(req));
    const user=await checkPassword(values.email,values.password);
    const token=await startSession(user.id);
    const response=NextResponse.json({data:{token,user:{id:user.id,email:user.email,firstName:user.firstName,lastName:user.lastName,role:user.role,isVerified:!!user.verifiedAt}}},{headers:{"Cache-Control":"no-store"}});
    setSessionCookie(response,token);
    return response;
  }
  if(action==="logout"){
    const token=sessionFrom(req);
    if(token)await revokeSession(token);
    const response=NextResponse.json({data:{signedOut:true}});
    clearSessionCookie(response);return response;
  }
  if(action==="verify"){
    const {token}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/i)}).parse(await jsonBody(req));
    const saved=await db.emailToken.findUnique({where:{tokenHash:tokenHash(token)}});
    if(!saved||saved.consumedAt||saved.expiresAt<=new Date())throw new HttpError(400,"EXPIRED","Link is invalid or expired.");
    await db.$transaction([
      db.user.update({where:{id:saved.userId},data:{verifiedAt:new Date()}}),
      db.emailToken.updateMany({where:{userId:saved.userId,consumedAt:null},data:{consumedAt:new Date()}})
    ]);
    return ok({verified:true});
  }
  if(action==="resend-verification"){
    const user=await requireActor(req);
    if(user.verifiedAt)return ok({verificationSent:false,alreadyVerified:true});
    const last=await db.emailToken.findFirst({where:{userId:user.id,expiresAt:{gt:new Date()}},orderBy:{id:"desc"}});
    if(last)throw new HttpError(429,"PLEASE_WAIT","Use your recent email or try again later.");
    const verificationSent=await requestVerification(user).catch(()=>false);
    return ok({verificationSent});
  }
  throw new HttpError(404,"NOT_FOUND","Unknown action.");
 });
}

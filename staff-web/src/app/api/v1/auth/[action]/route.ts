import { NextRequest, NextResponse } from "next/server";
import { encryptMfaSecret, generateMfaSecret, decryptMfaSecret, verifyMfaCode } from "@/lib/mfa";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { actor, checkPassword, checkLoginThrottle, recordFailedLogin, clearLoginThrottle, checkMfaThrottle, recordMfaFailure, clearMfaThrottle, clearSessionCookie, requireActor, revokeSession, sessionFrom, setSessionCookie, startSession, tokenHash } from "@/lib/auth";
import { requestVerification, sendPasswordReset } from "@/lib/email";
import { assertSameOrigin, fail, handled, HttpError, jsonBody, ok } from "@/lib/http";

const register = z.object({email:z.email().max(254),password:z.string().min(12).max(128),firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100)});
const login = z.object({email:z.email(),password:z.string().min(1)});
type Context={params:Promise<{action:string}>};
export async function GET(req: NextRequest,{params}:Context) {
  return handled(async()=>{
    const { action }=await params;
    if(action!=="me")throw new HttpError(404,"NOT_FOUND","Unknown action.");
    const user=await actor(req);
    return ok(user ? {id:user.id,firstName:user.firstName,lastName:user.lastName,email:user.email,role:user.role,isVerified:!!user.verifiedAt,mfaRequired:((["admin","finance"].includes(user.role)||user.role==="staff"&&user.mfaEnabled)&&!user.mfaVerified),
 mfaSetupRequired:(["admin","finance"].includes(user.role)||user.role==="staff")&&!user.mfaEnabled,
 mfaEnabled:user.mfaEnabled,mfaVerified:user.mfaVerified}:null);
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
    const organization=await db.organization.findFirst();
    if(!organization)throw new HttpError(503,"NOT_CONFIGURED","Community registration is not configured.");
    const user=await db.user.create({data:{email,firstName:values.firstName,lastName:values.lastName,
      passwordHash:await bcrypt.hash(values.password,12),role:"member",
      memberships:{create:{organizationId:organization.id}}}});
    const verificationSent=await requestVerification(user).catch(()=>false);
    return ok({registered:true,verificationSent,message:verificationSent?"Check your email to verify your account.":"Account created; email delivery is not yet configured. Contact the organization."},201);
  }
  if(action==="login"){
    const values=login.parse(await jsonBody(req));
    const normalized=values.email.trim().toLowerCase();
    await checkLoginThrottle(normalized);
    let user;
    try { user=await checkPassword(normalized,values.password); }
    catch(error) { await recordFailedLogin(normalized); throw error; }
    await clearLoginThrottle(normalized);
    const token=await startSession(user.id);
    const response=NextResponse.json({data:{token,user:{id:user.id,email:user.email,firstName:user.firstName,lastName:user.lastName,role:user.role,isVerified:!!user.verifiedAt,mfaRequired:["admin","finance"].includes(user.role)||user.role==="staff"&&!!user.mfaEnabledAt,
 mfaSetupRequired:(["admin","finance"].includes(user.role)||user.role==="staff")&&!user.mfaEnabledAt}}},{headers:{"Cache-Control":"no-store"}});
    setSessionCookie(response,token);
    return response;
  }
  if(action==="mfa-setup"){
    const current=await requireActor(req);
    if(!current.verifiedAt)throw new HttpError(403,"VERIFY_EMAIL","Verify your email first.");
    if(current.mfaEnabled)throw new HttpError(409,"MFA_ALREADY_ENABLED","MFA is already enabled.");
    const {password}=z.object({password:z.string().min(1)}).parse(await jsonBody(req));
    await checkLoginThrottle(current.email);
    try { await checkPassword(current.email,password); }
    catch(e){await recordFailedLogin(current.email);throw e;}
    await clearLoginThrottle(current.email);
    const secret=generateMfaSecret();
    await db.user.update({where:{id:current.id},data:{mfaPendingSecretEncrypted:encryptMfaSecret(secret)}});
    const label=encodeURIComponent("Masjid Community:"+current.email);
    const uri="otpauth://totp/"+label+"?secret="+secret+"&issuer="+encodeURIComponent("Masjid Community")+"&algorithm=SHA1&digits=6&period=30";
    return ok({secret,otpauthUri:uri,message:"Store this secret in your authenticator app, then confirm a code. The secret will not be shown again."});
  }
  if(action==="mfa-enable"){
    const current=await requireActor(req);
    if(!current.verifiedAt)throw new HttpError(403,"VERIFY_EMAIL","Verify your email first.");
    const {code}=z.object({code:z.string().regex(/^\d{6}$/)}).parse(await jsonBody(req));
    await checkMfaThrottle(current.id);
    const account=await db.user.findUniqueOrThrow({where:{id:current.id}});
    if(account.mfaEnabledAt||!account.mfaPendingSecretEncrypted)throw new HttpError(409,"NO_SETUP","Start MFA enrollment before confirming.");
    const step=verifyMfaCode(decryptMfaSecret(account.mfaPendingSecretEncrypted),code);
    if(step===null){await recordMfaFailure(current.id);throw new HttpError(422,"INCORRECT_CODE","Authenticator code is incorrect or expired.");}
    const token=sessionFrom(req);
    await db.$transaction(async tx=>{
      const updated=await tx.user.updateMany({where:{id:current.id,mfaEnabledAt:null,mfaPendingSecretEncrypted:account.mfaPendingSecretEncrypted},
        data:{mfaSecretEncrypted:account.mfaPendingSecretEncrypted,mfaPendingSecretEncrypted:null,mfaEnabledAt:new Date(),mfaLastCounter:step}});
      if(!updated.count)throw new HttpError(409,"SETUP_CHANGED","MFA enrollment has changed. Start again.");
      await tx.authSession.updateMany({where:{userId:current.id,tokenHash:tokenHash(token),revokedAt:null},data:{mfaVerifiedAt:new Date()}});
      await tx.auditEvent.create({data:{actorId:current.id,action:"auth.mfa.enable",entity:"User",entityId:current.id}});
    });
    await clearMfaThrottle(current.id);
    return ok({mfaVerified:true,message:"MFA is enabled."});
  }
  if(action==="mfa-verify"){
    const current=await requireActor(req);
    if(!current.verifiedAt)throw new HttpError(403,"VERIFY_EMAIL","Verify your email first.");
    const {code}=z.object({code:z.string().regex(/^\d{6}$/)}).parse(await jsonBody(req));
    await checkMfaThrottle(current.id);
    const account=await db.user.findUniqueOrThrow({where:{id:current.id}});
    if(!account.mfaEnabledAt||!account.mfaSecretEncrypted)throw new HttpError(409,"MFA_NOT_ENABLED","Configure your authenticator first.");
    const step=verifyMfaCode(decryptMfaSecret(account.mfaSecretEncrypted),code);
    if(step===null){await recordMfaFailure(current.id);throw new HttpError(401,"INVALID_CODE","Authenticator code is incorrect or expired.");}
    const changed=await db.user.updateMany({where:{id:current.id,mfaLastCounter:{lt:step}},data:{mfaLastCounter:step}});
    if(!changed.count)throw new HttpError(409,"CODE_REUSED","Use the next authenticator code.");
    const token=sessionFrom(req);
    const session=await db.authSession.updateMany({where:{userId:current.id,tokenHash:tokenHash(token),revokedAt:null,expiresAt:{gt:new Date()}},data:{mfaVerifiedAt:new Date()}});
    if(!session.count)throw new HttpError(401,"SESSION_EXPIRED","Sign in again.");
    await db.auditEvent.create({data:{actorId:current.id,action:"auth.mfa.verify",entity:"AuthSession",entityId:current.id}});
    await clearMfaThrottle(current.id);
    return ok({mfaVerified:true});
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
  if(action==="request-password-reset"){
    const {email}=z.object({email:z.email().max(254)}).parse(await jsonBody(req));
    const target=await db.user.findUnique({where:{email:email.trim().toLowerCase()}});
    if(target&&target.status==="active"){
      const recent=await db.passwordResetToken.findFirst({where:{userId:target.id,createdAt:{gt:new Date(Date.now()-5*60_000)}}});
      if(!recent)await sendPasswordReset(target);
    }
    return ok({message:"If an account exists, a reset link will be sent if email delivery is available."});
  }
  if(action==="reset-password"){
    const {token,password}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/i),password:z.string().min(12).max(128)}).parse(await jsonBody(req));
    const challenge=await db.passwordResetToken.findUnique({where:{tokenHash:tokenHash(token)}});
    if(!challenge||challenge.consumedAt||challenge.expiresAt<=new Date())
      throw new HttpError(400,"RESET_INVALID","This reset link is invalid or expired.");
    const now=new Date();
    const updated=await db.passwordResetToken.updateMany({where:{id:challenge.id,consumedAt:null,expiresAt:{gt:now}},data:{consumedAt:now}});
    if(!updated.count)throw new HttpError(409,"RESET_USED","This reset link has already been used.");
    await db.$transaction([
      db.user.update({where:{id:challenge.userId},data:{passwordHash:await bcrypt.hash(password,12)}}),
      db.authSession.updateMany({where:{userId:challenge.userId,revokedAt:null},data:{revokedAt:now}}),
      db.passwordResetToken.updateMany({where:{userId:challenge.userId,consumedAt:null},data:{consumedAt:now}})
    ]);
    return ok({passwordChanged:true,message:"Password updated. Please sign in again."});
  }
  if(action==="logout-all"){
    const user=await requireActor(req);
    await db.authSession.updateMany({where:{userId:user.id,revokedAt:null},data:{revokedAt:new Date()}});
    const response=NextResponse.json({data:{revoked:true}});
    clearSessionCookie(response);
    return response;
  }
  throw new HttpError(404,"NOT_FOUND","Unknown action.");
 });
}

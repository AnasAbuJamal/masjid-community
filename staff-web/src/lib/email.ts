import { randomBytes } from "node:crypto";
import { db } from "./db";
import { tokenHash } from "./auth";

export async function requestVerification(user: {id:string; email:string;firstName:string}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!key || !from || !origin) return false;
  const token = randomBytes(32).toString("hex");
  const record = await db.emailToken.create({data:{userId:user.id,tokenHash:tokenHash(token),expiresAt:new Date(Date.now()+30*60_000)}});
  const url = new URL("/verify",origin);
  url.searchParams.set("token",token);
  const response = await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({from,to:[user.email],subject:"Verify your Masjid Community account",html:
      '<p>Assalamu alaikum '+escapeHtml(user.firstName)+',</p><p>Please verify your email address:</p><p><a href="'+escapeHtml(url.toString())+'">Confirm email</a></p><p>This link expires in 30 minutes.</p>'}),
  });
  if (!response.ok) {
    await db.emailToken.delete({where:{id:record.id}});
    console.error("Email provider failed",response.status);
    return false;
  }
  return true;
}
function escapeHtml(s:string) {return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] || c));}

export async function sendPasswordReset(user:{id:string;email:string;firstName:string}) {
  const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM,origin=process.env.NEXT_PUBLIC_APP_URL;
  if(!key||!from||!origin||(process.env.NODE_ENV==="production"&&!origin.startsWith("https://")))return false;
  const value=randomBytes(32).toString("hex");
  const record=await db.passwordResetToken.create({data:{userId:user.id,tokenHash:tokenHash(value),expiresAt:new Date(Date.now()+30*60_000)}});
  const url=new URL("/reset-password",origin);
  url.searchParams.set("token",value);
  try{
    const res=await fetch("https://api.resend.com/emails",{method:"POST",
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({from,to:[user.email],subject:"Reset your Masjid Community password",
        html:'<p>Assalamu alaikum '+escapeHtml(user.firstName)+',</p><p>Use the secure link below to reset your password. It expires in 30 minutes.</p><p><a href="'+escapeHtml(url.toString())+'">Reset my password</a></p><p>If you did not request this, ignore the email.</p>'})
    });
    if(!res.ok)throw new Error("Email delivery failed: "+res.status);
    return true;
  }catch {
    await db.passwordResetToken.delete({where:{id:record.id}});
    return false;
  }
}

import {randomBytes} from "node:crypto";
import {tokenHash} from "@/lib/auth";

// Tokens are never persisted in plaintext; API returns them only in a
// specially gated disposable CI database when testing acceptance flows.
export function makeStaffInvitationToken(){
 const token=randomBytes(32).toString("hex");
 return {token,hash:tokenHash(token)};
}
export function inviteCiCaptureEnabled(){
 return process.env.GITHUB_ACTIONS==="true"&&
  process.env.SILA_INVITE_CI_CAPTURE==="test-only"&&
  !!process.env.DATABASE_URL?.includes("/masjid_ci")&&
  process.env.NEXT_PUBLIC_APP_URL==="http://localhost:3000";
}
export function inviteEmailConfigured(){
 const origin=process.env.NEXT_PUBLIC_APP_URL||"";
 return !!process.env.RESEND_API_KEY&&!!process.env.EMAIL_FROM&&
  !!origin&&((process.env.NODE_ENV!=="production")||origin.startsWith("https://"));
}
function escaped(s:string){return s.replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]||c));}
export async function sendStaffInvite(email:string,organization:string,token:string,expiresAt:Date){
 if(!inviteEmailConfigured())return false;
 const url=new URL("/invite",process.env.NEXT_PUBLIC_APP_URL);
 // URL fragment is not transmitted in an HTTP request/referrer.
 url.hash="token="+token;
 try{
  const res=await fetch("https://api.resend.com/emails",{method:"POST",
   headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},
   body:JSON.stringify({
    from:process.env.EMAIL_FROM,to:[email],subject:"Invitation to support your community",
    html:"<p>You have been invited to a staff role at "+escaped(organization)+
     ".</p><p>Open this private, one-time link after signing in with the exact invited email address: "+
     '<a href="'+escaped(url.toString())+'">Review staff invitation</a></p>'+
     "<p>The invitation expires "+escaped(expiresAt.toISOString())+
     ". You must verify your email and enroll an authenticator before accepting. If unexpected, ignore this message.</p>"
   })
  });
  if(!res.ok){console.error("Invitation email provider failed",res.status);return false;}
  return true;
 }catch{return false;}
}

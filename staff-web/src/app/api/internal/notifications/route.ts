import {NextRequest} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {handled,HttpError,ok} from "@/lib/http";
import {evaluateEmailDelivery} from "@/lib/delivery-policy";

// CI can exercise the real consent/quiet-hour path without contacting Resend.
// This exception requires BOTH GitHub Actions and a disposable localhost
// database, never environment credentials alone.
function syntheticDelivery(){
 return process.env.GITHUB_ACTIONS==="true"&&
  process.env.SILA_DELIVERY_CI_CAPTURE==="test-only"&&
  process.env.DATABASE_URL?.endsWith("/masjid_ci")===true&&
  process.env.NEXT_PUBLIC_APP_URL==="http://localhost:3000";
}
function authorized(req:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<32)throw new HttpError(503,"DELIVERY_NOT_CONFIGURED","The delivery worker is not configured.");
 const input=req.headers.get("authorization")||"";
 const actual=Buffer.from(input,"utf8"),expected=Buffer.from("Bearer "+secret,"utf8");
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))
  throw new HttpError(401,"UNAUTHORIZED","Worker authentication required.");
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  authorized(req);
  const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM,origin=process.env.NEXT_PUBLIC_APP_URL;
  if(!syntheticDelivery()&&(!key||!from||!origin||(!origin.startsWith("https://")&&process.env.NODE_ENV==="production")))
   throw new HttpError(503,"EMAIL_NOT_CONFIGURED","Transactional email delivery is not configured.");
  const now=new Date(),upTo=10;
  const pending=await db.outboxEvent.findMany({where:{availableAt:{lte:now},
   OR:[{status:{in:["pending","retry"]}},{status:"leased",leaseUntil:{lt:now}}]},
   take:upTo,orderBy:{createdAt:"asc"},
   select:{id:true,status:true,leaseUntil:true}});
  let delivered=0,retried=0,skipped=0;
  for(const item of pending){
   const acquired=await db.outboxEvent.updateMany({where:{id:item.id,status:item.status,
     ...(item.status==="leased"?{leaseUntil:{lt:now}}:{availableAt:{lte:now}})},
     data:{status:"leased",leaseUntil:new Date(Date.now()+60_000),attempts:{increment:1}}});
   if(!acquired.count){skipped++;continue;}
   const row=await db.outboxEvent.findUnique({where:{id:item.id},include:{
    user:{select:{email:true,status:true,verifiedAt:true}},notification:{select:{title:true,userId:true,organizationId:true,purpose:true}}}});
   if(!row){skipped++;continue;}
   // Legacy NULL organization messages have no provable owner. They must
   // never be delivered or shown, and no recipient's other mosque membership
   // may be used to justify a cross-tenant email.
   const orgId=row.notification.organizationId;
   const membership=orgId?await db.organizationMembership.findUnique({where:{
    organizationId_userId:{organizationId:orgId,userId:row.userId}
   },select:{status:true}}):null;
   if(!orgId||row.notification.userId!==row.userId||
    row.user.status!=="active"||!row.user.verifiedAt||
    membership?.status!=="active"){
    await db.outboxEvent.update({where:{id:row.id},data:{
     status:"exhausted",leaseUntil:null,lastErrorCode:"tenant_recipient_unavailable"
    }});
    skipped++;continue;
   }
   const purpose=row.notification.purpose;
   const preference=purpose!=="service"?await db.organizationDeliveryPreference.findUnique({where:{
    organizationId_userId_purpose_channel:{
     organizationId:orgId,userId:row.userId,purpose,channel:"email"
    }
   },select:{enabled:true,consentedAt:true,quietStartHour:true,quietEndHour:true}}):null;
   const organization=await db.organization.findUnique({where:{id:orgId},select:{timeZone:true}});
   if(!organization){
    await db.outboxEvent.update({where:{id:row.id},data:{
     status:"exhausted",leaseUntil:null,lastErrorCode:"tenant_recipient_unavailable"
    }});
    skipped++;continue;
   }
   const decision=evaluateEmailDelivery(purpose,preference,organization.timeZone,new Date());
   if(decision.kind==="suppress"){
    await db.outboxEvent.update({where:{id:row.id},data:{
     status:"exhausted",leaseUntil:null,lastErrorCode:"consent_missing"
    }});
    skipped++;continue;
   }
   if(decision.kind==="defer"){
    await db.outboxEvent.update({where:{id:row.id},data:{
     status:"retry",availableAt:decision.nextAt,leaseUntil:null,
     attempts:{decrement:1},lastErrorCode:"quiet_hours"
    }});
    skipped++;continue;
   }
   try{
    if(syntheticDelivery()){
     await db.outboxEvent.update({where:{id:row.id},data:{
      status:"delivered",sentAt:new Date(),leaseUntil:null,lastErrorCode:null,
      providerMessageId:"synthetic-ci-no-network"
     }});
     delivered++;continue;
    }
    // Deliberately generic: school names, billing amounts and private attendance never appear in external email body.
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
      Authorization:"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":row.id},
      body:JSON.stringify({from,to:[row.user.email],subject:"You have a new Masjid Community update",
       text:"A community notification is available in your account. Sign in directly to "+origin+" to read it. This message contains no private school or payment details."})});
    if(!response.ok)throw new Error("provider_"+response.status);
    const reply=await response.json().catch(()=>({}));
    await db.outboxEvent.update({where:{id:row.id},data:{status:"delivered",sentAt:new Date(),leaseUntil:null,
      lastErrorCode:null,providerMessageId:typeof reply.id==="string"?reply.id:null}});
    delivered++;
   }catch(error){
    const attempts=row.attempts;
    const exhausted=attempts>=6;
    const retryAfter=new Date(Date.now()+Math.min(24*60*60_000,Math.pow(2,attempts)*60_000));
    const code=error instanceof Error&&/^provider_\d{3}$/.test(error.message)?error.message:"provider_unavailable";
    await db.outboxEvent.update({where:{id:row.id},data:{status:exhausted?"exhausted":"retry",leaseUntil:null,
      availableAt:retryAfter,lastErrorCode:code}});
    retried++;
   }
  }
  return ok({processed:pending.length,delivered,retried,skipped,remaining:"Additional deliveries are processed by subsequent authorized worker runs."});
 });
}

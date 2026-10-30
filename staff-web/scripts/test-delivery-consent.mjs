// Consent/quiet-hours end-to-end outbox checks. The CI worker is permitted
// ONLY with GitHub Actions + /masjid_ci + localhost; no external email network.
import assert from "node:assert/strict";
import {randomBytes,createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 process.env.GITHUB_ACTIONS!=="true"||
 process.env.SILA_DELIVERY_CI_CAPTURE!=="test-only"||
 !process.env.DATABASE_URL?.endsWith("/masjid_ci")||
 process.env.NEXT_PUBLIC_APP_URL!=="http://localhost:3000")
 throw Error("Refusing notification delivery tests outside explicitly isolated CI.");
const {memberEmail,password,adminEmail}=JSON.parse(
 readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
const worker="http://127.0.0.1:3000/api/internal/notifications";
const workerSecret=process.env.CRON_SECRET;
assert.ok(workerSecret&&workerSecret.length>=32);
async function req(path,method="GET",body,token){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
async function deliver(){
 const r=await fetch(worker,{headers:{authorization:"Bearer "+workerSecret}});
 const body=await r.json().catch(()=>({}));
 assert.equal(r.status,200,JSON.stringify(body));
 return body;
}
const noticeIds=[],prefIds=[];
let foreignOrgId=null,foreignMembershipId=null,sessionId=null;
let org=null,member=null;
const stale=new Date("2020-01-01T00:00:00Z");
async function queue(organizationId,purpose,body){
 const note=await db.notification.create({data:{
  organizationId,userId:member.id,purpose,title:"Synthetic CI consent evidence",body,
  createdAt:stale
 }});
 noticeIds.push(note.id);
 const event=await db.outboxEvent.create({data:{
  notificationId:note.id,userId:member.id,createdAt:stale,availableAt:stale
 }});
 return {note,event};
}
async function result(item){return db.outboxEvent.findUniqueOrThrow({where:{id:item.event.id}});}
async function flush(item){
 for(let n=0;n<8;n++){
  const state=await result(item);
  if(["delivered","exhausted"].includes(state.status))return state;
  // "retry" may mean quiet-hour deferral; once made due again it is
  // eligible for a subsequent worker pass, not a terminal result.
  await deliver();
 }
 throw Error("Synthetic worker did not process targeted outbox item.");
}
async function save(purpose,enabled,quietStartHour=null,quietEndHour=null){
 return req("me/preferences","PATCH",{
  purpose,enabled,quietStartHour,quietEndHour
 },memberToken);
}
let memberToken="";
try{
 org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const login=await req("auth/login","POST",{email:memberEmail,password});
 assert.equal(login.status,200);
 memberToken=login.data.token;
 const guest=await req("me/preferences");
 assert.equal(guest.status,401,"consent cannot be read anonymously");
 const initial=await req("me/preferences","GET",undefined,memberToken);
 assert.equal(initial.status,200);
 assert.equal(initial.data.organization.id,org.id);
 assert.equal(initial.data.organization.timeZone,org.timeZone);
 assert.ok(initial.data.serviceEmail.required,"service notices are distinct from marketing");
 assert.ok(initial.data.optional.every(p=>p.enabled===false),
  "old global settings cannot silently opt in to a particular mosque");
 assert.equal((await req("me/preferences","PATCH",{
  purpose:"community_news",enabled:true,quietStartHour:null,quietEndHour:null
 })).status,401,"anonymous edits denied");
 assert.equal((await req("me/preferences","PATCH",{
  purpose:"service",enabled:false,quietStartHour:null,quietEndHour:null
 },memberToken)).status,422,"mandatory service purpose cannot be opted out through marketing control");
 assert.equal((await req("me/preferences","PATCH",{
  purpose:"event_updates",enabled:true,quietStartHour:22,quietEndHour:null
 },memberToken)).status,422,"half-specified quiet-hour windows are rejected");
 assert.equal((await req("me/preferences","PATCH",{
  purpose:"event_updates",enabled:true,quietStartHour:15,quietEndHour:15
 },memberToken)).status,422,"zero-length quiet window rejected");
 assert.equal((await req("me/preferences","PATCH",{
  purpose:"event_updates",enabled:true,quietStartHour:26,quietEndHour:4
 },memberToken)).status,422,"invalid clock hours rejected");
 const deprecated=await req("account","PATCH",{newsletterOptIn:true},memberToken);
 assert.equal(deprecated.status,409,"legacy global newsletter toggles cannot bypass scoped opt-in");
 assert.equal(deprecated.error.code,"ORG_PREFERENCES_REQUIRED");

 foreignOrgId=(await db.organization.create({data:{
  slug:"delivery-private-"+randomUUID(),name:"Another separate mosque",timeZone:"America/Chicago"
 }})).id;
 foreignMembershipId=(await db.organizationMembership.create({data:{
  userId:member.id,organizationId:foreignOrgId
 }})).id;
 const foreignPref=await db.organizationDeliveryPreference.create({data:{
  organizationId:foreignOrgId,userId:member.id,purpose:"community_news",
  channel:"email",enabled:true,consentedAt:new Date()
 }});
 prefIds.push(foreignPref.id);
 const onlyHome=await req("me/preferences","GET",undefined,memberToken);
 assert.ok(onlyHome.data.optional.every(p=>p.enabled===false),
  "second mosque's opt-in must not appear as consent for first mosque");
 assert.ok(!JSON.stringify(onlyHome.data).includes(foreignOrgId),
  "no other tenant identifiers in preferences API");
 const optionalNoConsent=await queue(org.id,"community_news",
  "Unconsented optional mail must never be sent.");
 const operational=await queue(org.id,"service",
  "Requested service result remains visible despite optional opt-out.");
 const foreignOptedIn=await queue(foreignOrgId,"community_news",
  "Only foreign organization has direct consent for this message.");
 assert.equal((await fetch(worker)).status,401,"synthetic worker still requires a secret");
 assert.equal((await fetch(worker,{headers:{authorization:"Bearer invalid-worker-key"}})).status,401);
 assert.equal((await flush(optionalNoConsent)).status,"exhausted");
 assert.equal((await result(optionalNoConsent)).lastErrorCode,"consent_missing");
 assert.equal((await flush(operational)).status,"delivered",
  "service update does not depend on optional marketing consent");
 assert.equal((await result(operational)).providerMessageId,"synthetic-ci-no-network");
 assert.equal((await flush(foreignOptedIn)).status,"delivered",
  "worker uses the notification's authenticated organization, not first mosque");
 assert.ok((await req("me/preferences","GET",undefined,memberToken)).data.optional.every(p=>!p.enabled));

 const consent=await save("community_news",true);
 assert.equal(consent.status,200);
 assert.equal(consent.data.preference.enabled,true);
 const own=await db.organizationDeliveryPreference.findUniqueOrThrow({where:{
  organizationId_userId_purpose_channel:{
   organizationId:org.id,userId:member.id,purpose:"community_news",channel:"email"
  }
 }});
 prefIds.push(own.id);
 assert.ok(own.consentedAt instanceof Date);
 assert.equal(own.quietStartHour,null);
 const deliverOptedIn=await queue(org.id,"community_news","Opted-in community update.");
 assert.equal((await flush(deliverOptedIn)).status,"delivered");

 const disabledEvent=await queue(org.id,"event_updates","No event opt-in exists.");
 assert.equal((await flush(disabledEvent)).status,"exhausted",
  "one opted-in category does not grant consent to another category");
 assert.equal((await result(disabledEvent)).lastErrorCode,"consent_missing");
 const queuedBeforeRevoke=await queue(org.id,"community_news",
  "Consent revoked after queueing must be rechecked before dispatch.");
 const revoked=await save("community_news",false);
 assert.equal(revoked.status,200);
 const rowAfterRevoke=await db.organizationDeliveryPreference.findUniqueOrThrow({where:{id:own.id}});
 assert.equal(rowAfterRevoke.enabled,false);
 assert.equal(rowAfterRevoke.consentedAt,null,"opt-out clears current consent");
 assert.equal((await flush(queuedBeforeRevoke)).status,"exhausted",
  "recipient withdrawal cannot be defeated by queued message");

 const nowHour=Number(new Intl.DateTimeFormat("en-GB",{
  hour:"2-digit",hourCycle:"h23",timeZone:org.timeZone
 }).format(new Date()));
 const quietSave=await save("community_news",true,nowHour,(nowHour+2)%24);
 assert.equal(quietSave.status,200);
 const quietQueued=await queue(org.id,"community_news",
  "Deliver only outside mosque-local quiet hours.");
 await deliver();
 const sleeping=await result(quietQueued);
 assert.equal(sleeping.status,"retry");
 assert.equal(sleeping.lastErrorCode,"quiet_hours");
 assert.ok(sleeping.availableAt>new Date());
 assert.equal(sleeping.attempts,0,"quiet-hour deferral must not exhaust provider retry budget");
 const daylight=await save("community_news",true,null,null);
 assert.equal(daylight.status,200);
 await db.outboxEvent.update({where:{id:quietQueued.event.id},data:{availableAt:stale}});
 assert.equal((await flush(quietQueued)).status,"delivered",
  "removing quiet hours permits a pending optional message again");

 // No marketing is delivered for a recipient whose organization membership
 // has become inactive since the message was enqueued.
 const inactive=await queue(org.id,"community_news",
  "Suspended recipient is always withheld.");
 const home=await db.organizationMembership.findUniqueOrThrow({where:{
  organizationId_userId:{organizationId:org.id,userId:member.id}
 }});
 await db.organizationMembership.update({where:{id:home.id},data:{status:"suspended"}});
 assert.equal((await flush(inactive)).status,"exhausted");
 assert.equal((await result(inactive)).lastErrorCode,"tenant_recipient_unavailable");
 await db.organizationMembership.update({where:{id:home.id},data:{status:"active"}});

 const activity=await db.auditEvent.findMany({where:{
  actorId:member.id,action:"delivery.preference.change",
  entity:"OrganizationDeliveryPreference",entityId:org.id
 }});
 assert.ok(activity.some(x=>x.detail.includes('"to":false')));
 assert.ok(activity.some(x=>x.detail.includes('"to":true')));
 assert.ok(activity.every(x=>!x.detail.includes(memberEmail)),
  "consent audit does not disclose email or message contents");
 const memberInbox=await req("me","GET",undefined,memberToken);
 assert.equal(memberInbox.status,200);
 assert.ok(!JSON.stringify(memberInbox.data).includes("Only foreign organization"),
  "delivered foreign opt-in message remains absent from home mosque inbox");
 console.log("Verified tenant opt-in, cross-purpose denial, revocation at dispatch, quiet-hour deferral, operational notices and synthetic delivery without provider network.");
}finally{
 if(org&&member)await db.organizationMembership.updateMany({where:{
  organizationId:org.id,userId:member.id
 },data:{status:"active"}});
 if(noticeIds.length){
  await db.outboxEvent.deleteMany({where:{notificationId:{in:noticeIds}}});
  await db.notification.deleteMany({where:{id:{in:noticeIds}}});
 }
 if(prefIds.length)await db.organizationDeliveryPreference.deleteMany({where:{id:{in:prefIds}}});
 if(org&&member)await db.auditEvent.deleteMany({where:{
  actorId:member.id,action:"delivery.preference.change",
  entity:"OrganizationDeliveryPreference",entityId:org.id
 }});
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

// F-049. Strictly disposable synthetic PostgreSQL: opt-in + suppressed aggregate only.
import assert from "node:assert/strict";
import {randomUUID,randomBytes,createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 process.env.GITHUB_ACTIONS!=="true"||
 process.env.DATABASE_URL!=="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci")
 throw Error("Analytics test requires disposable CI masjid_ci and forbids real accounts.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),base="http://127.0.0.1:3000/api/v1/";
async function call(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
let eventId=null,foreignOrgId=null,foreignEventId=null,adminSessionId=null;
const createdUsers=[];
try{
 const org=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const login=await call("auth/login","POST",{email:memberEmail,password});
 assert.equal(login.status,200);const memberToken=login.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 adminSessionId=(await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }})).id;
 const consentRoute="me/analytics-consent",metricsRoute="admin/analytics";
 assert.equal((await call(consentRoute)).status,401);
 assert.equal((await call(metricsRoute)).status,401);
 assert.equal((await call(metricsRoute,"GET",undefined,memberToken)).status,403);
 const initial=await call(consentRoute,"GET",undefined,memberToken);
 assert.equal(initial.status,200);assert.equal(initial.data.enabled,false);
 assert.equal(initial.data.consentedAt,null);
 assert.equal((await call(consentRoute,"PATCH",{enabled:true},memberToken)).status,422);
 assert.equal((await call(consentRoute,"PATCH",{enabled:true,confirm:true,organizationId:"injected"},memberToken)).status,422);
 assert.equal((await call(metricsRoute+"?eventId=any","GET",undefined,adminToken)).status,422);
 const event=await db.event.create({data:{organizationId:org.id,
  title:"CI privacy event "+randomUUID(),description:"Aggregate-only event with synthetic adults.",
  location:"Synthetic community hall",status:"published",capacity:100,
  startAt:new Date(Date.now()-2*86400000),endAt:new Date(Date.now()-86400000)
 }});
 eventId=event.id;
 // Nine consented synthetic verified active members and one existing
 // member who has NOT opted in. Under ten means no report at all.
 for(let i=0;i<9;i++){
  const u=await db.user.create({data:{
   email:"analytics-ci-"+randomUUID()+"@example.test",firstName:"Synthetic",
   lastName:"Participant",status:"active",verifiedAt:new Date(),
   passwordHash:member.passwordHash,memberships:{create:{organizationId:org.id}}
  }});
  createdUsers.push(u.id);
  await db.organizationAnalyticsConsent.create({data:{
   organizationId:org.id,userId:u.id,enabled:true,consentedAt:new Date()
  }});
  await db.eventRSVP.create({data:{
   eventId:eventId,userId:u.id,status:"confirmed",
   checkedInAt:i<9?new Date(Date.now()-86400000):null
  }});
 }
 await db.eventRSVP.create({data:{
  eventId:eventId,userId:member.id,status:"confirmed",checkedInAt:null
 }});
 const hidden=await call(metricsRoute,"GET",undefined,adminToken);
 assert.equal(hidden.status,200);
 assert.ok(!hidden.data.events.some(e=>e.eventId===eventId),
  "nine opted-in participants are suppressed");
 const on=await call(consentRoute,"PATCH",{enabled:true,confirm:true},memberToken);
 assert.equal(on.status,200,JSON.stringify(on));
 assert.equal(on.data.enabled,true);
 assert.equal(on.data.changed,true);
 const active=await call(consentRoute,"GET",undefined,memberToken);
 assert.equal(active.data.enabled,true);
 assert.ok(active.data.consentedAt);
 const savedAt=active.data.consentedAt;
 const repeated=await call(consentRoute,"PATCH",{enabled:true,confirm:true},memberToken);
 assert.equal(repeated.status,200);assert.equal(repeated.data.changed,false);
 assert.equal(repeated.data.consentedAt,savedAt);
 const visible=await call(metricsRoute,"GET",undefined,adminToken);
 assert.equal(visible.status,200,JSON.stringify(visible));
 const row=visible.data.events.find(e=>e.eventId===eventId);
 assert.ok(row,"ten consented confirmed participants form first broad band");
 assert.equal(row.confirmedBand,"10–19");
 assert.equal(row.arrivedBand,null,"nine check-ins remain suppressed separately");
 assert.equal(visible.data.minimumGroup,10);
 const serialized=JSON.stringify(visible.data);
 assert.ok(!serialized.includes(member.email));
 assert.ok(!serialized.includes(member.id));
 assert.ok(!serialized.includes(createdUsers[0]));
 assert.ok(!serialized.includes("checkedInAt")&&!serialized.includes("userId"));
 // A second mosque's event must not be included or queried by a home admin.
 const foreign=await db.organization.create({data:{
  slug:"ci-analytics-foreign-"+randomUUID(),name:"Foreign private analytics"
 }});
 foreignOrgId=foreign.id;
 const other=await db.event.create({data:{
  organizationId:foreign.id,title:"FOREIGN_CONFIDENTIAL_ANALYTICS_EVENT",
  description:"Not for the primary mosque",location:"Other hall",
  startAt:new Date(Date.now()-2*86400000),endAt:new Date(Date.now()-86400000),
  status:"published"
 }});
 foreignEventId=other.id;
 const foreignResult=await call(metricsRoute,"GET",undefined,adminToken);
 assert.ok(!JSON.stringify(foreignResult.data).includes(other.title));
 const off=await call(consentRoute,"PATCH",{enabled:false,confirm:true},memberToken);
 assert.equal(off.status,200);assert.equal(off.data.enabled,false);
 assert.equal(off.data.consentedAt,null);
 assert.equal((await call(consentRoute,"GET",undefined,memberToken)).data.enabled,false);
 const after=await call(metricsRoute,"GET",undefined,adminToken);
 assert.ok(!after.data.events.some(e=>e.eventId===eventId),
  "consent withdrawal immediately removes the tenth eligible participant");
 assert.equal(await db.auditEvent.count({where:{
  actorId:member.id,entity:"OrganizationAnalyticsConsent",entityId:org.id,
  action:"analytics.consent.change"
 }}),2,"only true consent transitions are audited");
 console.log("Verified default-off independent consent, nine-person suppression, bands, tenant scoping, revocation and no individual analytics.");
}finally{
 if(eventId)await db.eventRSVP.deleteMany({where:{eventId}});
 if(eventId)await db.event.deleteMany({where:{id:eventId}});
 if(foreignEventId)await db.event.deleteMany({where:{id:foreignEventId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.organizationAnalyticsConsent.deleteMany({where:{userId:{in:createdUsers}}});
 if(createdUsers.length)await db.organizationMembership.deleteMany({where:{userId:{in:createdUsers}}});
 if(createdUsers.length)await db.user.deleteMany({where:{id:{in:createdUsers}}});
 const org=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}});
 const member=await db.user.findUnique({where:{email:memberEmail},select:{id:true}});
 if(member&&org){
  await db.auditEvent.deleteMany({where:{actorId:member.id,
   action:"analytics.consent.change",entityId:org.id}});
  await db.organizationAnalyticsConsent.deleteMany({where:{
   organizationId:org.id,userId:member.id
  }});
 }
 if(adminSessionId)await db.authSession.deleteMany({where:{id:adminSessionId}});
 await db.$disconnect();
}

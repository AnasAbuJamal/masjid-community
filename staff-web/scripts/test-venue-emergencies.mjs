// F-006 exact venue emergency lifecycle on disposable PostgreSQL only.
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.GITHUB_ACTIONS!=="true"||process.env.VERCEL||
 process.env.NODE_ENV==="production"||
 !process.env.DATABASE_URL?.endsWith("/masjid_ci"))
 throw Error("Venue emergency tests require isolated disposable CI PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(
 readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),api="http://127.0.0.1:3000/api/v1/";
let foreignOrgId=null,foreignVenueId=null,homeVenueId=null;
let ownVenueCreated=false,foreignMembershipId=null,homeNoticeId=null,foreignNoticeId=null;
const sessionIds=[],auditIds=[];
async function send(path,method="GET",input,token){
 const response=await fetch(api+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(input?{"Content-Type":"application/json"}:{})
 },body:input?JSON.stringify(input):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
async function makeSession(userId,selectedOrganizationId=null){
 const token=randomBytes(32).toString("base64url");
 const row=await db.authSession.create({data:{
  userId,tokenHash:createHash("sha256").update(token).digest("hex"),
  selectedOrganizationId,expiresAt:new Date(Date.now()+60*60_000),
  mfaVerifiedAt:new Date()
 }});
 sessionIds.push(row.id);
 return token;
}
try{
 const org=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const adminToken=await makeSession(admin.id);
 const adminNoMfa=randomBytes(32).toString("base64url");
 const noMfaSession=await db.authSession.create({data:{
  userId:admin.id,
  tokenHash:createHash("sha256").update(adminNoMfa).digest("hex"),
  expiresAt:new Date(Date.now()+60*60_000)
 }});
 sessionIds.push(noMfaSession.id);
 const ordinary=await send("auth/login","POST",{email:memberEmail,password});
 assert.equal(ordinary.status,200);
 const memberToken=ordinary.data.token;
 let venue=await db.venue.findFirst({where:{organizationId:org.id},orderBy:{id:"asc"}});
 if(!venue){
  venue=await db.venue.create({data:{
   organizationId:org.id,name:"CI ORIGINAL VENUE",timeZone:"America/New_York"
  }});ownVenueCreated=true;
 }
 homeVenueId=venue.id;
 const second=await db.venue.create({data:{
  organizationId:org.id,name:"CI SECOND VENUE EMERGENCY",timeZone:"America/Chicago"
 }});
 const initial=await send("admin/venue-emergencies","GET");
 assert.equal(initial.status,401);
 assert.equal((await send("admin/venue-emergencies","GET",undefined,memberToken)).status,403);
 assert.equal((await send("admin/venue-emergencies","GET",undefined,adminNoMfa)).status,403);
 assert.equal((await send("admin/venue-emergencies","GET",undefined,adminToken)).status,200);
 const request={
  action:"publish",venueId:venue.id,expectedRevision:0,kind:"closure",
  title:"CI VENUE TEMPORARY CLOSURE",
  body:"Synthetic emergency closure: do not visit the listed entrance.",
  instructions:"Use the designated alternate building entrance, verified by the on-site host.",
  expiresAt:new Date(Date.now()+90*60_000).toISOString()
 };
 assert.equal((await send("admin/venue-emergencies","POST",request)).status,401);
 assert.equal((await send("admin/venue-emergencies","POST",request,memberToken)).status,403);
 assert.equal((await send("admin/venue-emergencies","POST",request,adminNoMfa)).status,403);
 const invalidExpiry=await send("admin/venue-emergencies","POST",{
  ...request,expiresAt:new Date(Date.now()+2*60_000).toISOString()
 },adminToken);
 assert.equal(invalidExpiry.status,422);
 assert.equal(invalidExpiry.error.code,"INVALID_EXPIRY");
 foreignOrgId=(await db.organization.create({data:{
  slug:"ci-alert-other-"+Date.now(),name:"CI other mosque"
 }})).id;
 foreignVenueId=(await db.venue.create({data:{
  organizationId:foreignOrgId,name:"CI FOREIGN EMERGENCY VENUE",timeZone:"America/Chicago"
 }})).id;
 const forged=await send("admin/venue-emergencies","POST",{
  ...request,venueId:foreignVenueId
 },adminToken);
 assert.equal(forged.status,404,"publisher may not use another mosque's venue");
 assert.equal(forged.error.code,"VENUE_NOT_FOUND");
 const saved=await send("admin/venue-emergencies","POST",request,adminToken);
 assert.equal(saved.status,200,JSON.stringify(saved));
 assert.equal(saved.data.revision,1);
 assert.equal(saved.data.status,"published");
 homeNoticeId=saved.data.id;
 const adminView=await send("admin/venue-emergencies","GET",undefined,adminToken);
 assert.equal(adminView.status,200);
 assert.equal(adminView.data.venues.find(v=>v.id===venue.id)?.emergencyNotice?.id,homeNoticeId);
 const home=await send("public/home?venueId="+venue.id);
 assert.equal(home.status,200);
 assert.equal(home.data.emergency.id,homeNoticeId);
 assert.equal(home.data.emergency.kind,"closure");
 assert.equal(home.data.emergency.revision,1);
 assert.equal(home.data.emergency.publishedById,undefined);
 assert.equal((await send("public/prayers?venueId="+venue.id)).data.emergency.id,homeNoticeId);
 assert.equal((await send("public/home?venueId="+second.id)).data.emergency,null);
 const publishedSite=await fetch("http://127.0.0.1:3000/visit?venue="+venue.id);
 assert.equal(publishedSite.status,200);
 assert.match(await publishedSite.text(),/CI VENUE TEMPORARY CLOSURE/);
 const selectedDisplay=await fetch("http://127.0.0.1:3000/kiosk?venueId="+venue.id);
 assert.equal(selectedDisplay.status,200);
 const selectedHtml=await selectedDisplay.text();
 assert.match(selectedHtml,/CI VENUE TEMPORARY CLOSURE/,
  "published emergency reaches precisely the selected public kiosk venue");
 assert.match(selectedHtml,/Current information not verified/,
  "kiosk server rendering obscures content pending a fresh guest-API check");
 const secondDisplay=await fetch("http://127.0.0.1:3000/kiosk?venueId="+second.id);
 assert.equal(secondDisplay.status,200);
 const otherVenueHtml=await secondDisplay.text();
 assert.match(otherVenueHtml,/CI SECOND VENUE EMERGENCY/);
 assert.doesNotMatch(otherVenueHtml,/CI VENUE TEMPORARY CLOSURE/,
  "second venue must not inherit the first venue's safety instructions");
 assert.equal((await fetch("http://127.0.0.1:3000/kiosk?venueId="+foreignVenueId)).status,404,
  "foreign organization venue must not be selectable on the public kiosk");
 assert.equal((await fetch("http://127.0.0.1:3000/kiosk?venueId="+venue.id+"&venueId="+second.id)).status,404,
  "ambiguous duplicated venue selectors fail closed");
 assert.equal((await fetch("http://127.0.0.1:3000/kiosk?venueId=")).status,404,
  "empty venue selector must never silently fall back");
 const display=await fetch("http://127.0.0.1:3000/kiosk");
 assert.equal(display.status,200);
 const defaultKioskVenue=await db.venue.findFirst({where:{organizationId:org.id}});
 if(defaultKioskVenue?.id===venue.id)
  assert.match(await display.text(),/CI VENUE TEMPORARY CLOSURE/,
   "default display shows its actual venue's active emergency");
 assert.equal((await send("admin/venue-emergencies","POST",request,adminToken)).status,409,
  "duplicate old-revision publication must not silently overwrite");
 const changed=await send("admin/venue-emergencies","POST",{
  ...request,expectedRevision:1,title:"CI CORRECTED VENUE CLOSURE"
 },adminToken);
 assert.equal(changed.status,200);
 assert.equal(changed.data.revision,2);
 assert.equal((await send("public/home?venueId="+venue.id)).data.emergency.title,
  "CI CORRECTED VENUE CLOSURE");
 assert.equal((await send("admin/venue-emergencies","POST",{
  action:"clear",venueId:venue.id,expectedRevision:1
 },adminToken)).status,409);
 await db.venueEmergencyNotice.update({where:{id:homeNoticeId},data:{
  publishedAt:new Date(Date.now()-2*60*60_000),
  expiresAt:new Date(Date.now()-60*60_000)
 }});
 assert.equal((await send("public/home?venueId="+venue.id)).data.emergency,null,
  "expired notice must never appear as live safety instructions");
 assert.equal((await send("public/prayers?venueId="+venue.id)).data.emergency,null);
 const republished=await send("admin/venue-emergencies","POST",{
  ...request,expectedRevision:2
 },adminToken);
 assert.equal(republished.status,200);
 assert.equal(republished.data.revision,3);
 assert.equal((await send("public/home?venueId="+venue.id)).data.emergency.id,homeNoticeId);
 const cleared=await send("admin/venue-emergencies","POST",{
  action:"clear",venueId:venue.id,expectedRevision:3
 },adminToken);
 assert.equal(cleared.status,200);
 assert.equal(cleared.data.status,"archived");
 assert.equal(cleared.data.revision,4);
 assert.equal((await send("public/home?venueId="+venue.id)).data.emergency,null);
 assert.equal((await send("admin/venue-emergencies","POST",{
  action:"clear",venueId:venue.id,expectedRevision:4
 },adminToken)).status,409);
 const audits=await db.auditEvent.findMany({where:{
  entity:"VenueEmergencyNotice",entityId:homeNoticeId
 }});
 auditIds.push(...audits.map(a=>a.id));
 assert.equal(audits.length,4,"publication/revision/republication/clear are individually audited");
 // Separate active member session can only view its selected mosque's
 // live emergency. The public pilot never switches tenants via headers.
 foreignNoticeId=(await db.venueEmergencyNotice.create({data:{
  venueId:foreignVenueId,kind:"safety",
  title:"CI FOREIGN SAFETY NOTICE",
  body:"Synthetic emergency for the foreign member's own mosque only.",
  instructions:"Contact this venue's synthetic staff desk for verified instructions.",
  status:"published",publishedAt:new Date(),
  expiresAt:new Date(Date.now()+60*60_000),publishedById:admin.id
 }})).id;
 foreignMembershipId=(await db.organizationMembership.create({data:{
  organizationId:foreignOrgId,userId:member.id
 }})).id;
 const foreignToken=await makeSession(member.id,foreignOrgId);
 const foreignHome=await send("organizations/view?resource=home&venueId="+foreignVenueId,
  "GET",undefined,foreignToken);
 assert.equal(foreignHome.status,200,JSON.stringify(foreignHome));
 assert.equal(foreignHome.data.emergency.id,foreignNoticeId);
 assert.equal((await send("organizations/view?resource=prayers&venueId="+foreignVenueId,
  "GET",undefined,foreignToken)).data.emergency.id,foreignNoticeId);
 assert.equal((await send("organizations/view?resource=home&venueId="+venue.id,
  "GET",undefined,foreignToken)).status,404);
 assert.equal((await send("public/home?venueId="+foreignVenueId)).status,404);
 const foreignEditor=await send("admin/venue-emergencies","GET",undefined,foreignToken);
 assert.equal(foreignEditor.status,409,
  "the pilot-only staff editor rejects selected foreign member context");
 assert.equal(foreignEditor.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 await db.organizationMembership.update({where:{id:foreignMembershipId},data:{status:"suspended"}});
 assert.equal((await send("organizations/view?resource=home&venueId="+foreignVenueId,
  "GET",undefined,foreignToken)).status,403,
  "a suspended selected membership must lose emergency view access immediately");
 console.log("Verified published, corrected, expired and cleared venue emergencies with tenant and staff isolation.");
}finally{
 if(homeNoticeId)await db.auditEvent.deleteMany({where:{
  entity:"VenueEmergencyNotice",entityId:homeNoticeId
 }});
 if(homeNoticeId)await db.venueEmergencyNotice.deleteMany({where:{id:homeNoticeId}});
 if(foreignNoticeId)await db.venueEmergencyNotice.deleteMany({where:{id:foreignNoticeId}});
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(sessionIds.length)await db.authSession.deleteMany({where:{id:{in:sessionIds}}});
 await db.venue.deleteMany({where:{name:"CI SECOND VENUE EMERGENCY"}});
 if(foreignVenueId)await db.venue.deleteMany({where:{id:foreignVenueId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 if(ownVenueCreated&&homeVenueId)await db.venue.deleteMany({where:{id:homeVenueId}});
 await db.$disconnect();
}

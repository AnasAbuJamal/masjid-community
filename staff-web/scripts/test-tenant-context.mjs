// F-048 member context pilot: selected organization stored in server-side
// auth session, no global role transfer or header/body tenant spoofing.
// Operates ONLY against isolated, disposable GitHub Actions masjid_ci.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.GITHUB_ACTIONS!=="true"||process.env.NODE_ENV==="production"||
 process.env.VERCEL||!process.env.DATABASE_URL?.endsWith("/masjid_ci"))
 throw Error("Cross-mosque context tests require disposable CI PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),base="http://127.0.0.1:3000/api/v1/";
const fixture={notes:[],campaigns:[],donations:[],events:[],rsvps:[],prefs:[],invitations:[]};
const createdAt=new Date();
let foreignOrgId=null,foreignMembershipId=null,adminMembershipId=null;
const tokens=[];
async function call(path,method="GET",body,token,headers={}){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{authorization:"Bearer "+token}:{}),
  ...(body?{"content-type":"application/json"}:{}),...headers
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
async function login(email){
 const result=await call("auth/login","POST",{email,password});
 assert.equal(result.status,200,JSON.stringify(result));
 tokens.push(result.data.token);
 return result.data.token;
}
async function note(orgId,userId,body){
 const value=await db.notification.create({data:{
  organizationId:orgId,userId,title:"Synthetic private mosque message",body
 }});
 fixture.notes.push(value.id);return value;
}
try{
 const home=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const homeMember=await db.organizationMembership.findUniqueOrThrow({where:{
  organizationId_userId:{organizationId:home.id,userId:member.id}
 }});
 assert.equal(homeMember.status,"active");
 assert.equal((await call("events/catalog")).status,401,
  "authenticated gathering catalog must never become a public second-tenant listing");
 const first=await login(memberEmail);
 const second=await login(memberEmail);
 const stranger=await call("organizations/context");
 assert.equal(stranger.status,401,"anonymous users cannot list private memberships");
 const initial=await call("organizations/context","GET",undefined,first);
 assert.equal(initial.status,200);
 assert.equal(initial.data.selectedOrganizationId,home.id);
 assert.ok(initial.data.selectedActive);
 assert.ok(initial.data.organizations.some(o=>o.id===home.id&&o.memberWorkspace==="pilot"));
 const foreign=await db.organization.create({data:{
  name:"Synthetic private second mosque",slug:"session-tenant-"+randomUUID(),
  timeZone:"America/Chicago"
 }});
 foreignOrgId=foreign.id;
 const foreignMembership=await db.organizationMembership.create({data:{
  organizationId:foreign.id,userId:member.id
 }});
 foreignMembershipId=foreignMembership.id;
 const directForeign=await db.organizationMembership.create({data:{
  organizationId:foreign.id,userId:admin.id
 }});
 adminMembershipId=directForeign.id;
 const homeNote=await note(home.id,member.id,"HOME_PRIVATE_CONTEXT_ONLY");
 const foreignNote=await note(foreign.id,member.id,"FOREIGN_PRIVATE_CONTEXT_ONLY");
 const unknownNote=await note(null,member.id,"LEGACY_UNOWNED_NEVER_PRESENT");
 const campaignHome=await db.donationCampaign.create({data:{
  organizationId:home.id,title:"HOME_SYNTHETIC_FUND",purpose:"Home-only test",published:true
 }});
 fixture.campaigns.push(campaignHome.id);
 const campaignForeign=await db.donationCampaign.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_FUND",purpose:"Foreign-only test",published:true
 }});
 fixture.campaigns.push(campaignForeign.id);
 for(const c of [campaignHome,campaignForeign]){
  const d=await db.donation.create({data:{
   campaignId:c.id,donorId:member.id,amountMinor:1400,currency:"usd",status:"pending"
  }});
  fixture.donations.push(d.id);
 }
 const event=await db.event.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_PRIVATE_RSVP",description:"Private event",
  location:"Synthetic community",status:"published",startAt:new Date(Date.now()+86400000),
  endAt:new Date(Date.now()+90000000),rsvpCount:1
 }});
 fixture.events.push(event.id);
 const homeEvent=await db.event.create({data:{
  organizationId:home.id,title:"HOME_SYNTHETIC_RSVP_EVENT",description:"Home gathering",
  location:"Synthetic home hall",status:"published",startAt:new Date(Date.now()+86400000),
  endAt:new Date(Date.now()+90000000),capacity:2
 }});
 fixture.events.push(homeEvent.id);
 const foreignDraft=await db.event.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_UNPUBLISHED_EVENT",
  description:"Not for publication",location:"Private draft",
  status:"draft",startAt:new Date(Date.now()+86400000),
  endAt:new Date(Date.now()+90000000)
 }});
 fixture.events.push(foreignDraft.id);
 const homeCatalog=await call("events/catalog","GET",undefined,first);
 assert.equal(homeCatalog.status,200,JSON.stringify(homeCatalog));
 assert.equal(homeCatalog.data.organization.id,home.id);
 assert.ok(homeCatalog.data.items.some(x=>x.id===homeEvent.id));
 assert.ok(!homeCatalog.data.items.some(x=>x.id===event.id||x.id===foreignDraft.id));
 assert.equal((await call("events/catalog?eventId="+event.id,"GET",undefined,first)).status,404,
  "known foreign event ID must not reveal its publication or metadata");
 const rsvp=await db.eventRSVP.create({data:{eventId:event.id,userId:member.id}});
 fixture.rsvps.push(rsvp.id);
 const homeInbox=await call("me","GET",undefined,first);
 assert.equal(homeInbox.status,200);
 assert.equal(homeInbox.data.organization.id,home.id);
 assert.ok(homeInbox.data.notifications.some(n=>n.id===homeNote.id));
 assert.ok(homeInbox.data.donations.some(d=>d.campaign.title==="HOME_SYNTHETIC_FUND"));
 assert.ok(!JSON.stringify(homeInbox.data).includes("FOREIGN_PRIVATE_CONTEXT_ONLY"));
 assert.ok(!JSON.stringify(homeInbox.data).includes("FOREIGN_SYNTHETIC_FUND"));
 assert.ok(!JSON.stringify(homeInbox.data).includes("FOREIGN_SYNTHETIC_PRIVATE_RSVP"));
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,first)).status,404,
  "home context cannot see known foreign registration");
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:event.id},first)).status,404,
  "home context cannot reserve foreign event by known ID");
 const invalid=await call("organizations/context","POST",{
  organizationId:"missing-organization-"+randomUUID()
 },first);
 assert.equal(invalid.status,404,"an arbitrary organization ID is not authority");
 assert.equal((await call("organizations/context","POST",{organizationId:foreign.id},first,
  {origin:"https://malicious.example.test"})).status,403,"wrong browser origin must be rejected");
 const rejectedBody=await call("organizations/context","POST",{
  organizationId:foreign.id,role:"admin"
 },first);
 assert.equal(rejectedBody.status,422,"unexpected client role or scope fields are denied");
 const list=await call("organizations/context?organizationId="+foreign.id,
  "GET",undefined,first,{"x-organization-id":foreign.id});
 assert.equal(list.data.selectedOrganizationId,home.id,
  "forged header or query must not change selection");
 assert.ok(list.data.organizations.some(o=>o.id===foreign.id&&o.selectable));
 const changed=await call("organizations/context","POST",{organizationId:foreign.id},first);
 assert.equal(changed.status,200,JSON.stringify(changed));
 assert.equal(changed.data.selectedOrganizationId,foreign.id);
 assert.equal(changed.data.limited,true);
 assert.equal((await call("organizations/context","GET",undefined,first)).data.selectedOrganizationId,foreign.id);
 const dbSession=await db.authSession.findUniqueOrThrow({where:{
  tokenHash:createHash("sha256").update(first).digest("hex")
 }});
 assert.equal(dbSession.selectedOrganizationId,foreign.id);
 assert.equal((await call("organizations/context","GET",undefined,second)).data.selectedOrganizationId,home.id,
  "second device/session must NOT switch when first device changes mosque");
 const foreignCatalog=await call("events/catalog?organizationId="+home.id,"GET",undefined,first);
 assert.equal(foreignCatalog.status,422,"client-provided mosque filter is forbidden");
 const selectedCatalog=await call("events/catalog","GET",undefined,first,{"x-organization-id":home.id});
 assert.equal(selectedCatalog.status,200,JSON.stringify(selectedCatalog));
 assert.equal(selectedCatalog.data.organization.id,foreign.id,"server session chooses mosque");
 assert.ok(selectedCatalog.data.items.some(x=>x.id===event.id));
 assert.ok(!selectedCatalog.data.items.some(x=>x.id===homeEvent.id||x.id===foreignDraft.id));
 assert.ok(!JSON.stringify(selectedCatalog).includes("FOREIGN_SYNTHETIC_UNPUBLISHED_EVENT"));
 const selectedExact=await call("events/catalog?eventId="+event.id,"GET",undefined,first);
 assert.equal(selectedExact.status,200);
 assert.equal(selectedExact.data.items.length,1);
 assert.equal(selectedExact.data.items[0].id,event.id);
 assert.equal((await call("events/catalog?eventId="+foreignDraft.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?eventId="+homeEvent.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?eventId=missing-synthetic-event","GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?eventId=bad","GET",undefined,first)).status,422);
 const stillHomeCatalog=await call("events/catalog","GET",undefined,second);
 assert.equal(stillHomeCatalog.data.organization.id,home.id);
 assert.ok(!stillHomeCatalog.data.items.some(x=>x.id===event.id));
 const switched=await call("me","GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(switched.status,200,JSON.stringify(switched));
 assert.equal(switched.data.organization.id,foreign.id,
  "selected server session, not spoofed home mosque header, owns the query");
 assert.ok(switched.data.notifications.some(n=>n.id===foreignNote.id));
 assert.ok(switched.data.donations.some(d=>d.campaign.title==="FOREIGN_SYNTHETIC_FUND"));
 assert.ok(switched.data.rsvps.some(r=>r.event.title==="FOREIGN_SYNTHETIC_PRIVATE_RSVP"));
 assert.ok(!JSON.stringify(switched.data).includes("HOME_PRIVATE_CONTEXT_ONLY"));
 assert.ok(!JSON.stringify(switched.data).includes("HOME_SYNTHETIC_FUND"));
 assert.ok(!JSON.stringify(switched.data).includes("LEGACY_UNOWNED_NEVER_PRESENT"));
 const otherDevice=await call("me","GET",undefined,second);
 assert.equal(otherDevice.data.organization.id,home.id);
 // F-009 selected-mosque RSVP lifecycle: server-held session context and
 // active membership must drive every read and write, never client IDs.
 const foreignRegistration=await call("events/registration?eventId="+event.id,"GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(foreignRegistration.status,200,JSON.stringify(foreignRegistration));
 assert.equal(foreignRegistration.data.registration?.status,"confirmed");
 assert.equal((await call("events/registration?eventId="+homeEvent.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,second)).status,404);
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:homeEvent.id},first)).status,404);
 assert.equal((await call("events/rsvp","DELETE",{eventId:homeEvent.id},first)).status,404);
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:event.id},second)).status,404);
 assert.equal((await call("events/rsvp","DELETE",{eventId:event.id},second)).status,404);
 assert.equal((await call("actions","POST",{kind:"volunteer",opportunityId:"synthetic-unknown"},first)).status,409,
  "unmigrated action kinds remain pilot-only");
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:event.id},first,
  {origin:"https://malicious.example.test"})).status,403);
 assert.equal((await call("events/rsvp","DELETE",{eventId:event.id},first,
  {origin:"https://malicious.example.test"})).status,403);
 const repeat=await call("actions","POST",{kind:"rsvp",eventId:event.id},first);
 assert.equal(repeat.status,201,JSON.stringify(repeat));
 assert.equal(repeat.data.alreadyJoined,true);
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,1);
 const leaveForeign=await call("events/rsvp","DELETE",{eventId:event.id},first);
 assert.equal(leaveForeign.status,200,JSON.stringify(leaveForeign));
 assert.equal(leaveForeign.data.cancelled,true);
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,0);
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,first)).data.registration,null);
 assert.equal((await call("events/rsvp","DELETE",{eventId:event.id},first)).data.alreadyCancelled,true);
 const rejoin=await call("actions","POST",{kind:"rsvp",eventId:event.id},first);
 assert.equal(rejoin.status,201,JSON.stringify(rejoin));
 assert.equal(rejoin.data.status,"confirmed");
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,1);
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,first)).data.registration?.status,"confirmed");
 assert.ok(otherDevice.data.notifications.some(n=>n.id===homeNote.id));
 assert.ok(!JSON.stringify(otherDevice.data).includes("FOREIGN_PRIVATE_CONTEXT_ONLY"));
 assert.equal((await call("notifications/"+homeNote.id,"PATCH",undefined,first)).status,404,
  "known home notification ID cannot be marked read while foreign context selected");
 assert.equal((await call("notifications/"+unknownNote.id,"PATCH",undefined,first)).status,404);
 assert.equal((await call("notifications/"+foreignNote.id,"PATCH",undefined,second)).status,404);
 assert.equal((await call("notifications/"+foreignNote.id,"PATCH",undefined,first)).status,200);
 assert.ok((await db.notification.findUniqueOrThrow({where:{id:foreignNote.id}})).readAt);
 assert.equal((await db.notification.findUniqueOrThrow({where:{id:homeNote.id}})).readAt,null);
 // A shared account still has its own profile, but its private deletion
 // status must be scoped to the currently selected membership.
 const accountForeign=await call("account","GET",undefined,first);
 assert.equal(accountForeign.status,200);
 const scopedDeletion=await db.deletionRequest.create({data:{
  userId:member.id,organizationId:home.id
 }});
 try{
  const privateAccount=await call("account","GET",undefined,first);
  assert.equal(privateAccount.status,200);
  assert.equal(privateAccount.data.deletion,null,
   "home privacy request must not be shown inside foreign mosque context");
  const ownAccount=await call("account","GET",undefined,second);
  assert.equal(ownAccount.status,200);
  assert.equal(ownAccount.data.deletion?.id,scopedDeletion.id);
 }finally{await db.deletionRequest.delete({where:{id:scopedDeletion.id}});}
 // Staff onboarding also uses requireActor (to allow invitation preview
 // before email verification), so it must explicitly reject foreign
 // selected sessions rather than silently use home organization authority.
 const invitationToken=randomBytes(32).toString("hex");
 const invitation=await db.staffInvitation.create({data:{
  organizationId:home.id,invitedEmail:member.email,
  tokenHash:createHash("sha256").update(invitationToken).digest("hex"),
  capabilities:["community_moderate"],issuedById:admin.id,
  expiresAt:new Date(Date.now()+3600000)
 }});
 fixture.invitations.push(invitation.id);
 const blockedInvitation=await call("invitations","POST",{
  action:"preview",token:invitationToken
 },first);
 assert.equal(blockedInvitation.status,409,
  "a member in foreign selected context cannot preview or accept home-mosque staff authority");
 assert.equal(blockedInvitation.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 const homeInvitation=await call("invitations","POST",{
  action:"preview",token:invitationToken
 },second);
 assert.equal(homeInvitation.status,200,
  "original pilot session retains its independently authorized onboarding context");
 const unrelatedRoutes=["students","invoices","shifts","circles/mine"];
 for(const path of unrelatedRoutes){
  const result=await call(path,"GET",undefined,first);
  assert.equal(result.status,409,
   "unmigrated "+path+" must reject foreign tenant context instead of using home records");
  assert.equal(result.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 }
 const blockedPrivacy=await call("account/deletion-request","POST",{confirm:true},first);
 assert.equal(blockedPrivacy.status,409,
  "unmigrated privacy request submission cannot silently target home mosque");
 assert.equal(blockedPrivacy.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 const prefHome=await call("me/preferences","GET",undefined,second);
 assert.equal(prefHome.status,200);
 assert.equal(prefHome.data.organization.id,home.id);
 const foreignPrefs=await call("me/preferences","GET",undefined,first);
 assert.equal(foreignPrefs.status,200);
 assert.equal(foreignPrefs.data.organization.id,foreign.id);
 assert.equal(foreignPrefs.data.organization.timeZone,"America/Chicago");
 assert.ok(foreignPrefs.data.optional.every(v=>!v.enabled));
 const updated=await call("me/preferences","PATCH",{
  purpose:"event_updates",enabled:true,quietStartHour:21,quietEndHour:6
 },first);
 assert.equal(updated.status,200,JSON.stringify(updated));
 assert.equal(updated.data.organizationId,foreign.id);
 const saved=await db.organizationDeliveryPreference.findUniqueOrThrow({where:{
  organizationId_userId_purpose_channel:{
   organizationId:foreign.id,userId:member.id,purpose:"event_updates",channel:"email"
  }
 }});
 fixture.prefs.push(saved.id);
 assert.equal(saved.quietStartHour,21);
 assert.equal(saved.quietEndHour,6);
 assert.ok(saved.consentedAt);
 const homeAfter=await call("me/preferences","GET",undefined,second);
 assert.equal(homeAfter.status,200);
 assert.deepEqual(homeAfter.data.optional,prefHome.data.optional,
  "second mosque opt-in cannot alter default mosque consent");
 assert.equal((await call("me/preferences","GET",undefined,first)).data.optional
  .find(x=>x.purpose==="event_updates").enabled,true);
 const adminToken=randomBytes(32).toString("base64url");
 tokens.push(adminToken);
 await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  mfaVerifiedAt:new Date(),expiresAt:new Date(Date.now()+3600000)
 }});
 const adminForeign=await call("organizations/context","POST",{organizationId:foreign.id},adminToken);
 assert.equal(adminForeign.status,403,"global administrator role cannot move to another mosque");
 assert.equal(adminForeign.error.code,"TENANT_ROLE_ISOLATION");
 assert.equal((await call("organizations/context","GET",undefined,adminToken)).data.selectedOrganizationId,home.id);
 assert.equal((await call("admin","GET",undefined,adminToken)).status,200);
 await db.organizationMembership.update({where:{id:foreignMembership.id},data:{status:"suspended"}});
 const revoked=await call("me","GET",undefined,first);
 assert.equal(revoked.status,403,"foreign context must recheck active membership every call");
 assert.equal(revoked.error.code,"MEMBERSHIP_REQUIRED");
 const blockedCatalog=await call("events/catalog","GET",undefined,first);
 assert.equal(blockedCatalog.status,403,"suspended membership cannot browse selected catalog");
 assert.equal(blockedCatalog.error.code,"MEMBERSHIP_REQUIRED");
 assert.equal((await call("notifications/"+foreignNote.id,"PATCH",undefined,first)).status,403);
 for(const operation of [
  call("events/registration?eventId="+event.id,"GET",undefined,first),
  call("actions","POST",{kind:"rsvp",eventId:event.id},first),
  call("events/rsvp","DELETE",{eventId:event.id},first)
 ]){
  const response=await operation;
  assert.equal(response.status,403,"revoked selected membership blocks RSVP operations immediately");
  assert.equal(response.error.code,"MEMBERSHIP_REQUIRED");
 }
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,1);
 const contextRevoked=await call("organizations/context","GET",undefined,first);
 assert.equal(contextRevoked.status,200,"account must be able to recover by switching home");
 assert.equal(contextRevoked.data.selectedActive,false);
 assert.ok(!contextRevoked.data.organizations.some(o=>o.id===foreign.id));
 assert.equal((await call("organizations/context","POST",{organizationId:foreign.id},first)).status,404);
 const back=await call("organizations/context","POST",{organizationId:home.id},first);
 assert.equal(back.status,200);
 assert.equal(back.data.limited,false);
 assert.equal((await call("me","GET",undefined,first)).data.organization.id,home.id);
 assert.equal((await call("students","GET",undefined,first)).status,200,
  "original API pilot routes re-enable only after safe return to primary mosque");
 const entries=await db.auditEvent.findMany({where:{
  actorId:member.id,action:"membership.context.select",occurredAt:{gte:createdAt}
 }});
 assert.equal(entries.length,2,"each successful switch records a scoped audit");
 assert.deepEqual(entries.map(e=>e.entityId),[foreign.id,home.id]);
 console.log("Verified per-session mosque selection, cross-mosque private dashboard, inbox/read, consent, active membership revocation, unsafe-workflow denial and privileged role isolation.");
}finally{
 if(foreignMembershipId)await db.organizationMembership.updateMany({where:{id:foreignMembershipId},
  data:{status:"active"}});
 if(tokens.length)await db.authSession.deleteMany({where:{
  tokenHash:{in:tokens.map(x=>createHash("sha256").update(x).digest("hex"))}
 }});
 await db.auditEvent.deleteMany({where:{
  action:"membership.context.select",actorId:(await db.user.findUnique({where:{email:memberEmail}}))?.id||"",
  occurredAt:{gte:createdAt}
 }});
 if(fixture.invitations.length)await db.staffInvitation.deleteMany({where:{id:{in:fixture.invitations}}});
 if(fixture.prefs.length)await db.organizationDeliveryPreference.deleteMany({where:{id:{in:fixture.prefs}}});
 if(fixture.events.length){
  await db.eventRSVP.deleteMany({where:{eventId:{in:fixture.events}}});
  await db.event.deleteMany({where:{id:{in:fixture.events}}});
 }
 if(fixture.donations.length)await db.donation.deleteMany({where:{id:{in:fixture.donations}}});
 if(fixture.campaigns.length)await db.donationCampaign.deleteMany({where:{id:{in:fixture.campaigns}}});
 if(fixture.notes.length){
  await db.outboxEvent.deleteMany({where:{notificationId:{in:fixture.notes}}});
  await db.notification.deleteMany({where:{id:{in:fixture.notes}}});
 }
 if(adminMembershipId)await db.organizationMembership.deleteMany({where:{id:adminMembershipId}});
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

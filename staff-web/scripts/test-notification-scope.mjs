// Tenant-owned notifications, legacy isolation, and verified worker
// recipient eligibility. Isolated synthetic masjid_ci PostgreSQL ONLY.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("/masjid_ci"))
 throw Error("Notification tenant tests require isolated masjid_ci PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function call(path,method="GET",body,token){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
const ids={notifications:[],events:[],jobs:[],applications:[]};
let foreignOrgId=null,foreignMembershipId=null,adminSessionId=null,homeMembershipId=null;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const home=await db.organizationMembership.findUniqueOrThrow({where:{
  organizationId_userId:{organizationId:org.id,userId:member.id}
 }});
 homeMembershipId=home.id;
 const memberLogin=await call("auth/login","POST",{email:memberEmail,password});
 assert.equal(memberLogin.status,200);
 const memberToken=memberLogin.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 adminSessionId=(await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }})).id;
 const foreignOrg=await db.organization.create({data:{
  slug:"notif-foreign-"+randomUUID(),name:"Other scoped mosque"
 }});
 foreignOrgId=foreignOrg.id;
 foreignMembershipId=(await db.organizationMembership.create({data:{
  organizationId:foreignOrg.id,userId:member.id
 }})).id;
 async function createNote(orgId,body){
  const n=await db.notification.create({data:{
   organizationId:orgId,userId:member.id,title:"Private status",body
  }});
  ids.notifications.push(n.id);
  const outbox=await db.outboxEvent.create({data:{
   notificationId:n.id,userId:member.id
  }});
  assert.equal(outbox.status,"pending");
  return n;
 }
 const local=await createNote(org.id,"Local CI family notification only.");
 const foreign=await createNote(foreignOrg.id,"FOREIGN_PRIVATE_NOTE_MUST_NEVER_LEAK");
 const legacy=await createNote(null,"HISTORIC_UNOWNED_NOTE_MUST_NEVER_LEAK");
 assert.equal((await call("me")).status,401,"guest cannot read inbox");
 const inbox=await call("me","GET",undefined,memberToken);
 assert.equal(inbox.status,200);
 assert.ok(inbox.data.notifications.some(n=>n.id===local.id));
 assert.ok(!inbox.data.notifications.some(n=>n.id===foreign.id),
  "a member belonging to BOTH mosques never sees the foreign notification in the first mosque");
 assert.ok(!inbox.data.notifications.some(n=>n.id===legacy.id),
  "historic unowned notifications are not assigned to the default mosque");
 assert.ok(!JSON.stringify(inbox.data).includes("FOREIGN_PRIVATE_NOTE_MUST_NEVER_LEAK"));
 assert.ok(!JSON.stringify(inbox.data).includes("HISTORIC_UNOWNED_NOTE_MUST_NEVER_LEAK"));
 assert.equal((await call("notifications/"+local.id,"PATCH")).status,401);
 for(const invalidId of ["bad","%3Cscript%3E","x".repeat(129)]){
  assert.equal((await call("notifications/"+invalidId,"PATCH",undefined,memberToken)).status,422,
   "invalid notification IDs cannot reach a private write");
 }
 assert.equal((await call("notifications/"+foreign.id,"PATCH",undefined,memberToken)).status,404,
  "foreign private notification ID cannot be marked read");
 assert.equal((await call("notifications/"+legacy.id,"PATCH",undefined,memberToken)).status,404,
  "legacy unowned notification ID cannot be marked read");
 assert.equal((await db.notification.findUniqueOrThrow({where:{id:foreign.id}})).readAt,null);
 assert.equal((await db.notification.findUniqueOrThrow({where:{id:legacy.id}})).readAt,null);
 const read=await call("notifications/"+local.id,"PATCH",undefined,memberToken);
 assert.equal(read.status,200);
 assert.ok((await db.notification.findUniqueOrThrow({where:{id:local.id}})).readAt,
  "recipient may mark only a notification owned by the active mosque");

 // Marking a notification as read twice must retain its FIRST read time.
 const firstRead=(await db.notification.findUniqueOrThrow({where:{id:local.id}})).readAt;
 assert.equal((await call("notifications/"+local.id,"PATCH",undefined,memberToken)).status,200);
 assert.equal((await db.notification.findUniqueOrThrow({where:{id:local.id}})).readAt?.getTime(),
  firstRead?.getTime(),"retry never rewrites the original read timestamp");
 // The dashboard has a 30-record cap, but the private inbox must page through
 // its complete current-mosque history without exposing other domains.
 const older=Array.from({length:54},(_,i)=>({
  id:randomUUID(),organizationId:org.id,userId:member.id,
  title:"Synthetic older inbox message",body:"Synthetic scoped item "+i,
  createdAt:new Date(Date.now()-3600000+i*1000)
 }));
 assert.equal((await db.notification.createMany({data:older})).count,older.length);
 ids.notifications.push(...older.map(note=>note.id));
 assert.equal((await call("notifications")).status,401,"guest inbox denied");
 for(const q of ["?cursor=","?cursor=bad","?cursor=a&cursor=b","?other=abc"]){
  assert.equal((await call("notifications"+q,"GET",undefined,memberToken)).status,422);
 }
 for(const other of [foreign.id,legacy.id]){
  assert.equal((await call("notifications?cursor="+other,"GET",undefined,memberToken)).status,404,
   "known foreign and unowned cursor IDs cannot disclose private history");
 }
 const seen=new Set();
 let next=null,finished=false,pages=0;
 for(;pages<12;pages++){
  const path="notifications"+(next?"?cursor="+encodeURIComponent(next):"");
  const page=await call(path,"GET",undefined,memberToken);
  assert.equal(page.status,200,JSON.stringify(page).slice(0,500));
  assert.equal(page.data.organization.id,org.id);
  assert.equal(page.data.organization.timeZone,org.timeZone,
   "private inbox exposes only the currently selected mosque's configured IANA timezone");
  assert.equal(page.data.pageSize,25);
  assert.ok(page.data.items.length<=25);
  assert.ok(!JSON.stringify(page.data).includes("FOREIGN_PRIVATE_NOTE_MUST_NEVER_LEAK"));
  assert.ok(!JSON.stringify(page.data).includes("HISTORIC_UNOWNED_NOTE_MUST_NEVER_LEAK"));
  for(const item of page.data.items){
   assert.ok(!seen.has(item.id),"stable page boundaries cannot duplicate an entry");
   seen.add(item.id);
  }
  if(!page.data.hasMore){assert.equal(page.data.nextCursor,null);finished=true;break;}
  next=page.data.nextCursor;
  assert.equal(next,page.data.items.at(-1)?.id);
 }
 assert.ok(finished&&pages>=2,"older history is reachable beyond two pages");
 assert.ok(older.every(note=>seen.has(note.id))&&seen.has(local.id));
 assert.ok(!seen.has(foreign.id)&&!seen.has(legacy.id));
 // A real event waitlist promotion creates a scoped notice in the same
 // transaction as the factual member reservation.
 const event=await db.event.create({data:{
  organizationId:org.id,title:"CI waitlist notice "+randomUUID(),
  description:"Synthetic event notice owner",location:"CI venue",status:"published",
  capacity:1,rsvpCount:1,waitlistEnabled:true,
  startAt:new Date(Date.now()+86400000),endAt:new Date(Date.now()+90000000)
 }});
 ids.events.push(event.id);
 await db.eventRSVP.createMany({data:[
  {eventId:event.id,userId:admin.id,status:"confirmed"},
  {eventId:event.id,userId:member.id,status:"waitlisted"}
 ]});
 const promoted=await call("events/rsvp","DELETE",{eventId:event.id},adminToken);
 assert.equal(promoted.status,200);
 assert.equal(promoted.data.promotedWaitlist,true);
 const newNotice=await db.notification.findFirst({where:{
  organizationId:org.id,userId:member.id,title:"Your event place is confirmed"
 },orderBy:{createdAt:"desc"},include:{outboxEvents:true}});
 assert.ok(newNotice,"real producer explicitly stamps the organization");
 assert.equal(newNotice.outboxEvents.length,1);
 assert.equal(newNotice.outboxEvents[0].status,"pending");
 ids.notifications.push(newNotice.id);
 const inboxAfter=await call("me","GET",undefined,memberToken);
 assert.ok(inboxAfter.data.notifications.some(x=>x.id===newNotice.id));
 assert.ok(!inboxAfter.data.notifications.some(x=>x.id===foreign.id));

 // A revoked membership cannot be used to justify a new notification.
 // Reviewing a historical application remains possible without sending
 // an external message to a now-unaffiliated recipient.
 const job=await db.jobPosting.create({data:{
  organizationId:org.id,title:"CI private notice guard",description:"Synthetic job",
  company:"Test organization",status:"published"
 }});
 ids.jobs.push(job.id);
 const app=await db.jobApplication.create({data:{
  jobId:job.id,userId:member.id,
  coverLetter:"I volunteered for the synthetic role to exercise notices."
 }});
 ids.applications.push(app.id);
 await db.organizationMembership.update({where:{id:home.id},data:{status:"suspended"}});
 const blockedInbox=await call("me","GET",undefined,memberToken);
 assert.equal(blockedInbox.status,403,"suspended local membership immediately loses inbox access");
 const blockedMark=await call("notifications/"+local.id,"PATCH",undefined,memberToken);
 assert.equal(blockedMark.status,403,"suspended local membership cannot mutate a notification");
 const reviewed=await call("admin/jobs","PATCH",{
  applicationId:app.id,status:"declined"
 },adminToken);
 assert.equal(reviewed.status,200,"authorized staff action is not blocked by an ineligible notification recipient");
 assert.equal(await db.notification.count({where:{
  organizationId:org.id,userId:member.id,title:"Your job application was reviewed"
 }}),0,"no new private notice or outgoing email is queued for a suspended recipient");
 await db.organizationMembership.update({where:{id:home.id},data:{status:"active"}});
 const localAgain=await call("me","GET",undefined,memberToken);
 assert.equal(localAgain.status,200);
 assert.ok(localAgain.data.notifications.some(n=>n.id===local.id));

 const pending=await db.outboxEvent.findMany({where:{
  notificationId:{in:[local.id,foreign.id,legacy.id,newNotice.id]}
 },include:{notification:{select:{organizationId:true,userId:true}}}});
 assert.equal(pending.length,4);
 assert.ok(pending.some(x=>x.notificationId===legacy.id&&x.notification.organizationId===null),
  "unowned legacy messages are retained without fabricated tenancy");
 assert.ok(pending.every(x=>x.notification.userId===x.userId),
  "all legitimate queued messages match their recipient identity");
 console.log("Verified mosque-owned inbox, mark-read scope, private legacy hold, active-recipient producer and foreign tenant isolation.");
}finally{
 if(homeMembershipId)await db.organizationMembership.updateMany({where:{id:homeMembershipId},data:{status:"active"}});
 if(ids.notifications.length){
  await db.outboxEvent.deleteMany({where:{notificationId:{in:ids.notifications}}});
  await db.notification.deleteMany({where:{id:{in:ids.notifications}}});
 }
 if(ids.events.length){
  await db.eventRSVP.deleteMany({where:{eventId:{in:ids.events}}});
  await db.event.deleteMany({where:{id:{in:ids.events}}});
 }
 if(ids.applications.length)await db.jobApplication.deleteMany({where:{id:{in:ids.applications}}});
 if(ids.jobs.length)await db.jobPosting.deleteMany({where:{id:{in:ids.jobs}}});
 if(adminSessionId)await db.authSession.deleteMany({where:{id:adminSessionId}});
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

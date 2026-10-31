// Assigned gathering-host check-in against synthetic records in isolated CI PostgreSQL.
// Never import real attendee data or operate against a live database.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing to run gathering host tests outside isolated CI.");
const {adminEmail,memberEmail,staffEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",payload,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(payload?{"Content-Type":"application/json"}:{})
 },body:payload?JSON.stringify(payload):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
const ids=[],rosterFakeUsers=[],auditedRsvpIds=[];
let otherOrgId,foreignUserId,adminSession;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const staff=await db.user.findUniqueOrThrow({where:{email:staffEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const staffLogin=await request("auth/login","POST",{email:staffEmail,password});
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(staffLogin.status,200);
 assert.equal(memberLogin.status,200);
 const staffToken=staffLogin.data.token,memberToken=memberLogin.data.token;
 // CI-only privileged test session; MFA behavior has independent auth regression tests.
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{userId:admin.id,
  tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 const starts=new Date(Date.now()+30*60_000);
 const ends=new Date(starts.getTime()+60*60_000);
 const event=await db.event.create({data:{
  organizationId:org.id,title:"Synthetic host arrival check",description:"For check-in access tests",
  location:"CI room",startAt:starts,endAt:ends,capacity:1,waitlistEnabled:true,status:"published"
 }});
 ids.push(event.id);
 const accepted=await request("actions","POST",{kind:"rsvp",eventId:event.id},memberToken);
 assert.equal(accepted.status,201);
 assert.equal(accepted.data.status,"confirmed");
 const waiting=await request("actions","POST",{kind:"rsvp",eventId:event.id},staffToken);
 assert.equal(waiting.status,201);
 assert.equal(waiting.data.status,"waitlisted");
 const confirmed=await db.eventRSVP.findUniqueOrThrow({where:{eventId_userId:{eventId:event.id,userId:member.id}}});
 const waitlisted=await db.eventRSVP.findUniqueOrThrow({where:{eventId_userId:{eventId:event.id,userId:staff.id}}});
 auditedRsvpIds.push(confirmed.id);
 assert.equal((await request("events/check-in")).status,401,"guest cannot see host assignments");
 const beforeGrant=await request("events/check-in?eventId="+event.id,"GET",null,staffToken);
 assert.equal(beforeGrant.status,404,"staff role alone cannot read attendance");
 const beforeMember=await request("events/check-in?eventId="+event.id,"GET",null,memberToken);
 assert.equal(beforeMember.status,404,"regular attendee cannot see private roster");
 const adminList=await request("admin/event-hosts","GET",null,adminToken);
 assert.equal(adminList.status,200);
 assert.ok(adminList.data.events.some(x=>x.id===event.id),"steward can see local event to assign a host");
 const invalid=await request("admin/event-hosts","POST",{
  eventId:event.id,hostId:"not-an-eligible-person",action:"assign"
 },adminToken);
 assert.equal(invalid.status,422,"unknown host cannot be assigned");
 const assignment=await request("admin/event-hosts","POST",{
  eventId:event.id,hostId:staff.id,action:"assign"
 },adminToken);
 assert.equal(assignment.status,200);
 const assignedEvents=await request("events/check-in","GET",null,staffToken);
 assert.equal(assignedEvents.status,200);
 assert.ok(assignedEvents.data.events.some(x=>x.id===event.id),"host sees only assigned events");
 const roster=await request("events/check-in?eventId="+event.id,"GET",null,staffToken);
 assert.equal(roster.status,200);
 assert.equal(roster.data.roster.length,1,"waitlist not in arrival roster");
 assert.equal(roster.data.roster[0].id,confirmed.id);
 assert.equal(roster.data.roster[0].checkedInAt,null);
 assert.deepEqual(Object.keys(roster.data.roster[0].user).sort(),["firstName","lastName"],
  "host does not see email, contact or private account information");
 const unassignedAdmin=await request("events/check-in?eventId="+event.id,"GET",null,adminToken);
 assert.equal(unassignedAdmin.status,404,"admin does not inherit all attendee rosters");
 const unassignedWrite=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:0
 },memberToken);
 assert.equal(unassignedWrite.status,404,"member cannot mark another member's attendance");
 const waitingWrite=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:waitlisted.id,action:"arrive",expectedRevision:0
 },staffToken);
 assert.equal(waitingWrite.status,404,"waitlisted member cannot be checked in");
 const arrival=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:0
 },staffToken);
 assert.equal(arrival.status,200,JSON.stringify(arrival));
 assert.equal(arrival.data.revision,1);
 const recorded=await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}});
 assert.ok(recorded.checkedInAt instanceof Date);
 assert.equal(recorded.checkedInById,staff.id);
 assert.equal(recorded.checkInRevision,1);
 const ownArrival=await request("events/registration?eventId="+event.id,"GET",null,memberToken);
 assert.equal(ownArrival.status,200);
 assert.ok(ownArrival.data.registration.checkedInAt,"member can see their own factual checked-in state");
 assert.ok(!Object.hasOwn(ownArrival.data.registration,"user"),"own registration never leaks a roster");
 const stale=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:0
 },staffToken);
 assert.equal(stale.status,409,"stale UI cannot record an arrival again");
 const sameAgain=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:1
 },staffToken);
 assert.equal(sameAgain.status,409,"already checked-in is explicitly rejected");
 const blockedCancel=await request("events/rsvp","DELETE",{eventId:event.id},memberToken);
 assert.equal(blockedCancel.status,409,"checked-in attendee cannot silently cancel a factual arrival");
 assert.equal(blockedCancel.error.code,"ALREADY_CHECKED_IN");
 const missingReason=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"correct",expectedRevision:1,reason:"mistake"
 },staffToken);
 assert.equal(missingReason.status,422,"correction requires a useful reason");
 const correction=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"correct",expectedRevision:1,
  reason:"Duplicate manual attendance registration; entry corrected."
 },staffToken);
 assert.equal(correction.status,200);
 assert.equal(correction.data.checkedIn,false);
 assert.equal((await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}})).checkedInAt,null);
 assert.equal((await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}})).checkInRevision,2);
 const ownCorrected=await request("events/registration?eventId="+event.id,"GET",null,memberToken);
 assert.equal(ownCorrected.data.registration.checkedInAt,null,"member sees corrected own check-in status");
 // A previously confirmed participant may lose identity verification,
 // organization membership or account access before physical check-in.
 // Their name must disappear from active host rosters immediately and
 // stale RSVP IDs must not bypass the server-side authorization gate.
 assert.ok(member.verifiedAt,"fixture must start with verified account");
 const membership=await db.organizationMembership.findUniqueOrThrow({where:{
  organizationId_userId:{organizationId:org.id,userId:member.id}
 }});
 assert.equal(membership.status,"active");
 async function assertIneligible(label){
  const activeRoster=await request("events/check-in?eventId="+event.id,"GET",null,staffToken);
  assert.equal(activeRoster.status,200);
  assert.equal(activeRoster.data.roster.length,0,label+" should not disclose roster names");
  const blocked=await request("events/check-in","POST",{
   eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:2
  },staffToken);
  assert.equal(blocked.status,404,label+" cannot be checked in by guessed RSVP ID");
  assert.equal(blocked.error.code,"NOT_CONFIRMED");
  const row=await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}});
  assert.equal(row.checkInRevision,2,"eligibility denial is not an attendance correction");
  assert.equal(row.checkedInAt,null);
 }
 try{
  await db.organizationMembership.update({where:{
   organizationId_userId:{organizationId:org.id,userId:member.id}
  },data:{status:"suspended"}});
  await assertIneligible("suspended mosque membership");
  await db.organizationMembership.update({where:{
   organizationId_userId:{organizationId:org.id,userId:member.id}
  },data:{status:"active"}});
  await db.user.update({where:{id:member.id},data:{verifiedAt:null}});
  await assertIneligible("unverified account");
  await db.user.update({where:{id:member.id},data:{verifiedAt:member.verifiedAt}});
  await db.user.update({where:{id:member.id},data:{status:"suspended"}});
  await assertIneligible("suspended account");
 }finally{
  await db.organizationMembership.updateMany({where:{
   organizationId:org.id,userId:member.id
  },data:{status:membership.status}});
  await db.user.update({where:{id:member.id},data:{
   status:member.status,verifiedAt:member.verifiedAt
  }});
 }
 // A host's existing grant is not enough if their role becomes ineligible.
 // A source system can demote someone after the assignment was made.
 const originalRole=staff.role;
 try{
  await db.user.update({where:{id:staff.id},data:{role:"student"}});
  const demotedList=await request("events/check-in","GET",null,staffToken);
  assert.equal(demotedList.status,200);
  assert.ok(!demotedList.data.events.some(e=>e.id===event.id));
  const demotedRoster=await request("events/check-in?eventId="+event.id,"GET",null,staffToken);
  assert.equal(demotedRoster.status,404,"demoted host cannot read attendance");
  assert.equal(demotedRoster.error.code,"EVENT_UNAVAILABLE");
  const demotedWrite=await request("events/check-in","POST",{
   eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:2
  },staffToken);
  assert.equal(demotedWrite.status,404,"demoted host cannot mark attendance");
  assert.equal(demotedWrite.error.code,"EVENT_UNAVAILABLE");
  assert.equal((await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}})).checkInRevision,2);
 }finally{
  await db.user.update({where:{id:staff.id},data:{role:originalRole}});
 }
 const restoredRoster=await request("events/check-in?eventId="+event.id,"GET",null,staffToken);
 assert.equal(restoredRoster.data.roster.length,1,
  "restored eligibility permits the original confirmed reservation again");


 // F-010: a genuine private roster may exceed the former 300-row cutoff.
 // Use synthetic CI members only, never real identities or attendance.
 // All 55 RSVPs share an exact timestamp to prove stable (createdAt,id) paging.
 const large=await db.event.create({data:{
  organizationId:org.id,title:"Synthetic large private host roster",
  description:"Synthetic bounded host roster test",location:"CI room",
  startAt:starts,endAt:ends,status:"published",rsvpCount:55
 }});
 ids.push(large.id);
 await db.eventHostAssignment.create({data:{
  eventId:large.id,hostId:staff.id,assignedById:admin.id
 }});
 const fakeIds=Array.from({length:54},()=>randomUUID());
 rosterFakeUsers.push(...fakeIds);
 await db.user.createMany({data:fakeIds.map((id,i)=>({
  id,email:"ci-roster-"+id+"@example.test",firstName:"CI Host Roster",
  lastName:"Member "+String(i).padStart(2,"0"),
  passwordHash:staff.passwordHash,role:"member",verifiedAt:new Date()
 }))});
 await db.organizationMembership.createMany({data:fakeIds.map(userId=>({
  userId,organizationId:org.id,status:"active"
 }))});
 const createdAt=new Date();
 const rows=[
  ...fakeIds.map(userId=>({
   id:randomUUID(),eventId:large.id,userId,status:"confirmed",createdAt
  })),
  {id:"zz-roster-"+randomUUID(),eventId:large.id,userId:member.id,
   status:"confirmed",createdAt}
 ];
 await db.eventRSVP.createMany({data:rows});
 const expected=rows.map(x=>x.id).sort();
 const fetched=[];
 let cursor=null,firstCursor=null;
 for(let pageNo=0;pageNo<2;pageNo++){
  const answer=await request("events/check-in?eventId="+large.id+
   (cursor?"&cursor="+encodeURIComponent(cursor):""),"GET",null,staffToken);
  assert.equal(answer.status,200,JSON.stringify(answer));
  assert.equal(answer.data.pageSize,50);
  assert.equal(answer.data.roster.length,pageNo===0?50:5);
  assert.equal(answer.data.hasMore,pageNo===0);
  assert.equal(answer.data.complete,pageNo!==0);
  assert.ok(answer.data.roster.every(x=>
   Object.keys(x.user).sort().join(",")==="firstName,lastName"));
  fetched.push(...answer.data.roster.map(x=>x.id));
  cursor=answer.data.nextCursor;
  if(pageNo===0){
   firstCursor=cursor;
   assert.equal(cursor,fetched[fetched.length-1]);
  }else assert.equal(cursor,null);
 }
 assert.deepEqual(fetched,expected,"all 55 confirmed people are reachable exactly once");
 assert.equal(new Set(fetched).size,55);
 for(const params of [
  "cursor="+randomUUID(),
  "cursor="+waitlisted.id,
  "cursor="+confirmed.id,
  "cursor=",
  "cursor="+firstCursor+"&cursor="+firstCursor,
  "eventId="+event.id+"&cursor="+firstCursor
 ]){
  const path=params.startsWith("eventId=")
   ?"events/check-in?"+params:"events/check-in?eventId="+large.id+"&"+params;
  const rejected=await request(path,"GET",null,staffToken);
  assert.ok([404,422].includes(rejected.status),
   "bad/other-event/duplicate roster cursor must fail closed: "+params);
 }
 assert.equal((await request("events/check-in?cursor="+firstCursor,
  "GET",null,staffToken)).status,422);
 assert.equal((await request("events/check-in?eventId="+large.id+
  "&eventId="+event.id,"GET",null,staffToken)).status,422);
 const cursorRow=rows.find(x=>x.id===firstCursor);
 assert.ok(cursorRow&&cursorRow.userId!==member.id);
 try{
  await db.organizationMembership.update({where:{
   organizationId_userId:{organizationId:org.id,userId:cursorRow.userId}
  },data:{status:"suspended"}});
  const revokedCursor=await request("events/check-in?eventId="+large.id+
   "&cursor="+firstCursor,"GET",null,staffToken);
  assert.equal(revokedCursor.status,404,
   "membership revocation invalidates the roster cursor immediately");
  assert.equal(revokedCursor.error.code,"ROSTER_CURSOR_UNAVAILABLE");
 }finally{
  await db.organizationMembership.update({where:{
   organizationId_userId:{organizationId:org.id,userId:cursorRow.userId}
  },data:{status:"active"}});
 }
 const last=rows.find(x=>x.id===expected[expected.length-1]);
 const lastArrival=await request("events/check-in","POST",{
  eventId:large.id,rsvpId:last.id,action:"arrive",expectedRevision:0
 },staffToken);
 assert.equal(lastArrival.status,200,"host can check in a later-page attendee");
 assert.equal(lastArrival.data.revision,1);
 assert.ok(lastArrival.data.checkedInAt);
 auditedRsvpIds.push(last.id);
 const recordedLast=await db.eventRSVP.findUniqueOrThrow({where:{id:last.id}});
 assert.equal(recordedLast.checkInRevision,1);
 assert.ok(recordedLast.checkedInAt instanceof Date);
 const journal=await db.auditEvent.findMany({where:{
  entity:"EventRSVP",entityId:confirmed.id,action:{in:["gather.check-in","gather.check-in.correct"]}
 }});
 assert.equal(journal.length,2,"check-in and correction both recorded as audit events");
 assert.ok(journal.some(x=>x.action==="gather.check-in.correct"&&x.detail?.includes("Duplicate manual")));
 // Too-early arrival attempt on a separately assigned future event.
 const future=await db.event.create({data:{
  organizationId:org.id,title:"Synthetic far-future gathering",description:"Window boundary",
  location:"CI room",startAt:new Date("2032-11-05T15:00:00Z"),endAt:new Date("2032-11-05T16:00:00Z"),status:"published"
 }});
 ids.push(future.id);
 await db.eventHostAssignment.create({data:{eventId:future.id,hostId:staff.id,assignedById:admin.id}});
 const farRSVP=await db.eventRSVP.create({data:{eventId:future.id,userId:member.id}});
 const early=await request("events/check-in","POST",{
  eventId:future.id,rsvpId:farRSVP.id,action:"arrive",expectedRevision:0
 },staffToken);
 assert.equal(early.status,409,"arrival cannot be recorded far before gathering");
 assert.equal(early.error.code,"CHECK_IN_WINDOW");
 // A guessed old event ID cannot retrieve a stale private roster indefinitely.
 const pastStart=new Date(Date.now()-11*86400000);
 const past=await db.event.create({data:{
  organizationId:org.id,title:"Expired host roster",description:"Retention boundary",
  location:"Old CI room",startAt:pastStart,endAt:new Date(pastStart.getTime()+3600000),status:"published"
 }});
 ids.push(past.id);
 await db.eventHostAssignment.create({data:{eventId:past.id,hostId:staff.id,assignedById:admin.id}});
 await db.eventRSVP.create({data:{eventId:past.id,userId:member.id}});
 const staleRoster=await request("events/check-in?eventId="+past.id,"GET",null,staffToken);
 assert.equal(staleRoster.status,404,"host roster access expires seven days after event");
 // Forged host assignment in another mosque still cannot show another tenant's roster.
 const otherOrg=await db.organization.create({data:{
  slug:"checkin-isolation-"+Date.now(),name:"Foreign mosque"
 }});
 otherOrgId=otherOrg.id;
 const foreignHost=await db.user.create({data:{
  email:"foreign-checkin-host-"+Date.now()+"@example.test",
  firstName:"Foreign",lastName:"Host",passwordHash:staff.passwordHash,
  verifiedAt:new Date(),memberships:{create:{organizationId:otherOrg.id}}
 }});
 foreignUserId=foreignHost.id;
 const foreignMemberGrant=await request("admin/event-hosts","POST",{
  eventId:event.id,hostId:foreignHost.id,action:"assign"
 },adminToken);
 assert.equal(foreignMemberGrant.status,422,"steward cannot grant home event roster to another mosque's member");
 const foreign=await db.event.create({data:{
  organizationId:otherOrg.id,title:"Private foreign roster",description:"Restricted",
  location:"Other CI room",startAt:starts,endAt:ends,status:"published"
 }});
 ids.push(foreign.id);
 await db.eventHostAssignment.create({data:{eventId:foreign.id,hostId:staff.id,assignedById:admin.id}});
 await db.eventRSVP.create({data:{eventId:foreign.id,userId:member.id}});
 const foreignRoster=await request("events/check-in?eventId="+foreign.id,"GET",null,staffToken);
 assert.equal(foreignRoster.status,404);
 const foreignMark=await request("events/check-in","POST",{
  eventId:foreign.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:2
 },staffToken);
 assert.equal(foreignMark.status,404);
 const foreignGrant=await request("admin/event-hosts","POST",{
  eventId:foreign.id,hostId:member.id,action:"assign"
 },adminToken);
 assert.equal(foreignGrant.status,404);
 const list=await request("events/check-in","GET",null,staffToken);
 assert.ok(!list.data.events.some(x=>x.id===foreign.id),"foreign assignments do not show in host list");
 const revocation=await request("admin/event-hosts","POST",{
  eventId:event.id,hostId:staff.id,action:"revoke"
 },adminToken);
 assert.equal(revocation.status,200);
 assert.equal((await request("events/check-in?eventId="+event.id,"GET",null,staffToken)).status,404,
  "revoked host loses roster access immediately");
 const deniedAfterRevocation=await request("events/check-in","POST",{
  eventId:event.id,rsvpId:confirmed.id,action:"arrive",expectedRevision:2
 },staffToken);
 assert.equal(deniedAfterRevocation.status,404,"revoked host loses write permission immediately");
 const revokedLarge=await request("admin/event-hosts","POST",{
  eventId:large.id,hostId:staff.id,action:"revoke"
 },adminToken);
 assert.equal(revokedLarge.status,200);
 const revokedPage=await request("events/check-in?eventId="+large.id+
  "&cursor="+firstCursor,"GET",null,staffToken);
 assert.equal(revokedPage.status,404,"revoked host cannot resume a private roster page");
 assert.equal((await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}})).checkInRevision,2);
 console.log("Verified current host eligibility, 50-row private roster pagination across 55 synthetic people, invalid and revoked cursors, later-page arrivals, waitlist exclusion, correction audit, time gates, tenant isolation and host revocation.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 if(auditedRsvpIds.length)await db.auditEvent.deleteMany({where:{
  entity:"EventRSVP",entityId:{in:auditedRsvpIds}
 }});
 if(ids.length)await db.auditEvent.deleteMany({where:{
  entity:"Event",entityId:{in:ids},action:{startsWith:"gather.host."}
 }});
 for(const id of ids){
  await db.eventHostAssignment.deleteMany({where:{eventId:id}});
  await db.eventRSVP.deleteMany({where:{eventId:id}});
  await db.event.deleteMany({where:{id}});
 }
 if(rosterFakeUsers.length){
  await db.organizationMembership.deleteMany({where:{userId:{in:rosterFakeUsers}}});
  await db.user.deleteMany({where:{id:{in:rosterFakeUsers}}});
 }
 if(foreignUserId){
  await db.organizationMembership.deleteMany({where:{userId:foreignUserId}});
  await db.user.deleteMany({where:{id:foreignUserId}});
 }
 if(otherOrgId)await db.organization.deleteMany({where:{id:otherOrgId}});
 await db.$disconnect();
}

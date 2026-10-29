// Assigned gathering-host check-in against synthetic records in isolated CI PostgreSQL.
// Never import real attendee data or operate against a live database.
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
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
const ids=[];
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
 assert.equal((await db.eventRSVP.findUniqueOrThrow({where:{id:confirmed.id}})).checkInRevision,2);
 console.log("Verified assigned-host-only rosters, waitlist denial, recorded arrivals, correction audit, stale race, time gates, foreign tenant and revocation.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 for(const id of ids){
  await db.eventHostAssignment.deleteMany({where:{eventId:id}});
  await db.eventRSVP.deleteMany({where:{eventId:id}});
  await db.event.deleteMany({where:{id}});
 }
 if(foreignUserId){
  await db.organizationMembership.deleteMany({where:{userId:foreignUserId}});
  await db.user.deleteMany({where:{id:foreignUserId}});
 }
 if(otherOrgId)await db.organization.deleteMany({where:{id:otherOrgId}});
 await db.$disconnect();
}

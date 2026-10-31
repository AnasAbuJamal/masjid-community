// Volunteer shift time gates and overlapping commitments, synthetic records only.
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||!process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing volunteer shift tests outside isolated CI.");
const {adminEmail,memberEmail}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
let adminSession,memberSession,foreignOrgId;
const opportunities=[];
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 assert.ok(org);
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  mfaVerifiedAt:new Date(),expiresAt:new Date(Date.now()+3600000)
 }});
 const memberToken=randomBytes(32).toString("base64url");
 memberSession=await db.authSession.create({data:{
  userId:member.id,tokenHash:createHash("sha256").update(memberToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000)
 }});
 const now=Date.now();
 const hour=3600000;
 const foreignOrg=await db.organization.create({data:{
  slug:"shift-safety-"+now,name:"Foreign volunteer organization"
 }});
 foreignOrgId=foreignOrg.id;
 const foreignOpp=await db.volunteerOpportunity.create({data:{
  organizationId:foreignOrg.id,title:"Foreign service",description:"Synthetic other mosque",
  startsAt:new Date(now+5*hour),capacity:4,published:true
 }});
 opportunities.push(foreignOpp.id);
 const foreignApp=await db.volunteerApplication.create({data:{
  opportunityId:foreignOpp.id,userId:member.id,status:"approved"
 }});
 const foreignShift=await db.volunteerShift.create({data:{
  opportunityId:foreignOpp.id,applicationId:foreignApp.id,userId:member.id,
  startAt:new Date(now+5*hour),endAt:new Date(now+6*hour)
 }});
 const localOpp=await db.volunteerOpportunity.create({data:{
  organizationId:org.id,title:"Home mosque service",description:"Synthetic local opportunity",
  startsAt:new Date(now+5*hour),capacity:4,published:true
 }});
 opportunities.push(localOpp.id);
 const localApp=await db.volunteerApplication.create({data:{
  opportunityId:localOpp.id,userId:member.id,status:"approved"
 }});
 const reviewOpp=await db.volunteerOpportunity.create({data:{
  organizationId:org.id,title:"Volunteer review eligibility",description:"Synthetic approval test",
  startsAt:new Date(now+13*hour),capacity:2,published:true
 }});
 opportunities.push(reviewOpp.id);
 const reviewApp=await db.volunteerApplication.create({data:{
  opportunityId:reviewOpp.id,userId:member.id,status:"submitted"
 }});
 // Recheck eligibility at every schedule request: approved historical
 // applications do not override current mosque membership or account status.
 const membership=await db.organizationMembership.findUniqueOrThrow({where:{
  organizationId_userId:{organizationId:org.id,userId:member.id}
 }});
 assert.equal(membership.status,"active");
 assert.ok(member.verifiedAt);
 const possibleShift={
  kind:"schedule",applicationId:localApp.id,
  startAt:new Date(now+11*hour).toISOString(),
  endAt:new Date(now+12*hour).toISOString()
 };
 try{
  await db.organizationMembership.update({where:{id:membership.id},data:{status:"suspended"}});
  const listSuspended=await request("admin/shifts","GET",null,adminToken);
  assert.equal(listSuspended.status,200);
  assert.ok(!listSuspended.data.applications.some(a=>a.id===localApp.id),
   "suspended volunteer no longer appears as schedulable");
  const blocked=await request("admin/shifts","POST",possibleShift,adminToken);
  assert.equal(blocked.status,404,"inactive mosque membership blocks a new shift");
  await db.organizationMembership.update({where:{id:membership.id},data:{status:"active"}});
  await db.user.update({where:{id:member.id},data:{status:"suspended"}});
  const suspendedUser=await request("admin/shifts","POST",possibleShift,adminToken);
  assert.equal(suspendedUser.status,404,"suspended account cannot be scheduled");
 }finally{
  await db.organizationMembership.update({where:{id:membership.id},data:{status:membership.status}});
  await db.user.update({where:{id:member.id},data:{status:member.status}});
 }
 try{
  await db.volunteerOpportunity.update({where:{id:localOpp.id},data:{published:false}});
  const unpublished=await request("admin/shifts","POST",possibleShift,adminToken);
  assert.equal(unpublished.status,404,
   "unpublished service opportunities cannot accept a new scheduled shift");
 }finally{
  await db.volunteerOpportunity.update({where:{id:localOpp.id},data:{published:true}});
 }
 try{
  await db.user.update({where:{id:member.id},data:{role:"student"}});
  const studentList=await request("admin/shifts","GET",null,adminToken);
  assert.equal(studentList.status,200);
  assert.ok(!studentList.data.applications.some(a=>a.id===localApp.id),
   "student-role accounts never appear as eligible volunteers");
  const studentSchedule=await request("admin/shifts","POST",possibleShift,adminToken);
  assert.equal(studentSchedule.status,404,"an old approval cannot schedule a newly reclassified student");
  const studentApplication=await request("actions","POST",{
   kind:"volunteer",opportunityId:reviewOpp.id
  },memberToken);
  assert.equal(studentApplication.status,403,
   "student volunteer applications cannot be submitted from an old eligible session");
  assert.equal(studentApplication.error.code,"VOLUNTEER_INELIGIBLE");
  const studentApproval=await request("admin","POST",{
   kind:"volunteer-decision",applicationId:reviewApp.id,decision:"approved"
  },adminToken);
  assert.equal(studentApproval.status,409,
   "submitted application cannot override current student role at approval");
  assert.equal(studentApproval.error.code,"VOLUNTEER_INELIGIBLE");
  assert.equal((await db.volunteerApplication.findUniqueOrThrow({
   where:{id:reviewApp.id}
  })).status,"submitted");
  assert.equal((await db.volunteerOpportunity.findUniqueOrThrow({
   where:{id:reviewOpp.id}
  })).filled,0,"denied approval must not reserve volunteer capacity");
 }finally{
  await db.user.update({where:{id:member.id},data:{role:member.role}});
 }
 const positiveApplication=await request("actions","POST",{
  kind:"volunteer",opportunityId:reviewOpp.id
 },memberToken);
 assert.equal(positiveApplication.status,201,
  "an eligible adult can retry an existing submitted application");
 assert.equal(positiveApplication.data.status,"submitted");
 try{
  await db.volunteerOpportunity.update({where:{id:reviewOpp.id},data:{published:false}});
  const unpublishedApproval=await request("admin","POST",{
   kind:"volunteer-decision",applicationId:reviewApp.id,decision:"approved"
  },adminToken);
  assert.equal(unpublishedApproval.status,409,
   "unpublished volunteer opportunities cannot receive fresh application approval");
  assert.equal((await db.volunteerApplication.findUniqueOrThrow({
   where:{id:reviewApp.id}
  })).status,"submitted","rejected unpublish review preserves submitted state");
  assert.equal((await db.volunteerOpportunity.findUniqueOrThrow({
   where:{id:reviewOpp.id}
  })).filled,0,"denied unpublished approval does not fill capacity");
 }finally{
  await db.volunteerOpportunity.update({where:{id:reviewOpp.id},data:{published:true}});
 }
 const positiveApproval=await request("admin","POST",{
  kind:"volunteer-decision",applicationId:reviewApp.id,decision:"approved"
 },adminToken);
 assert.equal(positiveApproval.status,201,
  "reviewer may approve an eligible adult's local application");
 assert.equal((await db.volunteerApplication.findUniqueOrThrow({
  where:{id:reviewApp.id}
 })).status,"approved");
 assert.equal((await db.volunteerOpportunity.findUniqueOrThrow({
  where:{id:reviewOpp.id}
 })).filled,1,"successful approval claims one volunteer slot");
 assert.equal(await db.volunteerShift.count({where:{opportunityId:localOpp.id}}),0,
  "denied eligibility and unpublished-opportunity attempts created no shift");

 const list=await request("admin/shifts","GET",null,adminToken);
 assert.equal(list.status,200);
 assert.ok(!list.data.shifts.some(x=>x.id===foreignShift.id),"foreign volunteer shifts hidden");
 const foreignEdit=await request("admin/shifts","POST",{
  kind:"update",shiftId:foreignShift.id,action:"cancel"
 },adminToken);
 assert.equal(foreignEdit.status,409,"cross-organization shift update denied");
 const foreignCorrection=await request("admin/shifts","POST",{
  kind:"correct",shiftId:foreignShift.id,action:"remove-arrival",
  reason:"Incorrect arrival recorded in another mosque"
 },adminToken);
 assert.equal(foreignCorrection.status,409,"foreign shift correction denied without exposing its status");
 const overlap=await request("admin/shifts","POST",{
  kind:"schedule",applicationId:localApp.id,
  startAt:new Date(now+5*hour+60000).toISOString(),
  endAt:new Date(now+6*hour).toISOString()
 },adminToken);
 assert.equal(overlap.status,409,"member cannot be double-scheduled across mosques");
 assert.equal(overlap.error.code,"OVERLAPPING_SHIFT");
 assert.equal(await db.volunteerShift.count({where:{opportunityId:localOpp.id}}),0);
 // The same two concurrent time-slot requests must not both pass the atomic gate.
 const concurrentBody={
  kind:"schedule",applicationId:localApp.id,
  startAt:new Date(now+9*hour).toISOString(),endAt:new Date(now+10*hour).toISOString()
 };
 const concurrent=await Promise.all([
  request("admin/shifts","POST",concurrentBody,adminToken),
  request("admin/shifts","POST",concurrentBody,adminToken)
 ]);
 assert.deepEqual(concurrent.map(x=>x.status).sort(),[201,409],
  "two concurrent schedules must leave a single accepted shift");
 assert.equal(await db.volunteerShift.count({where:{
  opportunityId:localOpp.id,startAt:new Date(now+9*hour)
 }}),1);
 const futureId=concurrent.find(x=>x.status===201).data.id;
 const tooEarly=await request("admin/shifts","POST",{
  kind:"update",shiftId:futureId,action:"check-in"
 },adminToken);
 assert.equal(tooEarly.status,409);
 assert.equal(tooEarly.error.code,"TOO_EARLY","no early arrival for distant shift");
 const activeShift=await db.volunteerShift.create({data:{
  opportunityId:localOpp.id,applicationId:localApp.id,userId:member.id,
  startAt:new Date(now-10*60000),endAt:new Date(now+40*60000)
 }});
 try{
  await db.organizationMembership.update({where:{id:membership.id},data:{status:"suspended"}});
  const rejectedCheckin=await request("admin/shifts","POST",{
   kind:"update",shiftId:activeShift.id,action:"check-in"
  },adminToken);
  assert.equal(rejectedCheckin.status,409);
  assert.equal(rejectedCheckin.error.code,"VOLUNTEER_INELIGIBLE");
  assert.equal((await db.volunteerShift.findUniqueOrThrow({
   where:{id:activeShift.id}
  })).checkedInAt,null,"ineligible person was not marked present");
 }finally{
  await db.organizationMembership.update({where:{id:membership.id},data:{status:membership.status}});
 }

 try{
  await db.user.update({where:{id:member.id},data:{role:"student"}});
  const studentCheckin=await request("admin/shifts","POST",{
   kind:"update",shiftId:activeShift.id,action:"check-in"
  },adminToken);
  assert.equal(studentCheckin.status,409);
  assert.equal(studentCheckin.error.code,"VOLUNTEER_INELIGIBLE",
   "student role blocks arrival despite a still-approved historical application");
  assert.equal((await db.volunteerShift.findUniqueOrThrow({where:{id:activeShift.id}})).checkedInAt,null);
 }finally{
  await db.user.update({where:{id:member.id},data:{role:member.role}});
 }
 const present=await request("admin/shifts","POST",{
  kind:"update",shiftId:activeShift.id,action:"check-in"
 },adminToken);
 assert.equal(present.status,200,"real active shift can be checked in");
 assert.ok((await db.volunteerShift.findUniqueOrThrow({where:{id:activeShift.id}})).checkedInAt);
 const duplicate=await request("admin/shifts","POST",{
  kind:"update",shiftId:activeShift.id,action:"check-in"
 },adminToken);
 assert.equal(duplicate.status,409,"duplicate check-in is not accepted");
 const complete=await request("admin/shifts","POST",{
  kind:"update",shiftId:activeShift.id,action:"complete"
 },adminToken);
 assert.equal(complete.status,200);
 assert.equal((await db.volunteerShift.findUniqueOrThrow({where:{id:activeShift.id}})).status,"completed");
 const newArrival=new Date(now-5*60000).toISOString();
 const missingReason=await request("admin/shifts","POST",{
  kind:"correct",shiftId:activeShift.id,action:"adjust-arrival",
  checkedInAt:newArrival,reason:""
 },adminToken);
 assert.equal(missingReason.status,422,"attendance corrections require an actual reason");
 const invalidArrival=await request("admin/shifts","POST",{
  kind:"correct",shiftId:activeShift.id,action:"adjust-arrival",
  checkedInAt:new Date(now+90*60000).toISOString(),
  reason:"Incorrect later time reported by coordinator"
 },adminToken);
 assert.equal(invalidArrival.status,422,"attendance cannot be corrected into the future or outside the shift");
 const corrected=await request("admin/shifts","POST",{
  kind:"correct",shiftId:activeShift.id,action:"adjust-arrival",
  checkedInAt:newArrival,reason:"Coordinator confirmed earlier arrival against check-in notes"
 },adminToken);
 assert.equal(corrected.status,200,"completed shift can have a reasoned time-only correction");
 assert.equal((await db.volunteerShift.findUniqueOrThrow({where:{id:activeShift.id}})).checkedInAt?.toISOString(),newArrival);
 const correctionAudit=await db.auditEvent.findFirstOrThrow({where:{
  entity:"VolunteerShift",entityId:activeShift.id,action:"volunteer.shift.adjust-arrival"
 }});
 assert.match(correctionAudit.detail||"",/Coordinator confirmed earlier arrival/);
 assert.equal(JSON.parse(correctionAudit.detail).previousCheckedInAt!==newArrival,true,
  "the audit retains the original timestamp");
 const completedUndo=await request("admin/shifts","POST",{
  kind:"correct",shiftId:activeShift.id,action:"remove-arrival",
  reason:"A completed attendance record needs review before removal"
 },adminToken);
 assert.equal(completedUndo.status,409,"do not silently undo a completed service shift");
 assert.equal(completedUndo.error.code,"COMPLETED_SHIFT");
 const soonShift=await db.volunteerShift.create({data:{
  opportunityId:localOpp.id,applicationId:localApp.id,userId:member.id,
  startAt:new Date(now+8*60000),endAt:new Date(now+60*60000)
 }});
 const soonArrival=await request("admin/shifts","POST",{
  kind:"update",shiftId:soonShift.id,action:"check-in"
 },adminToken);
 assert.equal(soonArrival.status,200,"check-in within 15 minutes of start is permitted");
 const prematureComplete=await request("admin/shifts","POST",{
  kind:"update",shiftId:soonShift.id,action:"complete"
 },adminToken);
 assert.equal(prematureComplete.status,409,"shift cannot be completed before it starts");
 assert.equal(prematureComplete.error.code,"SHIFT_NOT_STARTED");
 const invalidCancel=await request("admin/shifts","POST",{
  kind:"update",shiftId:soonShift.id,action:"cancel"
 },adminToken);
 assert.equal(invalidCancel.status,409,"checked-in shift cannot be silently cancelled");
 assert.equal(invalidCancel.error.code,"CHECKED_IN_SHIFT");
 const removed=await request("admin/shifts","POST",{
  kind:"correct",shiftId:soonShift.id,action:"remove-arrival",
  reason:"Coordinator confirmed the check-in was recorded for the wrong volunteer"
 },adminToken);
 assert.equal(removed.status,200,"staff may correct a mistaken uncompleted check-in with reason");
 const afterRemoval=await db.volunteerShift.findUniqueOrThrow({where:{id:soonShift.id}});
 assert.equal(afterRemoval.checkedInAt,null);
 assert.equal(afterRemoval.status,"scheduled","do not falsely mark a shift cancelled or completed");
 const removedAgain=await request("admin/shifts","POST",{
  kind:"correct",shiftId:soonShift.id,action:"remove-arrival",
  reason:"Repeating an attendance reversal must be rejected"
 },adminToken);
 assert.equal(removedAgain.status,409,"no false duplicate correction");
 assert.equal(removedAgain.error.code,"NO_RECORDED_ARRIVAL");
 const cannotComplete=await request("admin/shifts","POST",{
  kind:"update",shiftId:soonShift.id,action:"complete"
 },adminToken);
 assert.equal(cannotComplete.status,422,"an unrecorded arrival cannot be completed");
 const expiredShift=await db.volunteerShift.create({data:{
  opportunityId:localOpp.id,applicationId:localApp.id,userId:member.id,
  startAt:new Date(now-3*hour),endAt:new Date(now-2*hour)
 }});
 const late=await request("admin/shifts","POST",{
  kind:"update",shiftId:expiredShift.id,action:"check-in"
 },adminToken);
 assert.equal(late.status,409,"shift ended long ago must not allow retroactive arrival");
 assert.equal(late.error.code,"TOO_LATE");
 assert.equal((await db.volunteerShift.findUniqueOrThrow({where:{id:expiredShift.id}})).checkedInAt,null);
 assert.ok(await db.auditEvent.count({where:{
  entity:"VolunteerShift",entityId:activeShift.id,action:"volunteer.shift.check-in"
 }}),"successful arrival has an audit event");
 assert.ok(await db.auditEvent.count({where:{
  entity:"VolunteerShift",entityId:activeShift.id,action:"volunteer.shift.complete"
 }}),"successful completion has an audit event");
 console.log("Verified volunteer application, approval, scheduling, attendance current-role gates, concurrency, safe corrections and audits.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 if(memberSession)await db.authSession.deleteMany({where:{id:memberSession.id}});
 for(const id of opportunities){
  await db.volunteerShift.deleteMany({where:{opportunityId:id}});
  await db.volunteerApplication.deleteMany({where:{opportunityId:id}});
  await db.volunteerOpportunity.deleteMany({where:{id}});
 }
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

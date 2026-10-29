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
let adminSession,foreignOrgId;
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
 const list=await request("admin/shifts","GET",null,adminToken);
 assert.equal(list.status,200);
 assert.ok(!list.data.shifts.some(x=>x.id===foreignShift.id),"foreign volunteer shifts hidden");
 const foreignEdit=await request("admin/shifts","POST",{
  kind:"update",shiftId:foreignShift.id,action:"cancel"
 },adminToken);
 assert.equal(foreignEdit.status,409,"cross-organization shift update denied");
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
 }},"successful arrival has an audit event");
 assert.ok(await db.auditEvent.count({where:{
  entity:"VolunteerShift",entityId:activeShift.id,action:"volunteer.shift.complete"
 }},"successful completion has an audit event");
 console.log("Verified cross-mosque schedule overlap, concurrent last-slot, truthful volunteer check-in and completion windows.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 for(const id of opportunities){
  await db.volunteerShift.deleteMany({where:{opportunityId:id}});
  await db.volunteerApplication.deleteMany({where:{opportunityId:id}});
  await db.volunteerOpportunity.deleteMany({where:{id}});
 }
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

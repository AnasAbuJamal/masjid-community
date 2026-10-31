// One-final-submission safety for F-018, isolated ephemeral PostgreSQL ONLY.
// This script must never operate on staging or production child records.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.endsWith("/masjid_ci"))
 throw Error("Refusing school submission tests outside disposable masjid_ci.");
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function call(path,method="GET",body,token){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
const created={assignmentIds:[],studentUserId:null,studentId:null,enrollmentId:null,extraClassId:null};
try{
 const org=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 assert.ok(org);
 const klass=await db.classSection.findFirst({
  where:{program:{organizationId:org.id}},include:{teachers:true}
 });
 assert.ok(klass?.teachers.length,"CI requires an assigned teacher");
 const adult=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const learner=await db.user.create({data:{
  email:"school-final-"+randomUUID()+"@example.test",role:"student",
  status:"active",firstName:"Synthetic",lastName:"Learner",
  passwordHash:adult.passwordHash,verifiedAt:new Date(),
  memberships:{create:{organizationId:org.id}}
 }});
 created.studentUserId=learner.id;
 const child=await db.student.create({data:{
  organizationId:org.id,userId:learner.id,studentNumber:"school-final-"+randomUUID(),
  firstName:"Synthetic",lastName:"Learner"
 }});
 created.studentId=child.id;
 const enrollment=await db.enrollment.create({data:{
  studentId:child.id,classId:klass.id,status:"active"
 }});
 created.enrollmentId=enrollment.id;
 const teacherId=klass.teachers[0].teacherId;
 const makeAssignment=async({dueAt=new Date(Date.now()+3600_000),published=true,classId=klass.id}={})=>{
  const record=await db.schoolAssignment.create({data:{
   classId,teacherId,title:"Synthetic final submission exercise",
   instructions:"Fictional learning material for CI only.",dueAt,published
  }});
  created.assignmentIds.push(record.id);
  return record;
 };
 const login=await call("auth/login","POST",{email:learner.email,password});
 assert.equal(login.status,200);
 const token=login.data.token;
 assert.equal((await call("schoolwork","POST",{kind:"submission",
  assignmentId:"missing-assignment-id",body:"Synthetic work."})).status,401);
 const ready=await makeAssignment();
 const body="My original synthetic school submission.";
 const payload={kind:"submission",assignmentId:ready.id,body};
 assert.equal((await call("schoolwork","POST",payload,undefined)).status,401);
 const first=await call("schoolwork","POST",payload,token);
 assert.equal(first.status,200,JSON.stringify(first));
 assert.equal(first.data.alreadySubmitted,false);
 assert.ok(first.data.id&&first.data.submittedAt);
 const original=await db.studentSubmission.findUniqueOrThrow({where:{
  assignmentId_studentId:{assignmentId:ready.id,studentId:child.id}
 }});
 assert.equal(original.body,body);
 // An exact retry is allowed but must not alter ID or factual first arrival.
 const repeat=await call("schoolwork","POST",payload,token);
 assert.equal(repeat.status,200);
 assert.equal(repeat.data.alreadySubmitted,true);
 assert.equal(repeat.data.id,original.id);
 assert.equal(repeat.data.submittedAt,new Date(original.submittedAt).toISOString());
 const changed=await call("schoolwork","POST",{...payload,body:"Silently replaced text."},token);
 assert.equal(changed.status,409);
 assert.equal(changed.error.code,"SUBMISSION_FINAL");
 const unchanged=await db.studentSubmission.findUniqueOrThrow({where:{id:original.id}});
 assert.equal(unchanged.body,body);
 assert.equal(unchanged.submittedAt.getTime(),original.submittedAt.getTime());
 // A missed deadline denies new submissions but a successful earlier exact
 // retry remains factually acknowledged even after the due date has passed.
 await db.schoolAssignment.update({where:{id:ready.id},
  data:{dueAt:new Date(Date.now()-3600_000)}});
 assert.equal((await call("schoolwork","POST",payload,token)).data.alreadySubmitted,true);
 const late=await makeAssignment({dueAt:new Date(Date.now()-3600_000)});
 const deniedLate=await call("schoolwork","POST",{kind:"submission",
  assignmentId:late.id,body:"Late synthetic body"},token);
 assert.equal(deniedLate.status,409);
 assert.equal(deniedLate.error.code,"DUE_DATE_PASSED");
 const draft=await makeAssignment({published:false});
 assert.equal((await call("schoolwork","POST",{kind:"submission",
  assignmentId:draft.id,body:"Unpublished synthetic work"},token)).status,404);
 const extraClass=await db.classSection.create({data:{
  programId:klass.programId,name:"Synthetic unassigned class",schedule:"CI fixture"
 }});
 created.extraClassId=extraClass.id;
 const notEnrolled=await makeAssignment({classId:extraClass.id});
 assert.equal((await call("schoolwork","POST",{kind:"submission",
  assignmentId:notEnrolled.id,body:"Not enrolled"},token)).status,403);
 assert.equal(await db.studentSubmission.count({where:{studentId:child.id}}),1,
  "denied requests must never persist a second submission");
 await db.enrollment.update({where:{id:enrollment.id},data:{status:"withdrawn"}});
 assert.equal((await call("schoolwork","POST",payload,token)).status,403,
  "a formerly enrolled student loses even retry access");
 await db.enrollment.update({where:{id:enrollment.id},data:{status:"active"}});
 // Reclassifying this account as an ordinary member must not retain a
 // student's past write permission just because the link still exists.
 await db.user.update({where:{id:learner.id},data:{role:"member"}});
 assert.equal((await call("schoolwork","POST",payload,token)).status,403);
 await db.user.update({where:{id:learner.id},data:{role:"student"}});
 // Two concurrent first sends cannot overwrite one another. One may be
 // explicitly retryable; every eventual replay returns the same original.
 const raceAssignment=await makeAssignment();
 const race={kind:"submission",assignmentId:raceAssignment.id,body:"Concurrent identical first text."};
 const racing=await Promise.all([call("schoolwork","POST",race,token),call("schoolwork","POST",race,token)]);
 assert.ok(racing.every(x=>[200,409].includes(x.status)),JSON.stringify(racing));
 assert.ok(racing.some(x=>x.status===200),"one concurrent send must win");
 assert.equal(await db.studentSubmission.count({where:{
  assignmentId:raceAssignment.id,studentId:child.id
 }}),1,"database unique key persists exactly one final submission");
 const replay=await call("schoolwork","POST",race,token);
 assert.equal(replay.status,200);
 assert.equal(replay.data.alreadySubmitted,true);
 const allAudit=await db.auditEvent.findMany({where:{
  action:"school.submission.create",entity:"StudentSubmission",
  entityId:{in:[original.id,replay.data.id]}
 }});
 assert.equal(allAudit.length,2,"exactly one atomic event per original submission");
 assert.ok(!allAudit.some(x=>x.detail?.includes(body)||x.detail?.includes(race.body)),
  "no student narrative appears in audit detail");
 console.log("Verified final, immutable own submission, idempotent retry, live enrollment/role, deadline, concurrency and privacy audit.");
}finally{
 if(created.assignmentIds.length){
  await db.auditEvent.deleteMany({where:{
   action:"school.submission.create",entity:"StudentSubmission",
   entityId:{in:(await db.studentSubmission.findMany({where:{
    assignmentId:{in:created.assignmentIds}
   },select:{id:true}})).map(x=>x.id)}
  }});
  await db.studentSubmission.deleteMany({where:{assignmentId:{in:created.assignmentIds}}});
  await db.schoolAssignment.deleteMany({where:{id:{in:created.assignmentIds}}});
 }
 if(created.enrollmentId)await db.enrollment.deleteMany({where:{id:created.enrollmentId}});
 if(created.extraClassId)await db.classSection.deleteMany({where:{id:created.extraClassId}});
 if(created.studentId)await db.student.deleteMany({where:{id:created.studentId}});
 if(created.studentUserId){
  await db.authSession.deleteMany({where:{userId:created.studentUserId}});
  await db.organizationMembership.deleteMany({where:{userId:created.studentUserId}});
  await db.user.deleteMany({where:{id:created.studentUserId}});
 }
 await db.$disconnect();
}

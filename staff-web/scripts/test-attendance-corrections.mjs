// Versioned classroom attendance and human-audited corrections, synthetic data only.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Class attendance tests require isolated masjid_ci PostgreSQL.");
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
const sessionIds=[];
try {
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const teacher=await db.user.findFirst({where:{role:"teacher",status:"active",verifiedAt:{not:null},
  memberships:{some:{organizationId:org.id,status:"active"}}}});
 assert.ok(teacher);
 const klass=await db.classSection.findFirst({where:{
  program:{organizationId:org.id},teachers:{some:{teacherId:teacher.id}}
 }});
 assert.ok(klass);
 const enrollment=await db.enrollment.findFirst({where:{classId:klass.id,status:"active"}});
 assert.ok(enrollment);
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 const teacherLogin=await request("auth/login","POST",{email:teacher.email,password});
 assert.equal(memberLogin.status,200);assert.equal(teacherLogin.status,200);
 const memberToken=memberLogin.data.token,teacherToken=teacherLogin.data.token;
 const startsAt=new Date(Date.now()-5*60000);
 const session=await db.classSession.create({data:{classId:klass.id,startsAt}});
 sessionIds.push(session.id);
 const first={kind:"attendance",sessionId:session.id,studentId:enrollment.studentId,status:"present"};
 assert.equal((await request("actions","POST",first)).status,401,"guest cannot mark student attendance");
 assert.equal((await request("actions","POST",first,memberToken)).status,403,"member cannot mark private school attendance");
 const original=await request("actions","POST",first,teacherToken);
 assert.equal(original.status,201,"assigned teacher may create factual first mark in current window");
 assert.equal(original.data.status,"present");
 assert.equal(original.data.revision,1);
 assert.equal(original.data.created,true);
 const row=await db.attendance.findUniqueOrThrow({where:{id:original.data.id}});
 assert.ok(row.markedAt instanceof Date,"server captures initial mark timestamp");
 assert.equal(row.correctedAt,null);
 const retry=await request("actions","POST",first,teacherToken);
 assert.equal(retry.status,200,"retry is idempotent, never creates another attendance mark");
 assert.equal(retry.data.revision,1);
 assert.equal(retry.data.created,false);
 assert.equal(await db.auditEvent.count({where:{
  entity:"Attendance",entityId:row.id,action:"attendance.mark"
 }}),1,"idempotent retry cannot emit duplicate audit mark");
 const silent=await request("actions","POST",{...first,status:"absent"},teacherToken);
 assert.equal(silent.status,409,"old client cannot overwrite status silently");
 assert.equal(silent.error.code,"CORRECTION_REQUIRED");
 assert.equal((await db.attendance.findUniqueOrThrow({where:{id:row.id}})).status,"present");
 const unreasoned=await request("actions","POST",{
  kind:"attendance-correction",sessionId:session.id,studentId:enrollment.studentId,
  status:"absent",expectedRevision:1
 },teacherToken);
 assert.equal(unreasoned.status,422,"correction requires a useful reason");
 const stale=await request("actions","POST",{
  kind:"attendance-correction",sessionId:session.id,studentId:enrollment.studentId,
  status:"absent",expectedRevision:2,reason:"An attendance record was checked against the sign-in roster."
 },teacherToken);
 assert.equal(stale.status,409);
 assert.equal(stale.error.code,"ATTENDANCE_STALE");
 const corrected=await request("actions","POST",{
  kind:"attendance-correction",sessionId:session.id,studentId:enrollment.studentId,
  status:"absent",expectedRevision:1,
  reason:"The host confirmed this learner was absent during roll call."
 },teacherToken);
 assert.equal(corrected.status,200);
 assert.equal(corrected.data.status,"absent");
 assert.equal(corrected.data.revision,2);
 const revised=await db.attendance.findUniqueOrThrow({where:{id:row.id}});
 assert.equal(revised.revision,2);
 assert.equal(revised.status,"absent");
 assert.equal(revised.markedAt?.toISOString(),row.markedAt?.toISOString(),
  "original-mark time is immutable across a correction");
 assert.equal(revised.correctedById,teacher.id);
 assert.ok(revised.correctedAt instanceof Date);
 assert.equal(revised.correctionReason,"The host confirmed this learner was absent during roll call.");
 const revisionJournal=await db.auditEvent.findFirst({where:{
  entity:"Attendance",entityId:row.id,action:"attendance.correct"
 }});
 assert.ok(revisionJournal);
 const change=JSON.parse(revisionJournal.detail);
 assert.equal(change.previous,"present");
 assert.equal(change.updated,"absent");
 assert.equal(change.revision,2);
 assert.equal(change.organizationId,org.id);
 const noOp=await request("actions","POST",{
  kind:"attendance-correction",sessionId:session.id,studentId:enrollment.studentId,
  status:"absent",expectedRevision:2,reason:"Repeating the same status should not create a correction."
 },teacherToken);
 assert.equal(noOp.status,409);
 assert.equal(noOp.error.code,"SAME_STATUS");
 const competing=[
  {kind:"attendance-correction",sessionId:session.id,studentId:enrollment.studentId,
   status:"late",expectedRevision:2,reason:"The teacher rechecked arrival time with the sign-in sheet."},
  {kind:"attendance-correction",sessionId:session.id,studentId:enrollment.studentId,
   status:"excused",expectedRevision:2,reason:"The family notified the office of an excused absence."}
 ];
 const concurrent=await Promise.all(competing.map(body=>request("actions","POST",body,teacherToken)));
 assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409],
  "racing teachers cannot both overwrite a single revision");
 assert.equal((await db.attendance.findUniqueOrThrow({where:{id:row.id}})).revision,3);
 const readTeacher=await request("teacher","GET",undefined,teacherToken);
 assert.equal(readTeacher.status,200);
 const lesson=readTeacher.data.classes.find(c=>c.id===klass.id)?.sessions.find(s=>s.id===session.id);
 assert.ok(lesson,"assigned teacher can see current class session");
 assert.equal(lesson.attendance.find(a=>a.studentId===enrollment.studentId)?.revision,3);
 const future=await db.classSession.create({data:{
  classId:klass.id,startsAt:new Date(Date.now()+86400000)
 }});
 sessionIds.push(future.id);
 const futureMark=await request("actions","POST",{
  kind:"attendance",sessionId:future.id,studentId:enrollment.studentId,status:"present"
 },teacherToken);
 assert.equal(futureMark.status,409,"cannot pre-mark attendance a day early");
 assert.equal(futureMark.error.code,"ATTENDANCE_WINDOW");
 const lateSession=await db.classSession.create({data:{
  classId:klass.id,startsAt:new Date(Date.now()-8*3600000)
 }});
 sessionIds.push(lateSession.id);
 const retroMark=await request("actions","POST",{
  kind:"attendance",sessionId:lateSession.id,studentId:enrollment.studentId,status:"present"
 },teacherToken);
 assert.equal(retroMark.status,409,"first mark after 4-hour session window denied");
 assert.equal(retroMark.error.code,"ATTENDANCE_WINDOW");
 const legacy=await db.attendance.create({data:{
  sessionId:lateSession.id,studentId:enrollment.studentId,
  markedById:teacher.id,status:"present"
 }});
 assert.equal(legacy.markedAt,null,"legacy records must not get invented mark times");
 const governedCorrection=await request("actions","POST",{
  kind:"attendance-correction",sessionId:lateSession.id,studentId:enrollment.studentId,
  status:"excused",expectedRevision:1,
  reason:"Records clerk reviewed the original session sheet from the morning."
 },teacherToken);
 assert.equal(governedCorrection.status,200,"reasoned correction allowed within 24-hour window");
 assert.equal((await db.attendance.findUniqueOrThrow({where:{id:legacy.id}})).revision,2);
 const expired=await db.classSession.create({data:{
  classId:klass.id,startsAt:new Date(Date.now()-27*3600000)
 }});
 sessionIds.push(expired.id);
 await db.attendance.create({data:{
  sessionId:expired.id,studentId:enrollment.studentId,markedById:teacher.id,status:"present"
 }});
 const outdated=await request("actions","POST",{
  kind:"attendance-correction",sessionId:expired.id,studentId:enrollment.studentId,
  status:"absent",expectedRevision:1,reason:"Teacher wishes to change yesterday's locked register."
 },teacherToken);
 assert.equal(outdated.status,409,"old attendance needs a separately governed review");
 assert.equal(outdated.error.code,"ATTENDANCE_WINDOW");
 assert.equal(await db.auditEvent.count({where:{
  entity:"Attendance",entityId:row.id,action:"attendance.correct"
 }}),2,"only successful reasoned corrections are logged");
 console.log("Verified current-session attendance, original timestamp, honest revisions, reasons, concurrency and time gates.");
}finally {
 if(sessionIds.length){
  await db.attendance.deleteMany({where:{sessionId:{in:sessionIds}}});
  await db.classSession.deleteMany({where:{id:{in:sessionIds}}});
 }
 await db.$disconnect();
}

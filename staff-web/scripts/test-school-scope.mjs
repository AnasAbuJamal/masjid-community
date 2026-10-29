// Organization boundary regression for teacher attendance and learning; disposable CI database only.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||!process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing school scope tests outside isolated CI.");
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",payload,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(payload?{"Content-Type":"application/json"}:{})
 },body:payload?JSON.stringify(payload):undefined});
 return {status:response.status,...await response.json()};
}
let foreignOrg,foreignProgram,foreignClass,foreignStudent;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const teacher=await db.user.findFirst({where:{role:"teacher",memberships:{some:{organizationId:org.id,status:"active"}}}});
 const member=await db.user.findUnique({where:{email:memberEmail}});
 assert.ok(teacher&&member);
 const localClass=await db.classSection.findFirst({where:{program:{organizationId:org.id},teachers:{some:{teacherId:teacher.id}}}});
 assert.ok(localClass);
 const localSession=await db.classSession.findFirst({where:{classId:localClass.id}});
 const localEnrollment=await db.enrollment.findFirst({where:{classId:localClass.id,status:"active"}});
 assert.ok(localSession&&localEnrollment);
 const teacherLogin=await request("auth/login","POST",{email:teacher.email,password});
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(teacherLogin.status,200);
 assert.equal(memberLogin.status,200);
 const teacherToken=teacherLogin.data.token,memberToken=memberLogin.data.token;
 assert.equal((await request("teacher")).status,401,"guest cannot read teacher rosters");
 assert.equal((await request("teacher","GET",null,memberToken)).status,403,"member cannot read teacher rosters");

 foreignOrg=await db.organization.create({data:{slug:"school-scope-"+Date.now(),name:"Unrelated school"}});
 foreignProgram=await db.schoolProgram.create({data:{organizationId:foreignOrg.id,title:"Foreign private program",description:"CI only",published:false}});
 foreignClass=await db.classSection.create({data:{programId:foreignProgram.id,name:"Foreign private class",schedule:"CI only"}});
 foreignStudent=await db.student.create({data:{studentNumber:"foreign-school-"+Date.now(),firstName:"Foreign",lastName:"Child"}});
 await db.teacherAssignment.create({data:{teacherId:teacher.id,classId:foreignClass.id}});
 await db.enrollment.create({data:{studentId:foreignStudent.id,classId:foreignClass.id}});
 await db.guardianLink.create({data:{guardianId:member.id,studentId:foreignStudent.id,approvedAt:new Date()}});
 const foreignSession=await db.classSession.create({data:{classId:foreignClass.id,startsAt:new Date(Date.now()+86400000)}});
 await db.attendance.create({data:{sessionId:foreignSession.id,studentId:foreignStudent.id,markedById:teacher.id,status:"present"}});
 const foreignInvoice=await db.schoolInvoice.create({data:{organizationId:foreignOrg.id,studentId:foreignStudent.id,
  payerGuardianId:member.id,description:"Foreign private tuition",amountMinor:4400,dueAt:new Date(Date.now()+86400000)}});
 const foreignAssignment=await db.schoolAssignment.create({data:{classId:foreignClass.id,teacherId:teacher.id,
  title:"Foreign private work",instructions:"Private instructions for a foreign school.",dueAt:new Date(Date.now()+86400000),published:true}});
 const foreignReport=await db.studentReport.create({data:{classId:foreignClass.id,studentId:foreignStudent.id,teacherId:teacher.id,
  summary:"Confidential foreign student report.",status:"published",publishedAt:new Date()}});
 const foreignSubmission=await db.studentSubmission.create({data:{assignmentId:foreignAssignment.id,studentId:foreignStudent.id,body:"Private foreign submission."}});

 const students=await request("students","GET",null,memberToken);
 assert.equal(students.status,200);
 assert.ok(students.data.children.some(c=>c.id===localEnrollment.studentId),"approved local child remains visible");
 assert.ok(!students.data.children.some(c=>c.id===foreignStudent.id),"foreign guardian link cannot expose student identity or attendance");
 const teacherStudents=await request("students","GET",null,teacherToken);
 assert.equal(teacherStudents.status,200);
 assert.ok(teacherStudents.data.teaching.some(c=>c.id===localClass.id),"local teacher roster remains visible");
 assert.ok(!teacherStudents.data.teaching.some(c=>c.id===foreignClass.id),"foreign class hidden from student summary");
 const overview=await request("me","GET",null,memberToken);
 assert.equal(overview.status,200);
 assert.ok(overview.data.children.some(c=>c.student.id===localEnrollment.studentId));
 assert.ok(!overview.data.children.some(c=>c.student.id===foreignStudent.id),"foreign child hidden from member summary");
 const teacherOverview=await request("me","GET",null,teacherToken);
 assert.equal(teacherOverview.status,200);
 assert.ok(!teacherOverview.data.classes.some(c=>c.classSection.id===foreignClass.id),"foreign class hidden from teacher summary");
 const invoices=await request("invoices","GET",null,memberToken);
 assert.equal(invoices.status,200);
 assert.ok(invoices.data.invoices.some(i=>i.studentId===localEnrollment.studentId),"local tuition remains visible");
 assert.ok(!invoices.data.invoices.some(i=>i.id===foreignInvoice.id),"foreign tuition remains private despite approved guardian link");

 const roster=await request("teacher","GET",null,teacherToken);
 assert.equal(roster.status,200);
 assert.ok(roster.data.classes.some(c=>c.id===localClass.id),"assigned home-organization class remains visible");
 assert.ok(!roster.data.classes.some(c=>c.id===foreignClass.id),"foreign teacher assignment does not authorize roster disclosure");
 const learning=await request("schoolwork","GET",null,teacherToken);
 assert.equal(learning.status,200);
 assert.ok(learning.data.classes.some(c=>c.id===localClass.id));
 assert.ok(!learning.data.classes.some(c=>c.id===foreignClass.id),"foreign class learning data is not disclosed");
 const family=await request("schoolwork","GET",null,memberToken);
 assert.equal(family.status,200);
 assert.ok(!family.data.assignments.some(a=>a.id===foreignAssignment.id),"foreign class work stays outside member organization");
 assert.ok(!family.data.reports.some(r=>r.id===foreignReport.id),"foreign guardian-linked reports are not leaked");
 assert.ok(!family.data.submissions.some(s=>s.id===foreignSubmission.id),"foreign submissions are not leaked");

 const localMark=await request("actions","POST",{kind:"attendance",sessionId:localSession.id,
  studentId:localEnrollment.studentId,status:"present"},teacherToken);
 assert.equal(localMark.status,200,"assigned local teacher can mark own class");
 const foreignMark=await request("actions","POST",{kind:"attendance",sessionId:foreignSession.id,
  studentId:foreignStudent.id,status:"present"},teacherToken);
 assert.equal(foreignMark.status,403,"foreign session denied even with a teacher assignment");
 const foreignStudentMark=await request("actions","POST",{kind:"attendance",sessionId:localSession.id,
  studentId:foreignStudent.id,status:"present"},teacherToken);
 assert.equal(foreignStudentMark.status,404,"unrelated student cannot be marked in local class");
 assert.equal(await db.attendance.count({where:{sessionId:foreignSession.id}}),1,"denied attendance did not change the existing foreign mark");
 const foreignWrite=await request("schoolwork","POST",{kind:"assignment",classId:foreignClass.id,
  title:"Should be denied",instructions:"Unauthorized private learning material.",dueAt:new Date(Date.now()+86400000).toISOString(),
  published:true},teacherToken);
 assert.equal(foreignWrite.status,403,"foreign class assignment denied");
 const foreignReportWrite=await request("schoolwork","POST",{kind:"report",classId:foreignClass.id,
  studentId:foreignStudent.id,summary:"Should not be written to a foreign school.",published:true},teacherToken);
 assert.equal(foreignReportWrite.status,403,"foreign student report denied");
 assert.equal(await db.schoolAssignment.count({where:{classId:foreignClass.id}}),1,"denied assignment not persisted");
 assert.equal(await db.studentReport.count({where:{classId:foreignClass.id}}),1,"denied report not persisted");
 // A custody revocation must immediately remove every family summary and invoice view.
 const localLink=await db.guardianLink.findUniqueOrThrow({where:{guardianId_studentId:{guardianId:member.id,studentId:localEnrollment.studentId}}});
 try{
  await db.guardianLink.update({where:{id:localLink.id},data:{revokedAt:new Date()}});
  const revokedStudents=await request("students","GET",null,memberToken);
  const revokedOverview=await request("me","GET",null,memberToken);
  const revokedInvoices=await request("invoices","GET",null,memberToken);
  assert.equal(revokedStudents.status,200);
  assert.equal(revokedOverview.status,200);
  assert.equal(revokedInvoices.status,200);
  assert.ok(!revokedStudents.data.children.some(c=>c.id===localEnrollment.studentId));
  assert.ok(!revokedOverview.data.children.some(c=>c.student.id===localEnrollment.studentId));
  assert.ok(!revokedInvoices.data.invoices.some(i=>i.studentId===localEnrollment.studentId));
 }finally{
  await db.guardianLink.update({where:{id:localLink.id},data:{revokedAt:localLink.revokedAt}});
 }
 console.log("Verified organization-scoped school summaries, invoices, custody revocation, teacher rosters and learning writes.");
}finally{
 if(foreignClass){
  await db.schoolInvoice.deleteMany({where:{organizationId:foreignOrg.id}});
  await db.studentSubmission.deleteMany({where:{assignment:{classId:foreignClass.id}}});
  await db.studentReport.deleteMany({where:{classId:foreignClass.id}});
  await db.schoolAssignment.deleteMany({where:{classId:foreignClass.id}});
  await db.attendance.deleteMany({where:{session:{classId:foreignClass.id}}});
  await db.classSession.deleteMany({where:{classId:foreignClass.id}});
  await db.enrollment.deleteMany({where:{classId:foreignClass.id}});
  await db.teacherAssignment.deleteMany({where:{classId:foreignClass.id}});
  await db.classSection.delete({where:{id:foreignClass.id}});
 }
 if(foreignStudent){
  await db.guardianLink.deleteMany({where:{studentId:foreignStudent.id}});
  await db.student.delete({where:{id:foreignStudent.id}});
 }
 if(foreignProgram)await db.schoolProgram.delete({where:{id:foreignProgram.id}});
 if(foreignOrg)await db.organization.delete({where:{id:foreignOrg.id}});
 await db.$disconnect();
}

// Organization boundary regression for teacher attendance and learning; disposable CI database only.
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||!process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing school scope tests outside isolated CI.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",payload,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(payload?{"Content-Type":"application/json"}:{})
 },body:payload?JSON.stringify(payload):undefined});
 return {status:response.status,...await response.json()};
}
let foreignOrg,foreignProgram,foreignClass,foreignStudent,foreignTeacher,foreignApplication,schoolAdminSession,newLocalStudentId,localAcknowledgedApplicationId,currentTestSessionId;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const teacher=await db.user.findFirst({where:{role:"teacher",memberships:{some:{organizationId:org.id,status:"active"}}}});
 const member=await db.user.findUnique({where:{email:memberEmail}});
 const admin=await db.user.findUnique({where:{email:adminEmail}});
 assert.ok(teacher&&member&&admin);
 // Authorization fixture only: test-auth.mjs already tested real MFA/OTP, while
 // this CI-scoped session isolates subsequent row-level authorization checks.
 const adminToken=randomBytes(32).toString("base64url");
 schoolAdminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 const localClass=await db.classSection.findFirst({where:{program:{organizationId:org.id},teachers:{some:{teacherId:teacher.id}}}});
 assert.ok(localClass);
 const localSession=await db.classSession.create({data:{
  classId:localClass.id,startsAt:new Date(Date.now()-5*60000)
 }});
 currentTestSessionId=localSession.id;
 const localEnrollment=await db.enrollment.findFirst({where:{classId:localClass.id,status:"active"}});
 assert.ok(localSession&&localEnrollment);
 const teacherLogin=await request("auth/login","POST",{email:teacher.email,password});
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(teacherLogin.status,200);
 assert.equal(memberLogin.status,200);
 const teacherToken=teacherLogin.data.token,memberToken=memberLogin.data.token;
 assert.equal((await request("teacher")).status,401,"guest cannot read teacher rosters");
 assert.equal((await request("teacher","GET",null,memberToken)).status,403,"member cannot read teacher rosters");
 const applicantFields={programId:localClass.programId,studentFirstName:"Acknowledgement",studentLastName:"Fixture"};
 const missingAcknowledgement=await request("enrollment","POST",applicantFields,memberToken);
 assert.equal(missingAcknowledgement.status,422,"child applications require applicant acknowledgement");
 const explicitlyFalse=await request("enrollment","POST",{...applicantFields,reviewAcknowledged:false},memberToken);
 assert.equal(explicitlyFalse.status,422,"false acknowledgement cannot be accepted");
 assert.equal(await db.enrollmentApplication.count({where:{
  programId:localClass.programId,applicantUserId:member.id,
  studentFirstName:applicantFields.studentFirstName
 }}),0,"rejected acknowledgement does not persist child information");
 const acknowledged=await request("enrollment","POST",{...applicantFields,reviewAcknowledged:true},memberToken);
 assert.equal(acknowledged.status,201,"verified adult can submit acknowledged application");
 localAcknowledgedApplicationId=acknowledged.data.id;
 const storedAcknowledgement=await db.enrollmentApplication.findUniqueOrThrow({where:{id:localAcknowledgedApplicationId}});
 assert.ok(storedAcknowledgement.reviewAcknowledgedAt instanceof Date,"server timestamp is stored");
 assert.equal(storedAcknowledgement.reviewAcknowledgementVersion,"guardian-review-v1");
 assert.equal(storedAcknowledgement.status,"submitted","acknowledgement does not approve guardianship");
 const oldApplication=await db.enrollmentApplication.findFirst({where:{
  applicantUserId:member.id,organizationId:org.id,reviewAcknowledgedAt:null,status:"submitted"
 }});
 assert.ok(oldApplication,"CI provides a legacy application without an acknowledgement");
 const oldApproval=await request("admin/enrollment","PATCH",{
  id:oldApplication.id,decision:"approved",reason:"Synthetic independent evidence checked",
  relationshipVerified:true
 },adminToken);
 assert.equal(oldApproval.status,409,"legacy unacknowledged application cannot be approved");
 assert.equal(oldApproval.error.code,"ACKNOWLEDGEMENT_REQUIRED");
 assert.equal((await db.enrollmentApplication.findUniqueOrThrow({where:{id:oldApplication.id}})).status,"submitted");

 foreignOrg=await db.organization.create({data:{slug:"school-scope-"+Date.now(),name:"Unrelated school"}});
 foreignTeacher=await db.user.create({data:{email:"foreign-school-teacher-"+Date.now()+"@example.test",
  firstName:"Foreign",lastName:"Teacher",role:"teacher",status:"active",verifiedAt:new Date(),
  passwordHash:teacher.passwordHash,memberships:{create:{organizationId:foreignOrg.id}}}});
 foreignProgram=await db.schoolProgram.create({data:{organizationId:foreignOrg.id,title:"Foreign private program",description:"CI only",published:true}});
 foreignClass=await db.classSection.create({data:{programId:foreignProgram.id,name:"Foreign private class",schedule:"CI only"}});
 foreignStudent=await db.student.create({data:{organizationId:foreignOrg.id,studentNumber:"foreign-school-"+Date.now(),firstName:"Foreign",lastName:"Child"}});
 await db.teacherAssignment.create({data:{teacherId:teacher.id,classId:foreignClass.id}});
 await db.enrollment.create({data:{studentId:foreignStudent.id,classId:foreignClass.id}});
 await db.guardianLink.create({data:{guardianId:member.id,studentId:foreignStudent.id,approvedAt:new Date()}});
 foreignApplication=await db.enrollmentApplication.create({data:{organizationId:foreignOrg.id,programId:foreignProgram.id,
  applicantUserId:member.id,studentFirstName:"Foreign",studentLastName:"Applicant"}});
 const foreignSession=await db.classSession.create({data:{classId:foreignClass.id,startsAt:new Date(Date.now()+86400000)}});
 await db.attendance.create({data:{sessionId:foreignSession.id,studentId:foreignStudent.id,markedById:teacher.id,status:"present"}});
 const foreignInvoice=await db.schoolInvoice.create({data:{organizationId:foreignOrg.id,studentId:foreignStudent.id,
  payerGuardianId:member.id,description:"Foreign private tuition",amountMinor:4400,dueAt:new Date(Date.now()+86400000)}});
 const foreignAssignment=await db.schoolAssignment.create({data:{classId:foreignClass.id,teacherId:teacher.id,
  title:"Foreign private work",instructions:"Private instructions for a foreign school.",dueAt:new Date(Date.now()+86400000),published:true}});
 const foreignReport=await db.studentReport.create({data:{classId:foreignClass.id,studentId:foreignStudent.id,teacherId:teacher.id,
  summary:"Confidential foreign student report.",status:"published",publishedAt:new Date()}});
 const foreignSubmission=await db.studentSubmission.create({data:{assignmentId:foreignAssignment.id,studentId:foreignStudent.id,body:"Private foreign submission."}});

 // The administrator must never see or manipulate foreign school records
 // merely because an attacker knows a student, class, session, user or invoice ID.
 const adminList=await request("admin/school","GET",null,adminToken);
 assert.equal(adminList.status,200,"MFA-approved administrator may inspect school records");
 assert.ok(adminList.data.students.some(s=>s.id===localEnrollment.studentId),"legacy local student with enrollment remains visible");
 assert.ok(!adminList.data.students.some(s=>s.id===foreignStudent.id),"foreign student identity is not in admin list");
 assert.ok(!adminList.data.sessions.some(s=>s.id===foreignSession.id),"foreign class session is not listed");
 assert.ok(!adminList.data.programs.some(p=>p.id===foreignProgram.id),"foreign program is not listed");
 assert.ok(!adminList.data.users.some(u=>u.id===foreignTeacher.id),"staff selector excludes another organization's users");
 const linkForeignStudent=await request("admin/school","POST",{kind:"guardian-link",studentId:foreignStudent.id,guardianId:member.id},adminToken);
 assert.equal(linkForeignStudent.status,404,"admin cannot link home guardian to foreign child");
 const enrollForeignStudent=await request("admin/school","POST",{kind:"enrollment",classId:localClass.id,studentId:foreignStudent.id},adminToken);
 assert.equal(enrollForeignStudent.status,404,"admin cannot import foreign child by identifier");
 const foreignClassSession=await request("admin/school","POST",{kind:"class-session",classId:foreignClass.id,startsAt:new Date(Date.now()+86400000).toISOString()},adminToken);
 assert.equal(foreignClassSession.status,404,"admin cannot schedule another school's class");
 const foreignTeacherAssignment=await request("admin/school","POST",{kind:"teacher-assignment",classId:localClass.id,teacherId:foreignTeacher.id},adminToken);
 assert.equal(foreignTeacherAssignment.status,422,"teacher without this mosque's active membership denied");
 const foreignGuardianLink=await request("admin/school","POST",{kind:"guardian-link",studentId:localEnrollment.studentId,guardianId:foreignTeacher.id},adminToken);
 assert.equal(foreignGuardianLink.status,422,"guardian without this mosque's active membership denied");
 const foreignIssue=await request("admin/invoices","POST",{studentId:foreignStudent.id,payerGuardianId:member.id,
  description:"Must not issue foreign tuition",amountMinor:2200,dueAt:new Date(Date.now()+86400000).toISOString()},adminToken);
 assert.equal(foreignIssue.status,403,"admin cannot issue an invoice for a foreign child");
 const foreignVoid=await request("admin/invoices","PATCH",{id:foreignInvoice.id},adminToken);
 assert.equal(foreignVoid.status,409,"admin cannot void another organization's invoice");
 assert.equal((await db.schoolInvoice.findUniqueOrThrow({where:{id:foreignInvoice.id}})).status,"pending","foreign invoice remains unchanged");
 assert.equal(await db.guardianLink.count({where:{guardianId:member.id,studentId:foreignStudent.id}}),1,"denied guardian link did not change the fixture");
 assert.equal(await db.enrollment.count({where:{classId:localClass.id,studentId:foreignStudent.id}}),0,"no foreign child enrollment created");
 assert.equal(await db.teacherAssignment.count({where:{classId:localClass.id,teacherId:foreignTeacher.id}}),0,"no unauthorized staff assignment created");
 const foreignApplicationAttempt=await request("enrollment","POST",{
  programId:foreignProgram.id,studentFirstName:"Cross",studentLastName:"Organization",reviewAcknowledged:true
 },memberToken);
 assert.equal(foreignApplicationAttempt.status,404,"member cannot submit an application to a published foreign program");
 const applications=await request("enrollment","GET",null,memberToken);
 assert.equal(applications.status,200);
 assert.ok(!applications.data.applications.some(x=>x.id===foreignApplication.id),"foreign application excluded from member history");
 const foreignCheckout=await request("invoices/checkout","POST",{invoiceId:foreignInvoice.id},memberToken);
 assert.equal(foreignCheckout.status,404,"foreign invoice cannot reach the payment provider");
 const newLocalStudent=await request("admin/school","POST",{
  kind:"student",studentNumber:"owned-school-"+Date.now(),firstName:"Local",lastName:"Learner"
 },adminToken);
 assert.equal(newLocalStudent.status,201,"registered student is assigned to current mosque");
 newLocalStudentId=newLocalStudent.data.id;
 assert.equal((await db.student.findUniqueOrThrow({where:{id:newLocalStudentId}})).organizationId,org.id);
 const afterRegister=await request("admin/school","GET",null,adminToken);
 assert.equal(afterRegister.status,200);
 assert.ok(afterRegister.data.students.some(s=>s.id===newLocalStudentId),"newly registered owned student is available to school staff");

 // Synthetic bad legacy link: even if a foreign-owned student is enrolled
 // into a local class directly in the database, family and staff APIs deny it.
 await db.enrollment.create({data:{studentId:foreignStudent.id,classId:localClass.id,status:"active"}});
 const adminAfterMalformedEnrollment=await request("admin/school","GET",null,adminToken);
 assert.equal(adminAfterMalformedEnrollment.status,200);
 assert.ok(!adminAfterMalformedEnrollment.data.students.some(s=>s.id===foreignStudent.id),
  "a forged local enrollment cannot override explicit foreign child ownership");
 const crossOwnerReport=await request("schoolwork","POST",{
  kind:"report",classId:localClass.id,studentId:foreignStudent.id,
  summary:"Must not publish foreign student progress.",published:true
 },teacherToken);
 assert.equal(crossOwnerReport.status,404,"teacher cannot report on a foreign-owned child in a local class");
 const students=await request("students","GET",null,memberToken);
 assert.equal(students.status,200);
 assert.ok(students.data.children.some(c=>c.id===localEnrollment.studentId),"approved local child remains visible");
 assert.ok(!students.data.children.some(c=>c.id===foreignStudent.id),"foreign guardian link cannot expose student identity or attendance");
 const teacherStudents=await request("students","GET",null,teacherToken);
 assert.equal(teacherStudents.status,200);
 assert.ok(teacherStudents.data.teaching.some(c=>c.id===localClass.id),"local teacher roster remains visible");
 assert.ok(!teacherStudents.data.teaching.some(c=>c.id===foreignClass.id),"foreign class hidden from student summary");
 const localTeacherRoster=teacherStudents.data.teaching.find(c=>c.id===localClass.id);
 assert.ok(localTeacherRoster);
 assert.ok(!localTeacherRoster.enrollments.some(e=>e.student.id===foreignStudent.id),
  "forged cross-organization enrollment cannot expose foreign child through teacher roster");
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
 const localRoster=roster.data.classes.find(c=>c.id===localClass.id);
 assert.ok(localRoster&&!localRoster.enrollments.some(e=>e.student.id===foreignStudent.id),
  "dedicated teacher API excludes foreign-owned child even with bad enrollment");
 const learning=await request("schoolwork","GET",null,teacherToken);
 assert.equal(learning.status,200);
 assert.ok(learning.data.classes.some(c=>c.id===localClass.id));
 assert.ok(!learning.data.classes.some(c=>c.id===foreignClass.id),"foreign class learning data is not disclosed");
 assert.ok(!learning.data.classes.find(c=>c.id===localClass.id)?.enrollments.some(e=>e.student.id===foreignStudent.id),
  "teacher learning rosters exclude foreign-owned child");
 const family=await request("schoolwork","GET",null,memberToken);
 assert.equal(family.status,200);
 assert.ok(!family.data.assignments.some(a=>a.id===foreignAssignment.id),"foreign class work stays outside member organization");
 assert.ok(!family.data.reports.some(r=>r.id===foreignReport.id),"foreign guardian-linked reports are not leaked");
 assert.ok(!family.data.submissions.some(s=>s.id===foreignSubmission.id),"foreign submissions are not leaked");

 const localMark=await request("actions","POST",{kind:"attendance",sessionId:localSession.id,
  studentId:localEnrollment.studentId,status:"present"},teacherToken);
 assert.equal(localMark.status,201,"assigned local teacher can record a factual mark in the session window");
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
  const restoreAttempt=await request("admin/school","POST",{kind:"guardian-link",
   studentId:localEnrollment.studentId,guardianId:member.id},adminToken);
  assert.equal(restoreAttempt.status,409,"school administrator cannot reactivate a revoked guardian without separate safeguarding review");
  assert.equal(restoreAttempt.error.code,"GUARDIAN_REVOKED");
  assert.ok((await db.guardianLink.findUniqueOrThrow({where:{id:localLink.id}})).revokedAt,
   "denied guardian restoration leaves the revocation in force");
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
 console.log("Verified organization-scoped school admin and finance writes, child ownership, legacy isolation, custody revocation and teacher rosters.");
 }finally{
 if(currentTestSessionId){
  await db.attendance.deleteMany({where:{sessionId:currentTestSessionId}});
  await db.classSession.deleteMany({where:{id:currentTestSessionId}});
 }
 if(localAcknowledgedApplicationId)await db.enrollmentApplication.deleteMany({where:{id:localAcknowledgedApplicationId}});
 if(schoolAdminSession)await db.authSession.deleteMany({where:{id:schoolAdminSession.id}});
 if(newLocalStudentId)await db.student.delete({where:{id:newLocalStudentId}});
 if(foreignClass){
  await db.schoolInvoice.deleteMany({where:{organizationId:foreignOrg.id}});
  await db.studentSubmission.deleteMany({where:{assignment:{classId:foreignClass.id}}});
  await db.studentReport.deleteMany({where:{classId:foreignClass.id}});
  await db.schoolAssignment.deleteMany({where:{classId:foreignClass.id}});
  await db.attendance.deleteMany({where:{session:{classId:foreignClass.id}}});
  await db.classSession.deleteMany({where:{classId:foreignClass.id}});
  await db.enrollment.deleteMany({where:{studentId:foreignStudent.id}});
  await db.teacherAssignment.deleteMany({where:{classId:foreignClass.id}});
  await db.classSection.delete({where:{id:foreignClass.id}});
 }
 if(foreignStudent){
  await db.guardianLink.deleteMany({where:{studentId:foreignStudent.id}});
  await db.student.delete({where:{id:foreignStudent.id}});
 }
 if(foreignApplication)await db.enrollmentApplication.delete({where:{id:foreignApplication.id}});
 if(foreignProgram)await db.schoolProgram.delete({where:{id:foreignProgram.id}});
 if(foreignTeacher){
  await db.organizationMembership.deleteMany({where:{userId:foreignTeacher.id}});
  await db.user.delete({where:{id:foreignTeacher.id}});
 }
 if(foreignOrg)await db.organization.delete({where:{id:foreignOrg.id}});
 await db.$disconnect();
}

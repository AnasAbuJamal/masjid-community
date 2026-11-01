// F-019 student progress reviews: synthetic CI school records ONLY.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomUUID,randomBytes,createHash} from "node:crypto";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.endsWith("/masjid_ci"))
 throw Error("Refusing student report review tests outside disposable masjid_ci.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),base="http://127.0.0.1:3000/api/v1/";
async function call(path,method="GET",data,token){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(data?{"Content-Type":"application/json"}:{})
 },body:data?JSON.stringify(data):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
let adminSessionId=null;
const reports=[],sessions=[],notices=[];
let foreignOrg=null,foreignProgram=null,foreignClass=null,foreignStudent=null;
let activeSibling=null,siblingLink=null,siblingEnrollment=null;
try{
 const org=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 assert.ok(org);
 const klass=await db.classSection.findFirst({where:{
  program:{organizationId:org.id},teachers:{some:{}}
 },include:{teachers:true,enrollments:{where:{status:"active"}}}});
 assert.ok(klass?.teachers?.length&&klass.enrollments.length);
 const studentId=klass.enrollments[0].studentId,teacherId=klass.teachers[0].teacherId;
 const teacher=await db.user.findUniqueOrThrow({where:{id:teacherId}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const student=await db.student.findUniqueOrThrow({where:{id:studentId}});
 assert.notEqual(teacherId,admin.id);
 const auth=await call("auth/login","POST",{email:teacher.email,password});
 assert.equal(auth.status,200);
 const teacherToken=auth.data.token;
 const member=await call("auth/login","POST",{email:memberEmail,password});
 assert.equal(member.status,200);
 const memberToken=member.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 const session=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 adminSessionId=session.id;
 const baseDraft={kind:"report",classId:klass.id,studentId:student.id,
  summary:"Synthetic progress update for independent reviewer only."};
 const count=await db.studentReport.count({where:{classId:klass.id}});
 const bypass=await call("schoolwork","POST",{...baseDraft,published:true},teacherToken);
 assert.equal(bypass.status,409);
 assert.equal(bypass.error.code,"REPORT_REVIEW_REQUIRED");
 assert.equal(await db.studentReport.count({where:{classId:klass.id}}),count);
 const newDraft=async (token=teacherToken)=> {
  const result=await call("schoolwork","POST",{...baseDraft,published:false},token);
  assert.equal(result.status,201,JSON.stringify(result));
  assert.equal(result.data.status,"draft");
  reports.push(result.data.id);return result.data.id;
 };
 // Compare notification IDs, not counts of other synthetic test runs.
 const authorNoticeBaseline=await db.notification.findMany({where:{
  organizationId:org.id,userId:teacher.id,
  title:{in:["School report approved","School report requires correction"]}
 },select:{id:true}});
 const firstId=await newDraft();
 const familyBefore=await call("schoolwork","GET",undefined,memberToken);
 assert.equal(familyBefore.status,200);
 assert.ok(!familyBefore.data.reports.some(x=>x.id===firstId));
 const teacherRead=await call("schoolwork","GET",undefined,teacherToken);
 assert.equal(teacherRead.status,200);
 assert.equal(teacherRead.data.pendingReports?.length||0,0,
  "a teacher must not receive unapproved learner reports from an admin review queue");
 const reviewQueue=await call("schoolwork","GET",undefined,adminToken);
 assert.equal(reviewQueue.status,200);
 assert.ok(reviewQueue.data.pendingReports.some(x=>x.id===firstId&&!x.selfAuthored));
 const publish={action:"publish-report",reportId:firstId,reason:"verified-content"};
 assert.equal((await call("schoolwork","PATCH",publish)).status,401);
 assert.equal((await call("schoolwork","PATCH",publish,teacherToken)).status,403);
 assert.equal((await call("schoolwork","PATCH",publish,memberToken)).status,403);
 assert.equal((await call("schoolwork","PATCH",{...publish,reason:"needs-correction"},adminToken)).status,422);
 assert.equal((await call("schoolwork","PATCH",{...publish,reportId:"missing-synthetic-report"},adminToken)).status,404);
 const reviewer=await call("schoolwork","PATCH",publish,adminToken);
 assert.equal(reviewer.status,200,JSON.stringify(reviewer));
 assert.equal(reviewer.data.status,"published");
 const published=await db.studentReport.findUniqueOrThrow({where:{id:firstId}});
 assert.equal(published.status,"published");
 assert.ok(published.publishedAt);
 const familyAfter=await call("schoolwork","GET",undefined,memberToken);
 assert.ok(familyAfter.data.reports.some(x=>x.id===firstId),
  "student progress must become visible to a currently approved guardian only after review");
 // A second approved sibling actively enrolled in the SAME class must never
 // authorize the first child's report/answer after the first withdraws.
 activeSibling=await db.student.create({data:{
  organizationId:org.id,studentNumber:"sibling-review-"+randomUUID(),
  firstName:"Synthetic",lastName:"Sibling"
 }});
 siblingLink=await db.guardianLink.create({data:{
  studentId:activeSibling.id,guardianId:(await db.user.findUniqueOrThrow({
   where:{email:memberEmail}
  })).id,approvedAt:new Date()
 }});
 siblingEnrollment=await db.enrollment.create({data:{
  studentId:activeSibling.id,classId:klass.id,status:"active"
 }});
 // Disposable db test-db contains an original assignment and submission for
 // the first child. Confirm its teacher-visible answer while enrolled.
 const persistedSubmission=await db.studentSubmission.findFirst({where:{
  studentId,assignment:{classId:klass.id}
 },select:{id:true,body:true}});
 assert.ok(persistedSubmission,"CI fixture has an initial child submission");
 const beforeTeacher=await call("schoolwork","GET",undefined,teacherToken);
 const activeRoster=beforeTeacher.data.classes.find(c=>c.id===klass.id);
 assert.ok(activeRoster?.assignments.some(a=>
  a.submissions.some(s=>s.studentId===studentId&&s.body===persistedSubmission.body)),
  "assigned teacher can access an actively enrolled student's submitted work");
 await db.enrollment.update({where:{studentId_classId:{
  studentId,classId:klass.id
 }},data:{status:"withdrawn"}});
 try{
  const withdrawnFamily=await call("schoolwork","GET",undefined,memberToken);
  assert.equal(withdrawnFamily.status,200);
  assert.ok(!withdrawnFamily.data.reports.some(r=>r.id===firstId),
   "guardian of a second active sibling cannot view withdrawn child's report");
  assert.ok(!withdrawnFamily.data.submissions.some(s=>s.id===persistedSubmission.id),
   "guardian of a second active sibling cannot view withdrawn child's submission");
  const withdrawnTeacher=await call("schoolwork","GET",undefined,teacherToken);
  assert.equal(withdrawnTeacher.status,200);
  const filteredClass=withdrawnTeacher.data.classes.find(c=>c.id===klass.id);
  assert.ok(filteredClass&&!filteredClass.assignments.some(a=>
   a.submissions.some(s=>s.studentId===studentId)),
   "former student's answer body is absent from the teacher's returned class");
  assert.ok(!JSON.stringify(withdrawnTeacher.data.classes).includes(
   persistedSubmission.body),"teacher response cannot include former student's answer");
  // The independently published report remains stored and auditable; the
  // read privilege, not the school record itself, has been revoked.
  assert.equal((await db.studentReport.findUniqueOrThrow({where:{id:firstId}})).status,
   "published");
 }finally{
  await db.enrollment.update({where:{studentId_classId:{
   studentId,classId:klass.id
  }},data:{status:"active"}});
 }
 const restoredFamily=await call("schoolwork","GET",undefined,memberToken);
 assert.ok(restoredFamily.data.reports.some(r=>r.id===firstId),
  "student report becomes visible again only after an active exact-class link");
 assert.equal((await call("schoolwork","PATCH",publish,adminToken)).status,404,
  "replayed review must not produce another publication");
 const selfId=await newDraft(adminToken);
 assert.equal((await call("schoolwork","PATCH",{...publish,reportId:selfId},adminToken)).status,403,
  "the report's author cannot approve their own private draft");
 const secondId=await newDraft();
 const reject=await call("schoolwork","PATCH",{action:"reject-report",
  reportId:secondId,reason:"needs-correction"},adminToken);
 assert.equal(reject.status,200);
 assert.equal(reject.data.status,"archived");
 assert.equal((await db.studentReport.findUniqueOrThrow({where:{id:secondId}})).publishedAt,null);
 assert.ok(!(await call("schoolwork","GET",undefined,memberToken)).data.reports.some(x=>x.id===secondId));
 // Revoking author authorization or enrollment must prevent publication even
 // when an administrator has a cached review queue from before revocation.
 const roleId=await newDraft();
 await db.user.update({where:{id:teacher.id},data:{role:"member"}});
 const demoted=await call("schoolwork","PATCH",{...publish,reportId:roleId},adminToken);
 assert.equal(demoted.status,409);
 assert.equal(demoted.error.code,"REPORT_AUTHOR_INACTIVE");
 await db.user.update({where:{id:teacher.id},data:{role:"teacher"}});
 await db.enrollment.update({where:{studentId_classId:{studentId,classId:klass.id}},
  data:{status:"withdrawn"}});
 const unenrolled=await call("schoolwork","PATCH",{...publish,reportId:roleId},adminToken);
 assert.equal(unenrolled.status,409);
 assert.equal(unenrolled.error.code,"REPORT_STUDENT_INACTIVE");
 await db.enrollment.update({where:{studentId_classId:{studentId,classId:klass.id}},
  data:{status:"active"}});
 // Known real foreign report IDs remain inaccessible to an admin of home.
 foreignOrg=await db.organization.create({data:{slug:"report-review-ci-"+randomUUID(),
  name:"Unrelated CI school"}});
 foreignProgram=await db.schoolProgram.create({data:{organizationId:foreignOrg.id,
  title:"Foreign private program",description:"Synthetic only",published:true}});
 foreignClass=await db.classSection.create({data:{programId:foreignProgram.id,
  name:"Foreign private class",schedule:"CI-only"}});
 foreignStudent=await db.student.create({data:{organizationId:foreignOrg.id,
  studentNumber:"foreign-review-"+randomUUID(),firstName:"Foreign",lastName:"Learner"}});
 const foreignReport=await db.studentReport.create({data:{classId:foreignClass.id,
  studentId:foreignStudent.id,teacherId:teacher.id,summary:"Private other-mosque draft.",status:"draft"}});
 reports.push(foreignReport.id);
 assert.equal((await call("schoolwork","PATCH",{...publish,reportId:foreignReport.id},adminToken)).status,404);
 const thirdId=await newDraft();
 const concurrent=await Promise.all([
  call("schoolwork","PATCH",{...publish,reportId:thirdId},adminToken),
  call("schoolwork","PATCH",{...publish,reportId:thirdId},adminToken)
 ]);
 assert.ok(concurrent.some(x=>x.status===200),JSON.stringify(concurrent));
 assert.ok(concurrent.every(x=>[200,404,409].includes(x.status)),JSON.stringify(concurrent));
 // Published report retraction must immediately remove family access,
 // preserve its publication timestamp and queue no sensitive narrative.
 const publishedQueue=await call("schoolwork","GET",undefined,adminToken);
 assert.ok(publishedQueue.data.publishedReports.some(x=>x.id===firstId));
 assert.ok(!publishedQueue.data.publishedReports.some(x=>x.id===foreignReport.id));
 assert.ok(!teacherRead.data.publishedReports?.length,
  "ordinary teachers must not receive the private administrator withdrawal queue");
 const retract={action:"retract-report",reportId:firstId,reason:"privacy-concern"};
 assert.equal((await call("schoolwork","PATCH",retract)).status,401);
 assert.equal((await call("schoolwork","PATCH",retract,teacherToken)).status,403);
 assert.equal((await call("schoolwork","PATCH",retract,memberToken)).status,403);
 assert.equal((await call("schoolwork","PATCH",{...retract,reason:"verified-content"},adminToken)).status,422);
 assert.equal((await call("schoolwork","PATCH",{...retract,reportId:foreignReport.id},adminToken)).status,404);
 assert.equal((await call("schoolwork","PATCH",{...retract,reportId:secondId},adminToken)).status,404);
 const guardian=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const noticesBefore=await db.notification.findMany({where:{
  organizationId:org.id,userId:guardian.id,title:"School report withdrawn"
 },select:{id:true}});
 const publishedAt=published.publishedAt.getTime();
 const retracted=await call("schoolwork","PATCH",retract,adminToken);
 assert.equal(retracted.status,200,JSON.stringify(retracted));
 assert.equal(retracted.data.status,"archived");
 assert.ok(retracted.data.notificationsQueued>=1,
  "approved guardian receives an organization-owned private notice");
 const updatedReport=await db.studentReport.findUniqueOrThrow({where:{id:firstId}});
 assert.equal(updatedReport.status,"archived");
 assert.equal(updatedReport.publishedAt?.getTime(),publishedAt,
  "retraction preserves the original publication event time");
 assert.ok(!(await call("schoolwork","GET",undefined,memberToken)).data.reports.some(x=>x.id===firstId),
  "retracted report immediately disappears from family-facing reads");
 assert.ok(!(await call("schoolwork","GET",undefined,adminToken)).data.publishedReports.some(x=>x.id===firstId));
 assert.equal((await call("schoolwork","PATCH",retract,adminToken)).status,404,
  "repeat retraction cannot create duplicate notifications or audits");
 const recipientNotices=await db.notification.findMany({where:{
  organizationId:org.id,userId:guardian.id,title:"School report withdrawn",
  id:{notIn:noticesBefore.map(x=>x.id)}
 },include:{outboxEvents:true}});
 assert.equal(recipientNotices.length,1);
 for(const notice of recipientNotices){
  notices.push(notice.id);
  assert.ok(!notice.body.includes(baseDraft.summary));
  assert.ok(!notice.body.includes(student.firstName)&&!notice.body.includes(student.lastName));
  assert.equal(notice.outboxEvents.length,1);
  assert.equal(notice.outboxEvents[0].status,"pending");
 }
 // Two independent publish actions and one rejection must each create ONE
 // generic private author notification. A replay or concurrency loser must
 // not queue a second notice, nor disclose school progress narratives.
 const authorNotices=await db.notification.findMany({where:{
  organizationId:org.id,userId:teacher.id,
  title:{in:["School report approved","School report requires correction"]},
  id:{notIn:authorNoticeBaseline.map(x=>x.id)}
 },include:{outboxEvents:true}});
 assert.equal(authorNotices.filter(n=>n.title==="School report approved").length,2);
 assert.equal(authorNotices.filter(n=>n.title==="School report requires correction").length,1);
 assert.equal(authorNotices.length,3,"one eligible author notification per approved/rejected decision");
 for(const n of authorNotices){
  notices.push(n.id);
  assert.ok(!n.body.includes(baseDraft.summary));
  assert.ok(!n.body.includes(student.firstName)&&!n.body.includes(student.lastName));
  assert.ok(!n.body.includes(firstId)&&!n.body.includes(secondId));
  assert.equal(n.organizationId,org.id);
  assert.equal(n.outboxEvents.length,1);
  assert.equal(n.outboxEvents[0].status,"pending");
 }
 const audit=await db.auditEvent.findMany({where:{entity:"StudentReport",entityId:{in:reports}}});
 assert.equal(audit.filter(x=>x.entityId===firstId&&x.action==="school.report.publish").length,1);
 assert.equal(audit.filter(x=>x.entityId===thirdId&&x.action==="school.report.publish").length,1);
 assert.equal(audit.filter(x=>x.entityId===secondId&&x.action==="school.report.reject").length,1);
 assert.equal(audit.filter(x=>x.entityId===firstId&&x.action==="school.report.retract").length,1);
 assert.ok(audit.every(x=>!x.detail?.includes(baseDraft.summary)&&
  !x.detail?.includes("Private other-mosque draft.")),
  "never put actual child reports in audit detail");
 console.log("Verified independent report publishing, private drafts/rejections, active author/enrollment, foreign scope, concurrent audit.");
}finally{
 if(notices.length){
  await db.outboxEvent.deleteMany({where:{notificationId:{in:notices}}});
  await db.notification.deleteMany({where:{id:{in:notices}}});
 }
 if(reports.length){
  await db.auditEvent.deleteMany({where:{entity:"StudentReport",entityId:{in:reports}}});
  await db.studentReport.deleteMany({where:{id:{in:reports}}});
 }
 if(siblingEnrollment)await db.enrollment.deleteMany({where:{id:siblingEnrollment.id}});
 if(siblingLink)await db.guardianLink.deleteMany({where:{id:siblingLink.id}});
 if(activeSibling)await db.student.deleteMany({where:{id:activeSibling.id}});
 if(foreignStudent)await db.student.deleteMany({where:{id:foreignStudent.id}});
 if(foreignClass)await db.classSection.deleteMany({where:{id:foreignClass.id}});
 if(foreignProgram)await db.schoolProgram.deleteMany({where:{id:foreignProgram.id}});
 if(foreignOrg)await db.organization.deleteMany({where:{id:foreignOrg.id}});
 if(adminSessionId)await db.authSession.deleteMany({where:{id:adminSessionId}});
 await db.$disconnect();
}

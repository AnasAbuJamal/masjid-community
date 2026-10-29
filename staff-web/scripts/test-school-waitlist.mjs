// Class waitlist FIFO, custody rechecks, withdrawal and atomic last-seat promotion.
// Runs with synthetic records only on disposable masjid_ci PostgreSQL.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("School waitlist tests require isolated masjid_ci PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function call(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
const IDs={students:[],classes:[],links:[]};
let adminSession=null,foreignOrgId=null;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const guardian=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{userId:admin.id,
  tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  mfaVerifiedAt:new Date(),expiresAt:new Date(Date.now()+3600000)
 }});
 const login=await call("auth/login","POST",{email:memberEmail,password});
 assert.equal(login.status,200);
 const memberToken=login.data.token;
 const program=await db.schoolProgram.findFirst({where:{organizationId:org.id}});
 assert.ok(program);
 const klass=await db.classSection.create({data:{
  programId:program.id,name:"Private waitlist "+Date.now(),schedule:"CI-only",capacity:1
 }});
 IDs.classes.push(klass.id);
 const students=await Promise.all(Array.from({length:4},async(_,i)=>{
  const s=await db.student.create({data:{
   organizationId:org.id,studentNumber:"CI-WL-"+randomUUID(),
   firstName:"Waitlist",lastName:"Child "+(i+1)
  }});
  IDs.students.push(s.id);return s;
 }));
 const [a,b,c,d]=students;
 for(const s of [b,c,d]){
  const link=await db.guardianLink.create({data:{
   studentId:s.id,guardianId:guardian.id,approvedAt:new Date()
  }});
  IDs.links.push(link.id);
 }
 const enrolled=await db.enrollment.create({data:{classId:klass.id,studentId:a.id}});
 assert.equal((await call("admin/school-waitlist","GET")).status,401);
 assert.equal((await call("admin/school-waitlist","GET",undefined,memberToken)).status,403);
 const noForeign=await call("admin/school-waitlist","GET",undefined,adminToken);
 assert.equal(noForeign.status,200);
 assert.ok(noForeign.data.classes.some(row=>row.id===klass.id));
 const join=(studentId,reason="The family requested the next available place in this class.")=>
  call("admin/school-waitlist","POST",{kind:"queue",classId:klass.id,studentId,reason},adminToken);
 const first=await join(b.id);
 assert.equal(first.status,201,"approved guardian-linked student joins full class waitlist");
 assert.equal(first.data.status,"waiting");
 const repeat=await join(b.id);
 assert.equal(repeat.status,200,"repeating request is idempotent");
 assert.equal(repeat.data.id,first.data.id);
 assert.equal(repeat.data.created,false);
 const second=await join(c.id);
 assert.equal(second.status,201);
 const third=await join(d.id);
 assert.equal(third.status,201);
 const list=await call("admin/school-waitlist","GET",undefined,adminToken);
 assert.equal(list.status,200);
 const ownClass=list.data.classes.find(x=>x.id===klass.id);
 assert.deepEqual(ownClass.waitlist.map(x=>x.id),[first.data.id,second.data.id,third.data.id],
  "waiting order follows request time and stable ID");
 const guardianView=await call("students","GET",undefined,memberToken);
 assert.equal(guardianView.status,200);
 assert.ok(guardianView.data.children.some(child=>child.id===b.id&&
  child.waitlist.some(w=>w.id===first.data.id)),
  "approved guardian sees the waiting state and cannot mistake it for enrollment");
 assert.ok(!guardianView.data.children.find(child=>child.id===b.id)?.enrollments.some(e=>e.classId===klass.id),
  "a waiting child has no confirmed place");
 assert.ok(!JSON.stringify(ownClass).includes(guardian.email),
  "school queue shows child names but no guardian email or private notes");
 const directFull=await call("admin/school","POST",{
  kind:"enrollment",classId:klass.id,studentId:d.id
 },adminToken);
 assert.equal(directFull.status,409);
 assert.equal(directFull.error.code,"WAITLIST_PRIORITY",
  "existing queue cannot be bypassed by ordinary direct enrollment");
 const outOfOrder=await call("admin/school-waitlist","POST",{
  kind:"promote",waitlistId:second.data.id,reason:"Trying to bypass the first family on the waitlist."
 },adminToken);
 assert.equal(outOfOrder.status,409);
 assert.equal(outOfOrder.error.code,"WAITLIST_ORDER");
 const stillFull=await call("admin/school-waitlist","POST",{
  kind:"promote",waitlistId:first.data.id,reason:"Seat cannot be allocated until an actual vacancy."
 },adminToken);
 assert.equal(stillFull.status,409);
 assert.equal(stillFull.error.code,"CLASS_FULL");
 const withdraw=await call("admin/school-waitlist","POST",{
  kind:"withdraw",enrollmentId:enrolled.id,reason:"Guardian requested a reviewed withdrawal from the cohort."
 },adminToken);
 assert.equal(withdraw.status,200);
 assert.equal(withdraw.data.status,"withdrawn");
 assert.equal((await db.enrollment.findUniqueOrThrow({where:{id:enrolled.id}})).status,"withdrawn",
  "withdrawal preserves the historical enrollment");
 assert.equal(await db.enrollment.count({where:{classId:klass.id,status:"active"}}),0,
  "withdrawal does not automatically promote another child");
 const bypassVacancy=await call("admin/school","POST",{
  kind:"enrollment",classId:klass.id,studentId:d.id
 },adminToken);
 assert.equal(bypassVacancy.status,409);
 assert.equal(bypassVacancy.error.code,"WAITLIST_PRIORITY");
 const body={kind:"promote",waitlistId:first.data.id,reason:"The oldest eligible student receives the reviewed vacancy."};
 const race=await Promise.all([
  call("admin/school-waitlist","POST",body,adminToken),
  call("admin/school-waitlist","POST",body,adminToken)
 ]);
 assert.equal(race.filter(x=>x.status===200).length,1,
  "only one of two concurrent promotion attempts may succeed");
 assert.ok(race.every(x=>[200,404,409].includes(x.status)));
 assert.equal(await db.enrollment.count({where:{classId:klass.id,status:"active"}}),1,
  "race cannot overfill the one-seat class");
 const promoted=await db.schoolWaitlist.findUniqueOrThrow({where:{id:first.data.id}});
 assert.equal(promoted.status,"promoted");
 assert.equal(promoted.decidedById,admin.id);
 assert.ok(promoted.decidedAt instanceof Date);
 const admittedB=await db.enrollment.findUniqueOrThrow({where:{studentId_classId:{
  classId:klass.id,studentId:b.id
 }}});
 assert.equal(admittedB.status,"active");
 const familyAfterPromotion=await call("students","GET",undefined,memberToken);
 const approvedB=familyAfterPromotion.data.children.find(child=>child.id===b.id);
 assert.ok(approvedB.enrollments.some(e=>e.classId===klass.id),
  "guardian can see a genuinely promoted and active enrollment");
 assert.ok(!approvedB.waitlist.some(w=>w.id===first.data.id),
  "promoted child no longer appears as waiting");
 const reEnrolOld=await call("admin/school","POST",{
  kind:"enrollment",classId:klass.id,studentId:a.id
 },adminToken);
 assert.equal(reEnrolOld.status,409);
 assert.equal(reEnrolOld.error.code,"ENROLLMENT_INACTIVE");
 const withdrawB=await call("admin/school-waitlist","POST",{
  kind:"withdraw",enrollmentId:admittedB.id,
  reason:"Family requested a subsequent withdrawal from this class."
 },adminToken);
 assert.equal(withdrawB.status,200);
 const cLink=await db.guardianLink.findUniqueOrThrow({where:{id:IDs.links[1]}});
 await db.guardianLink.update({where:{id:cLink.id},data:{revokedAt:new Date()}});
 const afterRevocation=await call("students","GET",undefined,memberToken);
 assert.ok(!afterRevocation.data.children.some(child=>child.id===c.id),
  "revoked guardian immediately loses child identity and waitlist status");
 const invalidC=await call("admin/school-waitlist","POST",{
  kind:"promote",waitlistId:second.data.id,
  reason:"The guardian relationship has been revoked and must be checked."
 },adminToken);
 assert.equal(invalidC.status,409);
 assert.equal(invalidC.error.code,"GUARDIAN_REVIEW_REQUIRED",
  "promotion rechecks current guardianship rather than trusting original queue");
 const jumpD=await call("admin/school-waitlist","POST",{
  kind:"promote",waitlistId:third.data.id,
  reason:"Cannot skip an older waiting child without a reviewed cancellation."
 },adminToken);
 assert.equal(jumpD.status,409);
 assert.equal(jumpD.error.code,"WAITLIST_ORDER");
 const cancelC=await call("admin/school-waitlist","POST",{
  kind:"cancel",waitlistId:second.data.id,
  reason:"Approved guardian relationship was revoked; waiting application closed for review."
 },adminToken);
 assert.equal(cancelC.status,200);
 assert.equal((await db.schoolWaitlist.findUniqueOrThrow({where:{id:second.data.id}})).status,"cancelled");
 const promoteD=await call("admin/school-waitlist","POST",{
  kind:"promote",waitlistId:third.data.id,
  reason:"The next eligible family was reached after a documented waitlist cancellation."
 },adminToken);
 assert.equal(promoteD.status,200);
 assert.equal(await db.enrollment.count({where:{classId:klass.id,status:"active"}}),1);
 const repeatPromoted=await join(b.id);
 assert.equal(repeatPromoted.status,409);
 assert.equal(repeatPromoted.error.code,"ENROLLMENT_EXISTS");
 const foreignOrg=await db.organization.create({data:{
  slug:"school-waitlist-foreign-"+Date.now(),name:"Different private school"
 }});
 foreignOrgId=foreignOrg.id;
 const foreignStudent=await db.student.create({data:{
  organizationId:foreignOrg.id,studentNumber:"CI-WL-FOREIGN-"+randomUUID(),
  firstName:"Foreign",lastName:"Learner"
 }});
 IDs.students.push(foreignStudent.id);
 const forbidden=await join(foreignStudent.id);
 assert.equal(forbidden.status,404,"foreign child cannot be waitlisted in this mosque");
 const changedForeign=await call("admin/school-waitlist","POST",{
  kind:"cancel",waitlistId:"unrelated-private-record",
  reason:"Cannot make modifications to unknown private student records."
 },adminToken);
 assert.equal(changedForeign.status,404);
 const audits=await db.auditEvent.findMany({where:{
  entity:"SchoolWaitlist",entityId:first.data.id,
  action:{in:["school.waitlist.queue","school.waitlist.promote"]}
 }});
 assert.equal(audits.length,2,"queue and promotion each have one audit event");
 assert.equal(JSON.parse(audits.find(x=>x.action==="school.waitlist.promote").detail).organizationId,org.id);
 console.log("Verified guarded school FIFO waitlist, reviewed withdrawal, guardian revocation, concurrency and foreign denial.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 if(IDs.classes.length){
  await db.schoolWaitlist.deleteMany({where:{classId:{in:IDs.classes}}});
  await db.enrollment.deleteMany({where:{classId:{in:IDs.classes}}});
  await db.classSection.deleteMany({where:{id:{in:IDs.classes}}});
 }
 if(IDs.links.length)await db.guardianLink.deleteMany({where:{id:{in:IDs.links}}});
 if(IDs.students.length)await db.student.deleteMany({where:{id:{in:IDs.students}}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

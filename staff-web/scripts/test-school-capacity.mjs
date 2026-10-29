// Last-seat and idempotent enrollment checks in disposable CI PostgreSQL.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("School concurrency tests require the isolated masjid_ci database.");
const {adminEmail}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(payload,token){
 const response=await fetch(base+"admin/school",{method:"POST",headers:{
  Authorization:"Bearer "+token,"Content-Type":"application/json"
 },body:JSON.stringify(payload)});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
const classIds=[],studentIds=[];
let adminSession,foreignOrgId;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const token=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 const program=await db.schoolProgram.findFirst({where:{organizationId:org.id}});
 assert.ok(program,"CI program exists");
 const cohort=await db.classSection.create({data:{
  programId:program.id,name:"CI last seat "+Date.now(),schedule:"Synthetic class",capacity:1
 }});
 classIds.push(cohort.id);
 const students=await Promise.all([1,2].map(async n=>{
  const student=await db.student.create({data:{
   organizationId:org.id,studentNumber:"CI-CAP-"+randomUUID(),
   firstName:"Seat",lastName:"Applicant "+n
  }});
  studentIds.push(student.id);
  return student;
 }));
 const first={kind:"enrollment",classId:cohort.id,studentId:students[0].id};
 const second={kind:"enrollment",classId:cohort.id,studentId:students[1].id};
 const responses=await Promise.all([request(first,token),request(second,token)]);
 assert.deepEqual(responses.map(x=>x.status).sort(),[201,409],
  "two parallel applications for the last seat cannot both succeed");
 const active=await db.enrollment.findMany({where:{classId:cohort.id,status:"active"}});
 assert.equal(active.length,1,"class never exceeds its one active seat");
 assert.equal((await db.classSection.findUniqueOrThrow({where:{id:cohort.id}})).capacity,1);
 const admitted=active[0].studentId===students[0].id?first:second;
 const excluded=active[0].studentId===students[0].id?second:first;
 const duplicate=await request(admitted,token);
 assert.equal(duplicate.status,200,"idempotent enrollment must report an existing record");
 assert.equal(duplicate.data.id,active[0].id);
 assert.equal(duplicate.data.created,false);
 assert.ok(await db.auditEvent.count({where:{action:"school.enrollment.existing",entityId:active[0].id}}),
  "idempotent replay is audited as an existing seat, not a new admission");
 assert.equal(await db.enrollment.count({where:{classId:cohort.id,status:"active"}}),1);
 const full=await request(excluded,token);
 assert.equal(full.status,409,"retries cannot overbook a full class");
 assert.equal(full.error.code,"CLASS_FULL");
 const previous=await db.classSection.create({data:{
  programId:program.id,name:"CI inactive enrollment "+Date.now(),schedule:"Synthetic class",capacity:1
 }});
 classIds.push(previous.id);
 const oldStudent=await db.student.create({data:{
  organizationId:org.id,studentNumber:"CI-OLD-"+randomUUID(),firstName:"Previous",lastName:"Student"
 }});
 studentIds.push(oldStudent.id);
 const inactive=await db.enrollment.create({data:{
  studentId:oldStudent.id,classId:previous.id,status:"withdrawn"
 }});
 const inactiveRetry=await request({kind:"enrollment",classId:previous.id,studentId:oldStudent.id},token);
 assert.equal(inactiveRetry.status,409,"an inactive enrollment is not reported as a fresh admission");
 assert.equal(inactiveRetry.error.code,"ENROLLMENT_INACTIVE");
 assert.equal((await db.enrollment.findUniqueOrThrow({where:{id:inactive.id}})).status,"withdrawn");
 const overviewResponse=await fetch(base+"admin/school",{headers:{Authorization:"Bearer "+token}});
 assert.equal(overviewResponse.status,200);
 const overview=(await overviewResponse.json()).data;
 const classes=overview.programs.flatMap(p=>p.classes);
 assert.equal(classes.find(c=>c.id===cohort.id)?.enrollments.length,1,
  "the class overview counts one real active seat");
 assert.equal(classes.find(c=>c.id===previous.id)?.enrollments.length,0,
  "inactive historical enrollments do not inflate current class occupancy");
 const other=await db.organization.create({data:{
  slug:"school-capacity-ci-"+Date.now(),name:"Different school"
 }});
 foreignOrgId=other.id;
 const foreignStudent=await db.student.create({data:{
  organizationId:other.id,studentNumber:"CI-FOREIGN-"+randomUUID(),
  firstName:"Foreign",lastName:"Child"
 }});
 studentIds.push(foreignStudent.id);
 const foreign=await request({kind:"enrollment",classId:cohort.id,studentId:foreignStudent.id},token);
 assert.equal(foreign.status,404,"a foreign-owned child cannot compete for local seats");
 console.log("Verified single last seat under concurrent requests, idempotence, inactive-denial and foreign child isolation.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 if(classIds.length)await db.enrollment.deleteMany({where:{classId:{in:classIds}}});
 if(classIds.length)await db.classSection.deleteMany({where:{id:{in:classIds}}});
 if(studentIds.length)await db.student.deleteMany({where:{id:{in:studentIds}}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

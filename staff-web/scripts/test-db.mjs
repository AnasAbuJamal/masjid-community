// Executes against an isolated CI database only. Refuses production environments.
import assert from "node:assert/strict";
import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";
import {writeFileSync} from "node:fs";
if(process.env.NODE_ENV==="production"||process.env.VERCEL)throw Error("Cannot test against production.");
if(!process.env.DATABASE_URL?.includes("masjid_ci"))throw Error("Database name must be masjid_ci for integration tests.");
const db=new PrismaClient();
const suffix=Date.now().toString();
try{
 const org=await db.organization.create({data:{slug:"ci-"+suffix,name:"Integration Fixture",timeZone:"America/New_York",
  venues:{create:{name:"CI Venue",timeZone:"America/New_York"}}},include:{venues:true}});
 const venue=org.venues[0];
 const hashes=await bcrypt.hash("sample-development-password",10);
 const member=await db.user.create({data:{email:"member-"+suffix+"@example.test",firstName:"Member",lastName:"Fixture",passwordHash:hashes,verifiedAt:new Date(),memberships:{create:{organizationId:org.id}}}});
 const teacher=await db.user.create({data:{email:"teacher-"+suffix+"@example.test",firstName:"Teacher",lastName:"Fixture",passwordHash:hashes,role:"teacher",verifiedAt:new Date(),memberships:{create:{organizationId:org.id}}}});
 const admin=await db.user.create({data:{email:"admin-"+suffix+"@example.test",firstName:"Admin",lastName:"Fixture",passwordHash:hashes,role:"admin",verifiedAt:new Date(),memberships:{create:{organizationId:org.id}}}});
 const staff=await db.user.create({data:{email:"staff-"+suffix+"@example.test",firstName:"Staff",lastName:"Fixture",
  passwordHash:hashes,role:"staff",verifiedAt:new Date(),memberships:{create:{organizationId:org.id}}}});
 const staffMembership=await db.organizationMembership.findUniqueOrThrow({where:{organizationId_userId:{organizationId:org.id,userId:staff.id}}});
 const grant=await db.roleGrant.create({data:{membershipId:staffMembership.id,capability:"community_moderate",grantedById:admin.id}});
 assert.equal(grant.capability,"community_moderate");
 await db.roleGrant.create({data:{membershipId:staffMembership.id,capability:"facilities_manage",
  expiresAt:new Date(Date.now()-60000),grantedById:admin.id}});
 writeFileSync("/tmp/masjid-ci-accounts.json",JSON.stringify({adminEmail:admin.email,memberEmail:member.email,staffEmail:staff.email,password:"sample-development-password"}),{mode:0o600});
 const program=await db.schoolProgram.create({data:{organizationId:org.id,title:"Reading Skills",description:"Integration only",published:true}});
 const application=await db.enrollmentApplication.create({data:{organizationId:org.id,programId:program.id,applicantUserId:member.id,
  studentFirstName:"Child",studentLastName:"Fixture"}});
 assert.equal(application.status,"submitted");
 const klass=await db.classSection.create({data:{programId:program.id,name:"Class A",schedule:"Mondays",capacity:25}});
 const student=await db.student.create({data:{studentNumber:"CI-"+suffix,firstName:"Student",lastName:"Fixture"}});
 await db.teacherAssignment.create({data:{teacherId:teacher.id,classId:klass.id}});
 await db.guardianLink.create({data:{guardianId:member.id,studentId:student.id,approvedAt:new Date()}});
 await db.enrollment.create({data:{studentId:student.id,classId:klass.id}});
 const session=await db.classSession.create({data:{classId:klass.id,startsAt:new Date(Date.now()+86400000)}});
 const attendance=await db.attendance.create({data:{sessionId:session.id,studentId:student.id,markedById:teacher.id,status:"present"}});
 assert.equal(attendance.status,"present");
 await assert.rejects(()=>db.attendance.create({data:{sessionId:session.id,studentId:student.id,markedById:teacher.id,status:"absent"}}));
 const assignment=await db.schoolAssignment.create({data:{classId:klass.id,teacherId:teacher.id,title:"Reading assignment",instructions:"Read pages one and two.",dueAt:new Date(Date.now()+86400000),published:true}});
 const submission=await db.studentSubmission.create({data:{assignmentId:assignment.id,studentId:student.id,body:"Completed reading."}});
 assert.equal(submission.studentId,student.id);
 const report=await db.studentReport.create({data:{classId:klass.id,teacherId:teacher.id,studentId:student.id,summary:"Learning well in class.",status:"published",publishedAt:new Date()}});
 assert.equal(report.status,"published");
 const invoice=await db.schoolInvoice.create({data:{organizationId:org.id,studentId:student.id,payerGuardianId:member.id,description:"Tuition test",amountMinor:2700,dueAt:new Date(Date.now()+86400000)}});
 assert.equal(invoice.amountMinor,2700);
 const job=await db.jobPosting.create({data:{organizationId:org.id,title:"Community coordinator",description:"Integration role",company:"The Mosque",status:"published"}});
 const applicationJob=await db.jobApplication.create({data:{jobId:job.id,userId:member.id,coverLetter:"I would like to support this community."}});
 assert.equal(applicationJob.status,"submitted");
 const budget=await db.financeBudget.create({data:{organizationId:org.id,category:"Community",periodMonth:"2026-10",amountMinor:50000,published:true}});
 assert.equal(budget.amountMinor,50000);
 const expense=await db.financeExpense.create({data:{organizationId:org.id,category:"Community",description:"Test materials",amountMinor:2200,
  incurredOn:new Date(),submittedById:teacher.id}});
 assert.equal(expense.status,"pending");
 await db.financeExpense.update({where:{id:expense.id},data:{status:"approved",approvedById:admin.id,reviewedAt:new Date()}});
 const prefs=await db.userPreference.create({data:{userId:member.id,newsletterOptIn:true}});
 assert.equal(prefs.newsletterOptIn,true);
 const deleteRequest=await db.deletionRequest.create({data:{userId:member.id}});
 assert.equal(deleteRequest.status,"pending");
 const opp=await db.volunteerOpportunity.create({data:{organizationId:org.id,title:"Community support",description:"Test volunteering",startsAt:new Date(Date.now()+86400000),capacity:5,published:true}});
 const volunteerApp=await db.volunteerApplication.create({data:{opportunityId:opp.id,userId:member.id,status:"approved"}});
 const shift=await db.volunteerShift.create({data:{opportunityId:opp.id,applicationId:volunteerApp.id,userId:member.id,startAt:new Date(Date.now()+86400000),endAt:new Date(Date.now()+90000000)}});
 assert.equal(shift.status,"scheduled");
 const article=await db.communityArticle.create({data:{organizationId:org.id,title:"School news",body:"Updates from the school",status:"published",publishedAt:new Date()}});
 assert.equal(article.status,"published");
 const construction=await db.constructionProject.create({data:{organizationId:org.id,title:"Community hall",description:"Renovation plans",status:"published",publishedAt:new Date()}});
 const milestone=await db.constructionMilestone.create({data:{projectId:construction.id,title:"Planning",description:"Project approved",status:"published",publishedAt:new Date()}});
 assert.equal(milestone.projectId,construction.id);
 const faith=await db.faithNotice.create({data:{organizationId:org.id,kind:"other",localDate:"2026-10-30",title:"Integration fixture notice",
  body:"The mosque has confirmed a community service schedule.",status:"published",approvedById:admin.id,publishedAt:new Date()}});
 assert.equal(faith.status,"published");
 await db.faithNotice.create({data:{organizationId:org.id,kind:"moon_sighting",localDate:"2026-10-31",title:"Unpublished fixture",
  body:"This unconfirmed date must remain private.",status:"draft"}});
 const friday=await db.jummahSession.create({data:{venueId:venue.id,localDate:"2026-10-30",ordinal:1,khutbahAt:"13:00",iqamahAt:"13:20",language:"en"}});
 assert.equal(friday.ordinal,1);
 const notice=await db.notification.create({data:{userId:member.id,title:"Account update",body:"Integration queue."}});
 const queued=await db.outboxEvent.create({data:{userId:member.id,notificationId:notice.id}});
 assert.equal(queued.status,"pending");
 await assert.rejects(()=>db.outboxEvent.create({data:{userId:member.id,notificationId:notice.id}}));
 const prayer=await db.prayerDay.create({data:{venueId:venue.id,localDate:"2026-10-26",fajr:"06:00",sunrise:"07:00",dhuhr:"12:30",asr:"15:30",maghrib:"18:00",isha:"19:00",published:false}});
 assert.equal(prayer.published,false);
 const event=await db.event.create({data:{organizationId:org.id,title:"Example gathering",description:"Fixture",location:"Here",startAt:new Date(Date.now()+86400000),endAt:new Date(Date.now()+90000000),capacity:1,status:"published"}});
 await db.eventRSVP.create({data:{eventId:event.id,userId:member.id}});
 await assert.rejects(()=>db.eventRSVP.create({data:{eventId:event.id,userId:member.id}}));
 const other=await db.student.create({data:{studentNumber:"CI-OTHER-"+suffix,firstName:"Other",lastName:"Fixture"}});
 const owned=await db.guardianLink.findMany({where:{guardianId:member.id,approvedAt:{not:null},revokedAt:null},select:{studentId:true}});
 assert.deepEqual(owned.map(x=>x.studentId),[student.id]);
 assert.ok(!owned.some(x=>x.studentId===other.id));
 console.log("CI schema integration passed: worship, school, guardian, attendance uniqueness, reports, invoices and events");
}catch(error){console.error(error);process.exitCode=1;}
finally{await db.$disconnect();}

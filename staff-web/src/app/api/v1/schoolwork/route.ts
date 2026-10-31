import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import {mayViewGuardianRecords} from "@/lib/school-role-policy";
import {resolveMosqueLocalTime} from "@/lib/zoned-schedule-time";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("assignment"),classId:z.string().min(8),title:z.string().trim().min(4).max(180),instructions:z.string().trim().min(10).max(8000),dueAt:z.iso.datetime(),published:z.boolean().default(false)}),
 z.object({kind:z.literal("assignment-local"),classId:z.string().min(8),
  title:z.string().trim().min(4).max(180),instructions:z.string().trim().min(10).max(8000),
  dueLocal:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  published:z.boolean().default(false)}).strict(),
 z.object({kind:z.literal("submission"),assignmentId:z.string().min(8),body:z.string().trim().min(1).max(10000)}),
 z.object({kind:z.literal("report"),classId:z.string().min(8),studentId:z.string().min(8),summary:z.string().trim().min(10).max(5000),published:z.boolean().default(false)}),
]);
const reviewReport=z.object({action:z.enum(["publish-report","reject-report"]),
 reportId:z.string().min(8).max(128),
 reason:z.enum(["verified-content","needs-correction","policy-not-met"])}).strict();
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true,timeZone:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(user.role==="teacher"||user.role==="admin"){
   const classes=await db.classSection.findMany({where:{program:{organizationId:org.id},
    ...(user.role==="teacher"?{teachers:{some:{teacherId:user.id}}}:{})},
    take:100,select:{id:true,name:true,assignments:{orderBy:{createdAt:"desc"},take:50,
     select:{id:true,title:true,instructions:true,dueAt:true,published:true,
       submissions:{where:{student:schoolStudentScope(org.id)},select:{studentId:true,body:true,submittedAt:true,student:{select:{firstName:true,lastName:true}}}}}},
     enrollments:{where:{status:"active",student:schoolStudentScope(org.id)},select:{student:{select:{id:true,firstName:true,lastName:true}}}},
    }});
   // Only a currently verified, MFA-cleared admin may see private drafts.
   const pendingReports=user.role==="admin"?await db.studentReport.findMany({
    where:{status:"draft",classSection:{program:{organizationId:org.id}},
     student:schoolStudentScope(org.id)},
    orderBy:[{createdAt:"asc"},{id:"asc"}],take:50,
    select:{id:true,teacherId:true,summary:true,createdAt:true,
     classSection:{select:{id:true,name:true}},
     student:{select:{firstName:true,lastName:true}},
     author:{select:{firstName:true,lastName:true}}}
   }):[];
   return ok({mode:"teacher",organization:{name:org.name,timeZone:org.timeZone},
    classes,pendingReports:pendingReports.map(x=>({...x,selfAuthored:x.teacherId===user.id}))});
  }
  const [own,links]=await Promise.all([
   db.student.findFirst({where:{userId:user.id,...schoolStudentScope(org.id)},select:{id:true}}),
   mayViewGuardianRecords(user.role)?db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null,student:schoolStudentScope(org.id)},select:{studentId:true}}):Promise.resolve([])
  ]);
  const ids=[...new Set([...(own?[own.id]:[]),...links.map(x=>x.studentId)])];
  if(!ids.length)return ok({mode:"family",organization:{name:org.name,timeZone:org.timeZone},assignments:[],reports:[],submissions:[]});
  const [enrollments,reports,submissions]=await Promise.all([
   db.enrollment.findMany({where:{studentId:{in:ids},status:"active",classSection:{program:{organizationId:org.id}}},select:{studentId:true,classId:true}}),
   db.studentReport.findMany({where:{studentId:{in:ids},status:"published",classSection:{program:{organizationId:org.id}}},take:100,
    orderBy:{publishedAt:"desc"},select:{id:true,studentId:true,summary:true,publishedAt:true,classSection:{select:{name:true}},student:{select:{firstName:true,lastName:true}}}}),
   db.studentSubmission.findMany({where:{studentId:{in:ids},assignment:{classSection:{program:{organizationId:org.id}}}},take:100,select:{id:true,studentId:true,assignmentId:true,submittedAt:true}})
  ]);
  const classIds=[...new Set(enrollments.map(x=>x.classId))];
  const assignments=classIds.length?await db.schoolAssignment.findMany({where:{classId:{in:classIds},published:true},
   take:100,orderBy:{dueAt:"asc"},select:{id:true,title:true,instructions:true,dueAt:true,classId:true,classSection:{select:{name:true}}}}):[];
  // Guardians only receive factual submission status/timestamp. Reading the
  // original student narrative is a separate, owner-only scope: current
  // student role + owned student + published assignment + active enrollment.
  // Do not even select other children's answer texts from the database.
  const allowedOwnAssignments=user.role==="student"&&own?
   new Set(assignments.filter(a=>enrollments.some(e=>
    e.studentId===own.id&&e.classId===a.classId)).map(a=>a.id)):new Set<string>();
  const ownReceiptIds=own?submissions.filter(s=>
   s.studentId===own.id&&allowedOwnAssignments.has(s.assignmentId)).map(s=>s.id):[];
  const ownBodies=own&&user.role==="student"&&ownReceiptIds.length?
   await db.studentSubmission.findMany({
    where:{id:{in:ownReceiptIds},studentId:own.id,
     assignment:{published:true,classSection:{program:{organizationId:org.id},
      enrollments:{some:{studentId:own.id,status:"active"}}}}},
    take:100,select:{id:true,body:true}
   }):[];
  const ownBodyById=new Map(ownBodies.map(x=>[x.id,x.body]));
  const receipts=submissions.map(s=>({
   ...s,
   ...(own&&user.role==="student"&&s.studentId===own.id&&ownBodyById.has(s.id)?
    {body:ownBodyById.get(s.id)}:{})
  }));
  return ok({mode:"family",organization:{name:org.name,timeZone:org.timeZone},assignments:assignments.map(a=>({...a,studentIds:enrollments.filter(x=>x.classId===a.classId).map(x=>x.studentId)})),reports,submissions:receipts,
   selfStudentId:own?.id||null});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const input=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true,timeZone:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(input.kind==="submission"){
   // This UI is final-submit only. Do not silently rewrite an existing
   // student's work or its submission timestamp on a retry.
   if(user.role!=="student")throw new HttpError(403,"STUDENT_REQUIRED",
    "Only a current linked student account may submit its work.");
   try{
    const result=await db.$transaction(async tx=>{
     const student=await tx.student.findFirst({
      where:{userId:user.id,...schoolStudentScope(org.id)},select:{id:true}
     });
     if(!student)throw new HttpError(403,"STUDENT_REQUIRED",
      "A verified student link is required.");
     const assignment=await tx.schoolAssignment.findFirst({
      where:{id:input.assignmentId,published:true,
       classSection:{program:{organizationId:org.id}}},
      select:{id:true,classId:true,dueAt:true}
     });
     if(!assignment)throw new HttpError(404,"NOT_FOUND","Assignment unavailable.");
     const enrollment=await tx.enrollment.findFirst({
      where:{studentId:student.id,classId:assignment.classId,status:"active"},
      select:{id:true}
     });
     if(!enrollment)throw new HttpError(403,"NOT_ENROLLED",
      "An active enrollment in this class is required.");
     const submitted=await tx.studentSubmission.findUnique({
      where:{assignmentId_studentId:{assignmentId:assignment.id,studentId:student.id}},
      select:{id:true,body:true,submittedAt:true}
     });
     if(submitted){
      if(submitted.body!==input.body)throw new HttpError(409,"SUBMISSION_FINAL",
       "Your work has already been submitted. Ask the teacher to review a correction.");
      return {id:submitted.id,submittedAt:submitted.submittedAt,alreadySubmitted:true};
     }
     // An existing identical retry may succeed after the deadline, but a
     // brand-new submission must be before the authoritative server cutoff.
     if(assignment.dueAt<=new Date())throw new HttpError(409,"DUE_DATE_PASSED",
      "Submission date has passed. Ask your teacher for assistance.");
     const created=await tx.studentSubmission.create({data:{
      assignmentId:assignment.id,studentId:student.id,body:input.body
     }});
     await tx.auditEvent.create({data:{
      actorId:user.id,action:"school.submission.create",
      entity:"StudentSubmission",entityId:created.id,
      // No assignment response text, child name or learner narrative in audit.
      detail:JSON.stringify({organizationId:org.id,classId:assignment.classId,
       assignmentId:assignment.id,studentId:student.id})
     }});
     return {id:created.id,submittedAt:created.submittedAt,alreadySubmitted:false};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return ok(result);
   }catch(error){
    if(error instanceof Prisma.PrismaClientKnownRequestError&&
       ["P2002","P2034"].includes(error.code))
     throw new HttpError(409,"SUBMISSION_CHANGED",
      "This assignment submission changed. Refresh and try again.");
    throw error;
   }
  }
  if(!["teacher","admin"].includes(user.role))throw new HttpError(403,"FORBIDDEN","Teacher permission required.");
  const classItem=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id},
   ...(user.role==="admin"?{}:{teachers:{some:{teacherId:user.id}}})}});
  if(!classItem)throw new HttpError(403,"NOT_ASSIGNED","You are not assigned to this class.");
  if(input.kind==="assignment"||input.kind==="assignment-local"){
   // A teacher's device timezone is never authoritative for a school deadline.
   // Repeated/absent DST hours must fail closed instead of picking an instant.
   const resolved=input.kind==="assignment-local"?
    resolveMosqueLocalTime(input.dueLocal,org.timeZone):null;
   if(resolved&&!resolved.ok)throw new HttpError(422,resolved.reason,
    "Select a unique valid deadline in the configured mosque timezone.");
   const deadline=input.kind==="assignment-local"&&resolved?.ok?
    resolved.date:new Date(input.kind==="assignment"?input.dueAt:"");
   if(!Number.isFinite(deadline.getTime())||deadline<=new Date())
    throw new HttpError(422,"DUE_IN_PAST","Due date must be in the future.");
   // A published assignment without its audit record is not an acceptable
   // outcome; transactionally create both records.
   const result=await db.$transaction(async tx=>{
    const assignment=await tx.schoolAssignment.create({data:{
     classId:classItem.id,teacherId:user.id,title:input.title,
     instructions:input.instructions,dueAt:deadline,published:input.published
    }});
    await tx.auditEvent.create({data:{actorId:user.id,
     action:"school.assignment.create",entity:"SchoolAssignment",entityId:assignment.id}});
    return assignment;
   });
   return ok({id:result.id,published:result.published,dueAt:result.dueAt,
    timeZone:org.timeZone},201);
  }
  const enrolled=await db.enrollment.findFirst({where:{studentId:input.studentId,classId:classItem.id,status:"active",student:schoolStudentScope(org.id)}});
  if(!enrolled||enrolled.status!=="active")throw new HttpError(404,"NOT_ENROLLED","Student is not enrolled in this class.");
  // Prevent any teacher/admin from bypassing independent child-report review.
  if(input.published)throw new HttpError(409,"REPORT_REVIEW_REQUIRED",
   "Student progress reports require independent review before publication.");
  const result=await db.$transaction(async tx=>{
   const draft=await tx.studentReport.create({data:{
    classId:classItem.id,studentId:input.studentId,teacherId:user.id,
    summary:input.summary,status:"draft",publishedAt:null
   }});
   await tx.auditEvent.create({data:{
    actorId:user.id,action:"school.report.create",entity:"StudentReport",entityId:draft.id,
    detail:JSON.stringify({organizationId:org.id,classId:classItem.id,
     studentId:input.studentId,status:"draft"})
   }});
   return draft;
  });
  return ok({id:result.id,status:result.status},201);
 });
}

// Independent verified administrator review of an unpublished, same-mosque
// student report. No child narratives or free-text reason in the audit record.
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const reviewer=await requireVerified(req,["admin"]);
  const input=reviewReport.parse(await jsonBody(req));
  if((input.action==="publish-report")!==(input.reason==="verified-content"))
   throw new HttpError(422,"REVIEW_REASON","Use an approved reason code for this decision.");
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try{
   const result=await db.$transaction(async tx=>{
    const draft=await tx.studentReport.findFirst({where:{
     id:input.reportId,status:"draft",student:schoolStudentScope(org.id),
     classSection:{program:{organizationId:org.id}}
    },select:{id:true,teacherId:true,classId:true,studentId:true}});
    if(!draft)throw new HttpError(404,"REPORT_UNAVAILABLE",
     "Draft unavailable in your mosque's review queue.");
    if(draft.teacherId===reviewer.id)throw new HttpError(403,
     "INDEPENDENT_REVIEW_REQUIRED","A report author cannot review their own draft.");
    if(input.action==="publish-report"){
     const author=await tx.user.findFirst({where:{
      id:draft.teacherId,status:"active",verifiedAt:{not:null},
      role:{in:["teacher","admin"]},
      memberships:{some:{organizationId:org.id,status:"active"}}
     },select:{id:true,role:true}});
     if(!author)throw new HttpError(409,"REPORT_AUTHOR_INACTIVE",
      "Draft author is no longer eligible to publish student records.");
     if(author.role==="teacher"){
      const assigned=await tx.teacherAssignment.findUnique({
       where:{teacherId_classId:{teacherId:author.id,classId:draft.classId}},
       select:{classId:true}
      });
      if(!assigned)throw new HttpError(409,"REPORT_AUTHOR_UNASSIGNED",
       "The draft author no longer teaches this class.");
     }
     const enrollment=await tx.enrollment.findFirst({where:{
      studentId:draft.studentId,classId:draft.classId,status:"active",
      student:schoolStudentScope(org.id)
     },select:{id:true}});
     if(!enrollment)throw new HttpError(409,"REPORT_STUDENT_INACTIVE",
      "Student is not actively enrolled. Do not publish.");
    }
    const published=input.action==="publish-report";
    const updated=await tx.studentReport.updateMany({where:{
     id:draft.id,status:"draft",classId:draft.classId,studentId:draft.studentId
    },data:{status:published?"published":"archived",
     publishedAt:published?new Date():null}});
    if(!updated.count)throw new HttpError(409,"REPORT_CHANGED",
     "This draft has already been reviewed.");
    await tx.auditEvent.create({data:{
     actorId:reviewer.id,action:published?"school.report.publish":"school.report.reject",
     entity:"StudentReport",entityId:draft.id,
     detail:JSON.stringify({organizationId:org.id,classId:draft.classId,
      studentId:draft.studentId,authorId:draft.teacherId,reason:input.reason})
    }});
    return {id:draft.id,status:published?"published":"archived"};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"REPORT_CHANGED","Another reviewer changed this report.");
   throw error;
  }
 });
}

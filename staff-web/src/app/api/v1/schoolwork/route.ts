import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import {mayViewGuardianRecords} from "@/lib/school-role-policy";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("assignment"),classId:z.string().min(8),title:z.string().trim().min(4).max(180),instructions:z.string().trim().min(10).max(8000),dueAt:z.iso.datetime(),published:z.boolean().default(false)}),
 z.object({kind:z.literal("submission"),assignmentId:z.string().min(8),body:z.string().trim().min(1).max(10000)}),
 z.object({kind:z.literal("report"),classId:z.string().min(8),studentId:z.string().min(8),summary:z.string().trim().min(10).max(5000),published:z.boolean().default(false)}),
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(user.role==="teacher"||user.role==="admin"){
   const classes=await db.classSection.findMany({where:{program:{organizationId:org.id},
    ...(user.role==="teacher"?{teachers:{some:{teacherId:user.id}}}:{})},
    take:100,select:{id:true,name:true,assignments:{orderBy:{createdAt:"desc"},take:50,
     select:{id:true,title:true,instructions:true,dueAt:true,published:true,
       submissions:{where:{student:schoolStudentScope(org.id)},select:{studentId:true,body:true,submittedAt:true,student:{select:{firstName:true,lastName:true}}}}}},
     enrollments:{where:{status:"active",student:schoolStudentScope(org.id)},select:{student:{select:{id:true,firstName:true,lastName:true}}}},
    }});
   return ok({mode:"teacher",classes});
  }
  const [own,links]=await Promise.all([
   db.student.findFirst({where:{userId:user.id,...schoolStudentScope(org.id)},select:{id:true}}),
   mayViewGuardianRecords(user.role)?db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null,student:schoolStudentScope(org.id)},select:{studentId:true}}):Promise.resolve([])
  ]);
  const ids=[...new Set([...(own?[own.id]:[]),...links.map(x=>x.studentId)])];
  if(!ids.length)return ok({mode:"family",assignments:[],reports:[],submissions:[]});
  const [enrollments,reports,submissions]=await Promise.all([
   db.enrollment.findMany({where:{studentId:{in:ids},status:"active",classSection:{program:{organizationId:org.id}}},select:{studentId:true,classId:true}}),
   db.studentReport.findMany({where:{studentId:{in:ids},status:"published",classSection:{program:{organizationId:org.id}}},take:100,
    orderBy:{publishedAt:"desc"},select:{id:true,studentId:true,summary:true,publishedAt:true,classSection:{select:{name:true}},student:{select:{firstName:true,lastName:true}}}}),
   db.studentSubmission.findMany({where:{studentId:{in:ids},assignment:{classSection:{program:{organizationId:org.id}}}},take:100,select:{id:true,studentId:true,assignmentId:true,submittedAt:true}})
  ]);
  const classIds=[...new Set(enrollments.map(x=>x.classId))];
  const assignments=classIds.length?await db.schoolAssignment.findMany({where:{classId:{in:classIds},published:true},
   take:100,orderBy:{dueAt:"asc"},select:{id:true,title:true,instructions:true,dueAt:true,classId:true,classSection:{select:{name:true}}}}):[];
  return ok({mode:"family",assignments:assignments.map(a=>({...a,studentIds:enrollments.filter(x=>x.classId===a.classId).map(x=>x.studentId)})),reports,submissions,
   selfStudentId:own?.id||null});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const input=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(input.kind==="submission"){
   const student=await db.student.findFirst({where:{userId:user.id,...schoolStudentScope(org.id)}});
   if(!student)throw new HttpError(403,"STUDENT_REQUIRED","Only a linked student account may submit its work.");
   const assignment=await db.schoolAssignment.findFirst({where:{id:input.assignmentId,published:true,
    classSection:{program:{organizationId:org.id}}}});
   if(!assignment)throw new HttpError(404,"NOT_FOUND","Assignment unavailable.");
   const enrollment=await db.enrollment.findUnique({where:{studentId_classId:{studentId:student.id,classId:assignment.classId}}});
   if(!enrollment||enrollment.status!=="active")throw new HttpError(403,"NOT_ENROLLED","Not enrolled in this class.");
   if(assignment.dueAt<new Date())throw new HttpError(409,"DUE_DATE_PASSED","Submission date has passed. Ask your teacher for assistance.");
   const submission=await db.studentSubmission.upsert({where:{assignmentId_studentId:{assignmentId:assignment.id,studentId:student.id}},
    create:{assignmentId:assignment.id,studentId:student.id,body:input.body},update:{body:input.body,submittedAt:new Date()}});
   return ok({id:submission.id,submittedAt:submission.submittedAt});
  }
  if(!["teacher","admin"].includes(user.role))throw new HttpError(403,"FORBIDDEN","Teacher permission required.");
  const classItem=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id},
   ...(user.role==="admin"?{}:{teachers:{some:{teacherId:user.id}}})}});
  if(!classItem)throw new HttpError(403,"NOT_ASSIGNED","You are not assigned to this class.");
  if(input.kind==="assignment"){
   if(new Date(input.dueAt)<new Date())throw new HttpError(422,"DUE_IN_PAST","Due date must be in the future.");
   const result=await db.schoolAssignment.create({data:{classId:classItem.id,teacherId:user.id,title:input.title,instructions:input.instructions,
    dueAt:new Date(input.dueAt),published:input.published}});
   await db.auditEvent.create({data:{actorId:user.id,action:"school.assignment.create",entity:"SchoolAssignment",entityId:result.id}});
   return ok({id:result.id,published:result.published},201);
  }
  const enrolled=await db.enrollment.findFirst({where:{studentId:input.studentId,classId:classItem.id,status:"active",student:schoolStudentScope(org.id)}});
  if(!enrolled||enrolled.status!=="active")throw new HttpError(404,"NOT_ENROLLED","Student is not enrolled in this class.");
  const result=await db.studentReport.create({data:{classId:classItem.id,studentId:input.studentId,teacherId:user.id,summary:input.summary,
   status:input.published?"published":"draft",publishedAt:input.published?new Date():null}});
  await db.auditEvent.create({data:{actorId:user.id,action:"school.report.create",entity:"StudentReport",entityId:result.id}});
  return ok({id:result.id,status:result.status},201);
 });
}

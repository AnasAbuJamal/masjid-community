import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireVerified } from "@/lib/auth";
import { schoolStudentScope } from "@/lib/school-scope";
import { assertSameOrigin, handled, HttpError, jsonBody, ok } from "@/lib/http";

const label=z.string().trim().min(2).max(120);
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("class"),programId:z.string().min(8),name:label,schedule:z.string().trim().min(3).max(200),capacity:z.number().int().positive().max(200).optional()}),
 z.object({kind:z.literal("student"),studentNumber:z.string().trim().min(2).max(60),firstName:label,lastName:label}),
 z.object({kind:z.literal("guardian-link"),studentId:z.string().min(8),guardianId:z.string().min(8)}),
 z.object({kind:z.literal("teacher-assignment"),classId:z.string().min(8),teacherId:z.string().min(8)}),
 z.object({kind:z.literal("enrollment"),classId:z.string().min(8),studentId:z.string().min(8)}),
 z.object({kind:z.literal("class-session"),classId:z.string().min(8),startsAt:z.iso.datetime()}),
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","No organization has been configured.");
  const [users,programs,students,sessions]=await Promise.all([
    db.user.findMany({where:{status:"active",memberships:{some:{organizationId:org.id,status:"active"}}},select:{id:true,email:true,firstName:true,lastName:true,role:true,verifiedAt:true},take:100,orderBy:{createdAt:"desc"}}),
    db.schoolProgram.findMany({where:{organizationId:org.id},take:100,include:{classes:{select:{id:true,name:true,schedule:true,capacity:true,enrollments:{where:{status:"active"},select:{id:true}}}}}}),
    db.student.findMany({where:schoolStudentScope(org.id),take:100,orderBy:{studentNumber:"asc"},select:{id:true,studentNumber:true,firstName:true,lastName:true,
     guardians:{where:{guardian:{memberships:{some:{organizationId:org.id,status:"active"}}}},select:{id:true,guardianId:true,approvedAt:true,revokedAt:true}},
     enrollments:{where:{classSection:{program:{organizationId:org.id}}},select:{classSection:{select:{name:true,id:true}},status:true}}}}),
    db.classSession.findMany({where:{classSection:{program:{organizationId:org.id}}},take:80,orderBy:{startsAt:"desc"},select:{id:true,startsAt:true,classId:true,classSection:{select:{name:true}}}})
  ]);
  return ok({users,programs,students,sessions});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  let id:string;
  let created=true;
  if(input.kind==="class"){
    const program=await db.schoolProgram.findFirst({where:{id:input.programId,organizationId:org.id}});
    if(!program)throw new HttpError(404,"NOT_FOUND","Program unavailable.");
    const row=await db.classSection.create({data:{programId:program.id,name:input.name,schedule:input.schedule,capacity:input.capacity}});
    id=row.id;
  }else if(input.kind==="student"){
    const row=await db.student.create({data:{organizationId:org.id,studentNumber:input.studentNumber,firstName:input.firstName,lastName:input.lastName}});id=row.id;
  }else if(input.kind==="guardian-link"){
    const [student,guardian]=await Promise.all([
      db.student.findFirst({where:{id:input.studentId,...schoolStudentScope(org.id)}}),
      db.user.findFirst({where:{id:input.guardianId,status:"active",verifiedAt:{not:null},role:{not:"student"},
        memberships:{some:{organizationId:org.id,status:"active"}}}})
    ]);
    if(!student)throw new HttpError(404,"STUDENT_NOT_FOUND","Student unavailable in this organization.");
    if(!guardian)throw new HttpError(422,"INVALID_GUARDIAN","Choose a verified adult member of this organization.");
    const existing=await db.guardianLink.findUnique({where:{guardianId_studentId:{guardianId:guardian.id,studentId:student.id}}});
    // Reinstating a revoked custody/guardian link is a new safeguarding decision,
    // not an idempotent retry. This one-person admin form must fail closed.
    if(existing?.revokedAt)throw new HttpError(409,"GUARDIAN_REVOKED",
      "A revoked guardian relationship requires separate safeguarding review.");
    const row=await db.guardianLink.upsert({where:{guardianId_studentId:{guardianId:guardian.id,studentId:student.id}},
      update:{approvedAt:existing?.approvedAt||new Date(),revokedAt:null},
      create:{guardianId:guardian.id,studentId:student.id,approvedAt:new Date()}});
    id=row.id;
  }else if(input.kind==="teacher-assignment"){
    const teacher=await db.user.findFirst({where:{id:input.teacherId,role:"teacher",status:"active",verifiedAt:{not:null},
      memberships:{some:{organizationId:org.id,status:"active"}}}});
    if(!teacher)throw new HttpError(422,"NOT_TEACHER","Choose a verified teacher member of this organization.");
    const klass=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}}});
    if(!klass)throw new HttpError(404,"NOT_FOUND","Class unavailable.");
    const row=await db.teacherAssignment.upsert({where:{teacherId_classId:{teacherId:teacher.id,classId:klass.id}},update:{},create:{teacherId:teacher.id,classId:klass.id}});
    id=row.id;
  }else if(input.kind==="enrollment"){
    const klass=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}}});
    const student=await db.student.findFirst({where:{id:input.studentId,...schoolStudentScope(org.id)}});
    if(!klass||!student)throw new HttpError(404,"NOT_FOUND","Class or student unavailable.");
    try{
     const row=await db.$transaction(async tx=>{
      // Read capacity and enrollment in one serializable snapshot. A concurrent
      // last-seat claim must conflict rather than create an oversubscribed class.
      const scoped=await tx.classSection.findFirst({where:{id:klass.id,program:{organizationId:org.id}},
       select:{id:true,capacity:true}});
      if(!scoped)throw new HttpError(404,"NOT_FOUND","Class unavailable.");
      const existing=await tx.enrollment.findUnique({where:{studentId_classId:{studentId:student.id,classId:scoped.id}}});
      if(existing){
       if(existing.status!=="active")
        throw new HttpError(409,"ENROLLMENT_INACTIVE","A previous enrollment is inactive. Staff review is required.");
       created=false;
       return existing;
      }
      const oldestWaiting=await tx.schoolWaitlist.findFirst({where:{
       classId:scoped.id,status:"waiting"
      },orderBy:[{requestedAt:"asc"},{id:"asc"}],select:{id:true}});
      if(oldestWaiting)throw new HttpError(409,"WAITLIST_PRIORITY",
       "This class has a reviewed waitlist. Promote its earliest eligible child before accepting a new direct enrollment.");
      if(scoped.capacity!==null){
       const occupied=await tx.enrollment.count({where:{classId:scoped.id,status:"active"}});
       if(occupied>=scoped.capacity)throw new HttpError(409,"CLASS_FULL","No available seats.");
      }
      return tx.enrollment.create({data:{studentId:student.id,classId:scoped.id}});
     },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
     id=row.id;
    }catch(error){
     if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(error.code))
      throw new HttpError(409,"RETRY_ENROLLMENT","Class enrollment changed. Refresh available seats and retry.");
     throw error;
    }
  }else{
    const klass=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}}});
    if(!klass)throw new HttpError(404,"NOT_FOUND","Class unavailable.");
    const row=await db.classSession.create({data:{classId:klass.id,startsAt:new Date(input.startsAt)}});id=row.id;
  }
  await audit(admin.id,created?"school."+input.kind:"school."+input.kind+".existing","School",id);
  return ok({id,created},created?201:200);
 });
}

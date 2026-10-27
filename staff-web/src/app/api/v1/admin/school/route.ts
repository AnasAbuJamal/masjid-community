import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireVerified } from "@/lib/auth";
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
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","No organization has been configured.");
  const [users,programs,students,sessions]=await Promise.all([
    db.user.findMany({where:{status:"active"},select:{id:true,email:true,firstName:true,lastName:true,role:true,verifiedAt:true},take:100,orderBy:{createdAt:"desc"}}),
    db.schoolProgram.findMany({where:{organizationId:org.id},take:100,include:{classes:{select:{id:true,name:true,schedule:true,capacity:true,enrollments:{select:{id:true}}}}}}),
    db.student.findMany({take:100,orderBy:{studentNumber:"asc"},select:{id:true,studentNumber:true,firstName:true,lastName:true,
     guardians:{select:{id:true,guardianId:true,approvedAt:true,revokedAt:true}},
     enrollments:{select:{classSection:{select:{name:true,id:true}},status:true}}}}),
    db.classSession.findMany({take:80,orderBy:{startsAt:"desc"},select:{id:true,startsAt:true,classId:true,classSection:{select:{name:true}}}})
  ]);
  return ok({users,programs,students,sessions});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  let id:string;
  if(input.kind==="class"){
    const program=await db.schoolProgram.findFirst({where:{id:input.programId,organizationId:org.id}});
    if(!program)throw new HttpError(404,"NOT_FOUND","Program unavailable.");
    const row=await db.classSection.create({data:{programId:program.id,name:input.name,schedule:input.schedule,capacity:input.capacity}});
    id=row.id;
  }else if(input.kind==="student"){
    const row=await db.student.create({data:{studentNumber:input.studentNumber,firstName:input.firstName,lastName:input.lastName}});id=row.id;
  }else if(input.kind==="guardian-link"){
    const [student,guardian]=await Promise.all([db.student.findUnique({where:{id:input.studentId}}),db.user.findUnique({where:{id:input.guardianId}})]);
    if(!student||!guardian||guardian.status!=="active"||!guardian.verifiedAt||guardian.role==="student")throw new HttpError(422,"INVALID_GUARDIAN","Use a verified adult account and existing student.");
    const existing=await db.guardianLink.findUnique({where:{guardianId_studentId:{guardianId:guardian.id,studentId:student.id}}});
    const row=await db.guardianLink.upsert({where:{guardianId_studentId:{guardianId:guardian.id,studentId:student.id}},
      update:{approvedAt:existing?.approvedAt||new Date(),revokedAt:null},
      create:{guardianId:guardian.id,studentId:student.id,approvedAt:new Date()}});
    id=row.id;
  }else if(input.kind==="teacher-assignment"){
    const teacher=await db.user.findUnique({where:{id:input.teacherId}});
    if(!teacher||teacher.role!=="teacher"||!teacher.verifiedAt)throw new HttpError(422,"NOT_TEACHER","Choose a verified teacher account.");
    const klass=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}}});
    if(!klass)throw new HttpError(404,"NOT_FOUND","Class unavailable.");
    const row=await db.teacherAssignment.upsert({where:{teacherId_classId:{teacherId:teacher.id,classId:klass.id}},update:{},create:{teacherId:teacher.id,classId:klass.id}});
    id=row.id;
  }else if(input.kind==="enrollment"){
    const klass=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}}});
    const student=await db.student.findUnique({where:{id:input.studentId}});
    if(!klass||!student)throw new HttpError(404,"NOT_FOUND","Class or student unavailable.");
    const row=await db.$transaction(async tx=>{
      const existing=await tx.enrollment.findUnique({where:{studentId_classId:{studentId:student.id,classId:klass.id}}});
      if(existing)return existing;
      if(klass.capacity!==null){
        const occupied=await tx.enrollment.count({where:{classId:klass.id,status:"active"}});
        if(occupied>=klass.capacity)throw new HttpError(409,"CLASS_FULL","No available seats.");
      }
      return tx.enrollment.create({data:{studentId:student.id,classId:klass.id}});
    },{isolationLevel:"Serializable"});
    id=row.id;
  }else{
    const klass=await db.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}}});
    if(!klass)throw new HttpError(404,"NOT_FOUND","Class unavailable.");
    const row=await db.classSession.create({data:{classId:klass.id,startsAt:new Date(input.startsAt)}});id=row.id;
  }
  await audit(admin.id,"school."+input.kind,"School",id);
  return ok({id,created:true},201);
 });
}

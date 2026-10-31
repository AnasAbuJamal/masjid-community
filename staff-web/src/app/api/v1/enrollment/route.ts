import {NextRequest} from "next/server";
import {z} from "zod";
import {Prisma} from "@prisma/client";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const form=z.object({programId:z.string().min(8),studentFirstName:z.string().trim().min(2).max(120),
 studentLastName:z.string().trim().min(2).max(120),notes:z.string().trim().max(1000).optional(),
 reviewAcknowledged:z.literal(true)}).strict();
export async function GET(req:NextRequest){
 return handled(async()=>{
  const actor=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const applications=await db.enrollmentApplication.findMany({where:{applicantUserId:actor.id,organizationId:org.id},take:100,orderBy:{createdAt:"desc"},
   select:{id:true,studentFirstName:true,studentLastName:true,status:true,createdAt:true,decisionReason:true,
     program:{select:{title:true}},approvedStudentId:true}});
  return ok({applications});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireVerified(req);
  if(actor.role==="student")throw new HttpError(403,"GUARDIAN_REQUIRED","A verified adult must submit applications.");
  const input=form.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try{
   const app=await db.$transaction(async tx=>{
    // A successful previous session check cannot substitute for current
    // eligibility: re-read within the same transaction as the child record.
    const current=await tx.user.findFirst({where:{
     id:actor.id,status:"active",verifiedAt:{not:null},role:{not:"student"},
     memberships:{some:{organizationId:org.id,status:"active"}}
    },select:{id:true}});
    if(!current)throw new HttpError(403,"GUARDIAN_REQUIRED",
     "An active, verified non-student mosque member must apply for review.");
    const program=await tx.schoolProgram.findFirst({
     where:{id:input.programId,organizationId:org.id,published:true},
     select:{id:true,organizationId:true}
    });
    if(!program)throw new HttpError(404,"NOT_FOUND","Program unavailable.");
    const recent=await tx.enrollmentApplication.findFirst({where:{
     applicantUserId:actor.id,organizationId:org.id,programId:program.id,
     status:"submitted",studentFirstName:input.studentFirstName,
     studentLastName:input.studentLastName
    },select:{id:true}});
    if(recent)throw new HttpError(409,"APPLICATION_EXISTS",
     "This child's application is already awaiting review.");
    return tx.enrollmentApplication.create({data:{
     organizationId:program.organizationId,programId:program.id,
     applicantUserId:actor.id,studentFirstName:input.studentFirstName,
     studentLastName:input.studentLastName,notes:input.notes,
     reviewAcknowledgedAt:new Date(),reviewAcknowledgementVersion:"guardian-review-v1"
    },select:{id:true,status:true}});
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok({id:app.id,status:app.status,
    message:"Your application was submitted for school review. Enrollment is not yet approved."},201);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&
      ["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"APPLICATION_CHANGED",
     "Another submission changed this application. Refresh your applications before retrying.");
   throw error;
  }
 });
}

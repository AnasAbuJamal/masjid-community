import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const jobs=await db.jobPosting.findMany({where:{organizationId:org.id},take:70,
   select:{id:true,title:true,company:true,status:true,
    applications:{select:{id:true,status:true,coverLetter:true,reviewedAt:true,user:{
      select:{firstName:true,lastName:true,email:true}}}}}});
  return ok({jobs});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireVerified(req,["admin"]);
  const {applicationId,status}=z.object({applicationId:z.string().min(8),status:z.enum(["approved","declined"])}).parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const app=await db.jobApplication.findFirst({where:{id:applicationId,job:{organizationId:org.id}}});
  if(!app)throw new HttpError(404,"NOT_FOUND","Job application not found.");
  await db.$transaction(async tx=>{
   const changed=await tx.jobApplication.updateMany({where:{id:app.id,status:"submitted"},data:{status,reviewedAt:new Date(),reviewerId:actor.id}});
   if(!changed.count)throw new HttpError(409,"ALREADY_REVIEWED","This application already has a decision.");
   await tx.auditEvent.create({data:{actorId:actor.id,action:"job.application."+status,entity:"JobApplication",entityId:app.id}});
   await tx.notification.create({data:{userId:app.userId,title:"Your job application was reviewed",
    body:status==="approved"?"Your application moved forward. The organizer may contact you with details.":"Your application was not selected at this stage."}});
  });
  return ok({id:app.id,status});
 });
}

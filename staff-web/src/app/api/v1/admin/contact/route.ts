import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireCapability} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireCapability(req,"community_moderate");
  const org=await db.organization.findFirst();
  const requests=org?await db.contactSubmission.findMany({where:{organizationId:org.id},take:100,orderBy:{createdAt:"desc"},
   select:{id:true,name:true,email:true,subject:true,message:true,status:true,createdAt:true,reviewedAt:true}}):[];
  return ok({requests});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireCapability(req,"community_moderate");
  const {id,status}=z.object({id:z.string().min(8),status:z.enum(["in_review","closed"])}).parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const updated=await db.contactSubmission.updateMany({where:{id,organizationId:org.id,status:{not:"closed"}},data:{status,reviewedAt:new Date()}});
  if(!updated.count)throw new HttpError(409,"NOT_UPDATEABLE","Request was already closed or is unavailable.");
  await db.auditEvent.create({data:{actorId:user.id,action:"contact."+status,entity:"ContactSubmission",entityId:id}});
  return ok({id,status});
 });
}

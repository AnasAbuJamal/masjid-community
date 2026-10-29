import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const requests=await db.deletionRequest.findMany({where:{organizationId:org.id},take:100,orderBy:{createdAt:"desc"},
   select:{id:true,status:true,reason:true,createdAt:true,reviewedAt:true,user:{select:{firstName:true,lastName:true,email:true}}}});
  return ok({requests,disclaimer:"Marking a request under review does not delete data. Data removal must follow legal, school and financial retention review."});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const {id,status}=z.object({id:z.string().min(8),status:z.enum(["in_review","rejected"])}).parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const changed=await db.$transaction(async tx=>{
   const updated=await tx.deletionRequest.updateMany({where:{
    id,organizationId:org.id,status:"pending"
   },data:{status,reviewedById:admin.id,reviewedAt:new Date()}});
   if(!updated.count)throw new HttpError(409,"NOT_PENDING","Request not pending in this organization.");
   await tx.auditEvent.create({data:{
    actorId:admin.id,action:"privacy.deletion."+status,entity:"DeletionRequest",
    entityId:id,detail:JSON.stringify({organizationId:org.id})
   }});
   return true;
  });
  if(!changed)throw new HttpError(409,"NOT_PENDING","Request not pending.");
  return ok({id,status});
 });
}

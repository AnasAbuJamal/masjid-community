import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const requests=await db.deletionRequest.findMany({take:100,orderBy:{createdAt:"desc"},
   select:{id:true,status:true,reason:true,createdAt:true,reviewedAt:true,user:{select:{firstName:true,lastName:true,email:true}}}});
  return ok({requests,disclaimer:"Marking a request under review does not delete data. Data removal must follow legal, school and financial retention review."});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const {id,status}=z.object({id:z.string().min(8),status:z.enum(["in_review","rejected"])}).parse(await jsonBody(req));
  const updated=await db.deletionRequest.updateMany({where:{id,status:"pending"},data:{status,reviewedById:admin.id,reviewedAt:new Date()}});
  if(!updated.count)throw new HttpError(409,"NOT_PENDING","Request not pending.");
  await db.auditEvent.create({data:{actorId:admin.id,action:"privacy.deletion."+status,entity:"DeletionRequest",entityId:id}});
  return ok({id,status});
 });
}

import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const {confirm,reason}=z.object({confirm:z.literal(true),reason:z.string().trim().max(500).optional()}).parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const existing=await db.deletionRequest.findFirst({where:{
   userId:user.id,organizationId:org.id,status:{in:["pending","in_review"]}
  },orderBy:{createdAt:"desc"}});
  if(existing)return ok({id:existing.id,status:existing.status,message:"Your mosque-specific request is already awaiting review."});
  const item=await db.deletionRequest.create({data:{
   organizationId:org.id,userId:user.id,reason
  }});
  await db.auditEvent.create({data:{
   actorId:user.id,action:"account.deletion.request",entity:"DeletionRequest",entityId:item.id,
   detail:JSON.stringify({organizationId:org.id})
  }});
  return ok({id:item.id,status:item.status,message:"Your mosque-specific data request is queued for human review. No account or data has been deleted."},201);
 });
}

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
  const existing=await db.deletionRequest.findFirst({where:{userId:user.id,status:{in:["pending","in_review"]}}});
  if(existing)return ok({id:existing.id,status:existing.status,message:"Your request is already queued for review."});
  const item=await db.deletionRequest.create({data:{userId:user.id,reason}});
  await db.auditEvent.create({data:{actorId:user.id,action:"account.deletion.request",entity:"DeletionRequest",entityId:item.id}});
  return ok({id:item.id,status:item.status,message:"Your deletion request has been recorded for review. No data has been deleted yet."},201);
 });
}

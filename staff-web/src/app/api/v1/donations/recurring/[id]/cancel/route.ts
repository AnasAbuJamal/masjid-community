import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
import {cancelRecurringSubscription} from "@/lib/recurring-provider";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 return handled(async()=>{
  assertSameOrigin(req);const user=await requireVerified(req);
  z.object({confirm:z.literal(true)}).strict().parse(await jsonBody(req));
  const {id}=await params;
  const org=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}});
  const gift=await db.recurringGift.findFirst({where:{id,donorId:user.id,campaign:{organizationId:org.id}}});
  if(!gift)throw new HttpError(404,"NOT_FOUND","Monthly gift unavailable.");
  if(gift.status==="cancelled")return ok({giftId:gift.id,status:"cancelled",cancelled:true,pending:false});
  if(!gift.stripeSubscriptionId)throw new HttpError(409,"RECURRING_NOT_LINKED","Provider mandate is not yet linked. Review again after checkout verification.");
  await db.$transaction(async tx=>{
   await tx.recurringGift.update({where:{id:gift.id},data:{cancelRequestedAt:gift.cancelRequestedAt||new Date()}});
   await tx.auditEvent.create({data:{actorId:user.id,action:"giving.recurring.cancel_request",entity:"RecurringGift",entityId:gift.id,
    detail:JSON.stringify({organizationId:org.id})}});
  });
  try{
   const response=await cancelRecurringSubscription(gift.stripeSubscriptionId);
   if(response.id!==gift.stripeSubscriptionId||response.status!=="canceled")throw Error("Cancellation unverified");
   await db.$transaction(async tx=>{
    await tx.recurringGift.update({where:{id:gift.id},data:{status:"cancelled"}});
    await tx.auditEvent.create({data:{actorId:user.id,action:"giving.recurring.cancel_confirmed",entity:"RecurringGift",entityId:gift.id,
     detail:JSON.stringify({organizationId:org.id,source:"provider_response"})}});
   });
   return ok({giftId:gift.id,status:"cancelled",cancelled:true,pending:false});
  }catch{return ok({giftId:gift.id,status:gift.status,cancelled:false,pending:true},202);}
 });
}

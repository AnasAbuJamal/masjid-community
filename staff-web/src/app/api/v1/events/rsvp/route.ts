import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function DELETE(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const {eventId}=z.object({eventId:z.string().min(8)}).parse(await jsonBody(req));
  const result=await db.$transaction(async tx=>{
   const event=await tx.event.findUnique({where:{id:eventId}});
   if(!event)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
   if(event.startAt<=new Date())throw new HttpError(409,"EVENT_STARTED","Event registration cannot be cancelled after the start.");
   const current=await tx.eventRSVP.findUnique({where:{eventId_userId:{eventId,userId:user.id}}});
   if(!current)return {cancelled:true,alreadyCancelled:true};
   await tx.eventRSVP.delete({where:{id:current.id}});
   await tx.event.updateMany({where:{id:eventId,rsvpCount:{gt:0}},data:{rsvpCount:{decrement:1}}});
   return {cancelled:true,alreadyCancelled:false};
  },{isolationLevel:"Serializable"});
  return ok(result);
 });
}

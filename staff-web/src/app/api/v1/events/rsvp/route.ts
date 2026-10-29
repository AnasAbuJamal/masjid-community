import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {notifyUser} from "@/lib/notifications";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

export async function DELETE(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const {eventId}=z.object({eventId:z.string().min(8)}).parse(await jsonBody(req));
  const organization=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!organization)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try{
   const result=await db.$transaction(async tx=>{
    const event=await tx.event.findFirst({where:{id:eventId,organizationId:organization.id}});
    if(!event)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
    if(event.startAt<=new Date())
     throw new HttpError(409,"EVENT_STARTED","Event registration cannot be cancelled after the start.");
    const current=await tx.eventRSVP.findUnique({where:{eventId_userId:{eventId,userId:user.id}}});
    if(!current)return {cancelled:true,alreadyCancelled:true,promotedWaitlist:false};
    if(current.checkedInAt)
     throw new HttpError(409,"ALREADY_CHECKED_IN","An attendee who has checked in requires an audited host correction before cancellation.");
    await tx.eventRSVP.delete({where:{id:current.id}});
    let promotedWaitlist=false;
    if(current.status==="confirmed"){
     const next=await tx.eventRSVP.findFirst({
      where:{eventId,status:"waitlisted"},orderBy:[{createdAt:"asc"},{id:"asc"}]
     });
     if(next){
      const updated=await tx.eventRSVP.updateMany({where:{id:next.id,status:"waitlisted"},data:{status:"confirmed"}});
      if(!updated.count)throw new HttpError(409,"RESERVATION_CHANGED","The waitlist has changed. Please retry.");
      await notifyUser(tx,next.userId,"Your event place is confirmed",
       "You have been promoted from the event waitlist to a confirmed reservation. Review your account for details.");
      promotedWaitlist=true;
     }else{
      const lowered=await tx.event.updateMany({where:{id:eventId,rsvpCount:{gt:0}},
       data:{rsvpCount:{decrement:1}}});
      if(!lowered.count)throw new HttpError(409,"COUNT_MISMATCH","Registration count changed. Please retry.");
     }
    }
    await tx.auditEvent.create({data:{actorId:user.id,action:"event.rsvp.cancel",entity:"EventRSVP",
     entityId:current.id,detail:JSON.stringify({eventId,status:current.status,promotedWaitlist})}});
    return {cancelled:true,alreadyCancelled:false,promotedWaitlist};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"RETRY_RESERVATION","Another reservation changed. Please try again.");
   throw error;
  }
 });
}

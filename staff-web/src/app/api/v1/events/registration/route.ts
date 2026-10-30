import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";

// No public attendee rosters. Return only the authenticated member's own
// confirmed or waitlisted state for an event at their current organization.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org}=await requireMemberContext(req);
  const eventId=z.string().min(8).parse(req.nextUrl.searchParams.get("eventId"));
  const event=await db.event.findFirst({where:{id:eventId,organizationId:org.id},select:{id:true}});
  if(!event)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
  const registration=await db.eventRSVP.findUnique({
   where:{eventId_userId:{eventId:event.id,userId:user.id}},
   select:{status:true,createdAt:true,checkedInAt:true}
  });
  return ok({eventId,registration});
 });
}

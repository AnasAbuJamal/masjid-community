import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
import {handled,HttpError} from "@/lib/http";
import {calendarResponse} from "@/lib/event-calendar";

// Current active verified membership owns the event. A guessed ID or
// x-organization-id header cannot switch the tenant, and no roster is returned.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {org}=await requireMemberContext(req);
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>k!=="eventId")||
     params.getAll("eventId").length!==1)
   throw new HttpError(422,"BAD_QUERY","Provide one gathering eventId.");
  const eventId=z.string().min(8).max(128).parse(params.get("eventId"));
  const event=await db.event.findFirst({
   where:{id:eventId,organizationId:org.id,status:"published"},
   select:{id:true,title:true,description:true,location:true,startAt:true,endAt:true}
  });
  if(!event)throw new HttpError(404,"NOT_FOUND","Published gathering unavailable.");
  return calendarResponse(event);
 });
}

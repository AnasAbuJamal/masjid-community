import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";

// F-007/F-048 authenticated discovery: only the mosque held by the verified
// server-side session is authoritative. This is not a public multi-tenant API.
// Never trust a client-supplied organization header or ID to select a tenant.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {org}=await requireMemberContext(req);
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(key=>key!=="eventId")||params.getAll("eventId").length>1)
   throw new HttpError(422,"BAD_QUERY","Only one eventId filter is supported.");
  const rawId=params.get("eventId");
  const eventId=rawId===null?null:z.string().min(8).max(128).parse(rawId);
  const select={
   id:true,title:true,description:true,location:true,startAt:true,endAt:true,
   capacity:true,rsvpCount:true,waitlistEnabled:true
  } as const;
  const items=eventId?await db.event.findMany({
   where:{id:eventId,organizationId:org.id,status:"published"},
   select,take:1
  }):await db.event.findMany({
   where:{organizationId:org.id,status:"published",startAt:{gte:new Date()}},
   orderBy:[{startAt:"asc"},{id:"asc"}],take:50,select
  });
  if(eventId&&!items.length)throw new HttpError(404,"NOT_FOUND","Gathering unavailable.");
  return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},items,
   scope:"current_verified_membership",
   note:"Only published gatherings in your currently selected mosque. Upcoming list is capped at 50; direct published gathering links can be opened separately."});
 });
}

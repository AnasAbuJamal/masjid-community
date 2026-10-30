import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {handled,HttpError} from "@/lib/http";
import {calendarResponse} from "@/lib/event-calendar";
type Context={params:Promise<{id:string}>};

// Guest calendar: published events at the original public pilot mosque.
// This is NOT authorization for any second-mosque attendee or private roster.
export async function GET(_req:NextRequest,{params}:Context){
 return handled(async()=>{
  const {id}=await params;
  const org=await db.organization.findFirst({
   orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}
  });
  if(!org)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
  const event=await db.event.findFirst({
   where:{id,organizationId:org.id,status:"published"},
   select:{id:true,title:true,description:true,location:true,startAt:true,endAt:true}
  });
  if(!event)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
  return calendarResponse(event);
 });
}

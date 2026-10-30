import {NextRequest} from "next/server";
import {z} from "zod";
import type {Prisma} from "@prisma/client";
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
  if([...params.keys()].some(key=>!["eventId","q"].includes(key))||
   params.getAll("eventId").length>1||params.getAll("q").length>1||
   (params.has("eventId")&&params.has("q")))
   throw new HttpError(422,"BAD_QUERY","Use either one eventId or one search query.");
  const rawId=params.get("eventId");
  const eventId=rawId===null?null:z.string().min(8).max(128).parse(rawId);
  const rawQuery=params.get("q");
  const q=rawQuery===null?null:z.string().trim().min(2).max(80).parse(rawQuery);
  // Parameterized, bounded text search: no unpublished/cross-mosque records,
  // no client-provided organization or unauthorized location coordinates.
  const match:Prisma.EventWhereInput=q?{OR:[
   {title:{contains:q,mode:"insensitive"}},
   {description:{contains:q,mode:"insensitive"}},
   {location:{contains:q,mode:"insensitive"}}
  ]}:{};
  const select={
   id:true,title:true,description:true,location:true,startAt:true,endAt:true,
   capacity:true,rsvpCount:true,waitlistEnabled:true
  } as const;
  const items=eventId?await db.event.findMany({
   where:{id:eventId,organizationId:org.id,status:"published"},
   select,take:1
  }):await db.event.findMany({
   where:{organizationId:org.id,status:"published",startAt:{gte:new Date()},...match},
   orderBy:[{startAt:"asc"},{id:"asc"}],take:50,select
  });
  if(eventId&&!items.length)throw new HttpError(404,"NOT_FOUND","Gathering unavailable.");
  return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},items,
   scope:"current_verified_membership",
   note:"Only published gatherings in your currently selected mosque. Text search covers title, description and displayed location. Results are limited to 50 upcoming gatherings; direct published links remain available."});
 });
}

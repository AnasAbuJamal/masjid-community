import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";

// Smallest allowed cohort; no exact, per-user, demographic, device, or
// single-event participant identifiers are ever returned by this endpoint.
const MIN_GROUP=10;
const band=(count:number)=>count<MIN_GROUP?null:
 `${Math.floor(count/10)*10}–${Math.floor(count/10)*10+9}`;
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  if([...req.nextUrl.searchParams.keys()].length)
   throw new HttpError(422,"FILTERS_UNAVAILABLE",
    "Small-cohort filtering and custom query windows are not permitted.");
  const org=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}],
   select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const events=await db.event.findMany({where:{
   organizationId:org.id,status:"published",endAt:{lt:new Date()}
  },orderBy:[{endAt:"desc"},{id:"desc"}],take:30,
   select:{id:true,title:true,endAt:true}});
  if(!events.length)return ok({organization:{name:org.name},events:[],minimumGroup:MIN_GROUP,
   policy:"Only completed published gatherings, only explicitly consenting active members, counts suppressed below ten and reported as ten-person bands. No raw identities, demographics or tracking."});
  const ids=events.map(event=>event.id);
  const allowedUsers:Prisma.UserWhereInput={
   status:"active",verifiedAt:{not:null},role:{not:"student"},
   memberships:{some:{organizationId:org.id,status:"active"}},
   analyticsConsents:{some:{organizationId:org.id,enabled:true,consentedAt:{not:null}}}
  };
  // Group in PostgreSQL, not in a JS loop over private RSVP rows. A site
  // operator must never be sent raw userIds or timestamped attendance.
  const eligible:Prisma.EventRSVPWhereInput={
   eventId:{in:ids},status:"confirmed",user:allowedUsers,
   event:{organizationId:org.id,status:"published"}
  };
  const [confirmed,arrived]=await Promise.all([
   db.eventRSVP.groupBy({by:["eventId"],where:eligible,_count:{_all:true}}),
   db.eventRSVP.groupBy({by:["eventId"],
    where:{...eligible,checkedInAt:{not:null}},_count:{_all:true}})
  ]);
  const confirmations=new Map(confirmed.map(r=>[r.eventId,r._count._all]));
  const arrivals=new Map(arrived.map(r=>[r.eventId,r._count._all]));
  // Suppressed events are omitted entirely; changing a filter cannot reveal
  // a low-count cohort because this endpoint accepts no custom filters.
  return ok({organization:{name:org.name},minimumGroup:MIN_GROUP,
   events:events.flatMap(event=>{
    const confirmedBand=band(confirmations.get(event.id)||0);
    if(!confirmedBand)return [];
    return [{eventId:event.id,title:event.title,endAt:event.endAt,
     confirmedBand,arrivedBand:band(arrivals.get(event.id)||0)}];
   }),
   policy:"Consent is independently opt-in per mosque, default OFF. Counts are for currently eligible members' confirmed reservations only. Below ten is suppressed, larger counts use ten-person bands; small arrival groups remain hidden. No per-person details or traffic tracking. Not suitable for individual decisions."});
 });
}

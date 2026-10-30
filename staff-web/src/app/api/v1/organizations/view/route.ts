import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
import {handled,HttpError,localDate,ok} from "@/lib/http";
import {publicGatheringItems} from "@/lib/gathering-filters";

// Read-only worship and public-content views in a VERIFIED member's current
// server-held organization. Guests use the separate original /public API.
// A client venue ID is a filter, never an authority to choose the mosque.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {org}=await requireMemberContext(req);
  const params=req.nextUrl.searchParams,resource=params.get("resource");
  if(!["venues","home","prayers","faith","announcements","articles","financials"].includes(resource||"")||
   [...params.keys()].some(k=>!["resource","venueId","date","itemId"].includes(k))||
   ["resource","venueId","date","itemId"].some(k=>params.getAll(k).length>1)||
   (resource!=="prayers"&&params.has("date"))||
   (!["home","prayers"].includes(resource||"")&&params.has("venueId"))||
   (!["announcements","articles"].includes(resource||"")&&params.has("itemId")))
   throw new HttpError(422,"BAD_QUERY","Unsupported view or filter.");

  // The same session-selected organization protects all read-only content.
  // Only explicitly published, released content may enter this response.
  if(resource==="financials"){
   const budgets=await db.financeBudget.findMany({where:{organizationId:org.id,published:true},
    take:100,orderBy:[{periodMonth:"desc"},{id:"asc"}],
    select:{id:true,category:true,periodMonth:true,amountMinor:true,currency:true}});
   return ok({organization:{id:org.id,name:org.name},budgets,
    note:"Published budgets are planned allocations, not donations received or cash balances."});
  }

  if(resource==="announcements"||resource==="articles"){
   const itemId=params.get("itemId")===null?null:z.string().min(8).max(128).parse(params.get("itemId"));
   const now=new Date();
   const items=resource==="announcements"
    ?await db.announcement.findMany({where:{organizationId:org.id,status:"published",
      publishedAt:{lte:now},...(itemId?{id:itemId}:{})},
      take:itemId?1:50,orderBy:[{publishedAt:"desc"},{id:"asc"}],
      select:{id:true,title:true,body:true,kind:true,publishedAt:true}})
    :await db.communityArticle.findMany({where:{organizationId:org.id,status:"published",
      publishedAt:{lte:now},...(itemId?{id:itemId}:{})},
      take:itemId?1:50,orderBy:[{publishedAt:"desc"},{id:"asc"}],
      select:{id:true,title:true,body:true,publishedAt:true}});
   if(itemId&&!items.length)throw new HttpError(404,"NOT_FOUND","Published item unavailable.");
   return ok({organization:{id:org.id,name:org.name},items,
    note:"Only released, published community content from your selected mosque."});
  }

  if(resource==="venues"){
   const venues=await db.venue.findMany({where:{organizationId:org.id},
    orderBy:{id:"asc"},take:100,
    select:{id:true,name:true,address:true,timeZone:true}});
   return ok({organization:{id:org.id,name:org.name},venues});
  }

  if(resource==="faith"){
   const before=localDate(new Date(Date.now()-14*86400000),org.timeZone);
   const notices=await db.faithNotice.findMany({where:{
    organizationId:org.id,status:"published",approvedById:{not:null},
    localDate:{gte:before},publishedAt:{lte:new Date()}
   },take:40,orderBy:{localDate:"asc"},select:{
    id:true,kind:true,localDate:true,title:true,body:true,publishedAt:true,revision:true
   }});
   return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},notices,
    policy:"Ramadan, Eid and moon-sighting dates are mosque-confirmed announcements, not automatic astronomical predictions."});
  }

  const rawId=params.get("venueId");
  const venueId=rawId===null?null:z.string().min(8).max(128).parse(rawId);
  const select={id:true,name:true,address:true,timeZone:true} as const;
  const venue=venueId
   ?await db.venue.findFirst({where:{id:venueId,organizationId:org.id},select})
   :await db.venue.findFirst({where:{organizationId:org.id},orderBy:{id:"asc"},select});
  if(venueId&&!venue)throw new HttpError(404,"VENUE_NOT_FOUND","The selected venue is unavailable.");

  if(resource==="home"){
   const now=new Date(),today=venue?localDate(now,venue.timeZone):null;
   const [prayer,announcements,events]=await Promise.all([
    venue&&today?db.prayerDay.findFirst({where:{
     venueId:venue.id,localDate:today,published:true
    }}):null,
    db.announcement.findMany({where:{
     organizationId:org.id,status:"published",publishedAt:{lte:now}
    },take:3,orderBy:{publishedAt:"desc"},select:{
     id:true,title:true,body:true,kind:true,publishedAt:true
    }}),
    db.event.findMany({where:{
     organizationId:org.id,status:"published",startAt:{gte:now}
    },take:3,orderBy:{startAt:"asc"},select:{
     id:true,title:true,description:true,location:true,startAt:true,endAt:true,
     capacity:true,rsvpCount:true,waitlistEnabled:true,
     rsvpDeadlineAt:true,cancellationDeadlineAt:true,cancellationTerms:true,
     venue:{select:{id:true,name:true,timeZone:true,organizationId:true}},category:true,audience:true,
     accessibilityFeatures:true,accessibilityNotes:true
    }})
   ]);
   return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},
    venue,prayer,announcements,events:publicGatheringItems(events,org.id)});
  }

  // "prayers": only real, explicitly published venue days. The date is a
  // civil date interpreted in the selected venue's timezone, not client GPS.
  if(!venue)return ok({venue:null,days:[],jummah:[]});
  const date=params.get("date")||localDate(new Date(),venue.timeZone);
  if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))
   throw new HttpError(422,"BAD_DATE","Use YYYY-MM-DD.");
  const parsed=new Date(date+"T12:00:00Z");
  if(!Number.isFinite(parsed.valueOf())||parsed.toISOString().slice(0,10)!==date)
   throw new HttpError(422,"INVALID_DATE","Use a real calendar date.");
  const [days,jummah]=await Promise.all([
   db.prayerDay.findMany({where:{venueId:venue.id,localDate:date,published:true},take:1}),
   db.jummahSession.findMany({where:{venueId:venue.id,localDate:date},orderBy:{ordinal:"asc"}})
  ]);
  return ok({venue,localDate:date,days,jummah});
 });
}

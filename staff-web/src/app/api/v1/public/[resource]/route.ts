import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handled, HttpError, localDate, ok } from "@/lib/http";
import {gatheringFilters,publishedGatheringWhere,GATHERING_SELECT,publicGatheringItems} from "@/lib/gathering-filters";
type Context={params:Promise<{resource:string}>};
const limit=25;
export async function GET(req:NextRequest,{params}:Context){
 return handled(async()=>{
  const {resource}=await params;
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
  if(!org) return ok({organization:null,items:[],message:"This community has not been configured yet."});
  if(resource==="events"){
    const parts=gatheringFilters(req.nextUrl.searchParams);
    if(parts.venueId&&!await db.venue.findFirst({
      where:{id:parts.venueId,organizationId:org.id},select:{id:true}
    }))throw new HttpError(404,"VENUE_NOT_FOUND","Venue unavailable.");
    const items=await db.event.findMany({
      where:publishedGatheringWhere(org.id,parts),select:GATHERING_SELECT,
      orderBy:[{startAt:"asc"},{id:"asc"}],take:parts.id?1:50
    });
    if(parts.id&&!items.length)throw new HttpError(404,"NOT_FOUND","Gathering unavailable.");
    return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},
      items:publicGatheringItems(items,org.id),
      note:"Published gathering categories, audience and verified accessibility information only."});
  }
  if(resource==="financials"){
    const budgets=await db.financeBudget.findMany({where:{organizationId:org.id,published:true},take:100,
      orderBy:{periodMonth:"desc"},select:{id:true,category:true,periodMonth:true,amountMinor:true,currency:true}});
    return ok({organization:{name:org.name},budgets,note:"Published budgets are planned allocations, not donations received or cash balances."});
  }
  if(resource==="home"){
    const venueId=req.nextUrl.searchParams.get("venueId");
    const venue=venueId
      ? await db.venue.findFirst({where:{id:venueId,organizationId:org.id}})
      : await db.venue.findFirst({where:{organizationId:org.id},orderBy:{id:"asc"}});
    if(venueId&&!venue)throw new HttpError(404,"VENUE_NOT_FOUND","The selected venue is unavailable.");
    const today=venue ? localDate(new Date(),venue.timeZone) : null;
    const [prayer,announcements,events]=await Promise.all([
      venue&&today?db.prayerDay.findFirst({where:{venueId:venue.id,localDate:today,published:true}}):null,
      db.announcement.findMany({where:{organizationId:org.id,status:"published",publishedAt:{lte:new Date()}},orderBy:{publishedAt:"desc"},take:3,select:{id:true,title:true,body:true,kind:true,publishedAt:true}}),
      db.event.findMany({where:{organizationId:org.id,status:"published",startAt:{gte:new Date()}},orderBy:{startAt:"asc"},take:3,select:{id:true,title:true,description:true,location:true,startAt:true,endAt:true,capacity:true,rsvpCount:true,waitlistEnabled:true,rsvpDeadlineAt:true,cancellationDeadlineAt:true,cancellationTerms:true}})
    ]);
    return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone,address:org.address},venue:venue&&{id:venue.id,name:venue.name,timeZone:venue.timeZone},prayer,announcements,events});
  }
  if(resource==="prayers"){
    const venueId=req.nextUrl.searchParams.get("venueId");
    const venue=venueId ? await db.venue.findFirst({where:{id:venueId,organizationId:org.id}}) : await db.venue.findFirst({where:{organizationId:org.id},orderBy:{id:"asc"}});
    if(venueId&&!venue)throw new HttpError(404,"VENUE_NOT_FOUND","The selected venue is unavailable.");
    if(!venue) return ok({venue:null,days:[],jummah:[]});
    const date=req.nextUrl.searchParams.get("date")||localDate(new Date(),venue.timeZone);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new HttpError(422,"BAD_DATE","Use YYYY-MM-DD.");
    const parsed=new Date(date+"T12:00:00Z");
    if(!Number.isFinite(parsed.valueOf())||parsed.toISOString().slice(0,10)!==date)
      throw new HttpError(422,"INVALID_DATE","Use a real YYYY-MM-DD calendar date.");
    const [days,jummah]=await Promise.all([
      db.prayerDay.findMany({where:{venueId:venue.id,published:true,localDate:date},take:1}),
      db.jummahSession.findMany({where:{venueId:venue.id,localDate:date},orderBy:{ordinal:"asc"}})
    ]);
    return ok({venue:{id:venue.id,name:venue.name,timeZone:venue.timeZone},localDate:date,days,jummah});
  }
  const where={organizationId:org.id};
  const data=resource==="announcements" ? await db.announcement.findMany({where:{...where,status:"published",publishedAt:{lte:new Date()}},take:limit,orderBy:{publishedAt:"desc"},select:{id:true,title:true,body:true,kind:true,publishedAt:true}})
   :resource==="events" ? await db.event.findMany({where:{...where,status:"published"},take:limit,orderBy:{startAt:"asc"},select:{id:true,title:true,description:true,location:true,startAt:true,endAt:true,capacity:true,rsvpCount:true,waitlistEnabled:true,rsvpDeadlineAt:true,cancellationDeadlineAt:true,cancellationTerms:true}})
   :resource==="programs" ? await db.schoolProgram.findMany({where:{...where,published:true},take:limit,select:{id:true,title:true,description:true,classes:{select:{id:true,name:true,schedule:true}}}})
   :resource==="campaigns" ? await db.donationCampaign.findMany({where:{...where,published:true},take:limit,select:{id:true,title:true,purpose:true,currency:true,goalMinor:true}})
   :resource==="volunteers" ? await db.volunteerOpportunity.findMany({where:{...where,published:true},take:limit,orderBy:{startsAt:"asc"},select:{id:true,title:true,description:true,startsAt:true,capacity:true,filled:true}})
   :resource==="proposals" ? await db.proposal.findMany({where:{...where,status:"published"},take:limit,select:{id:true,title:true,description:true,_count:{select:{votes:true}}}})
   :resource==="jobs" ? await db.jobPosting.findMany({where:{...where,status:"published"},take:limit,select:{id:true,title:true,description:true,company:true}})
   :resource==="rentals" ? await db.rentalResource.findMany({where:{...where,published:true},take:limit,select:{id:true,title:true,description:true}})
   :resource==="articles" ? await db.communityArticle.findMany({where:{...where,status:"published",publishedAt:{lte:new Date()}},take:limit,
      orderBy:{publishedAt:"desc"},select:{id:true,title:true,body:true,publishedAt:true}})
   :resource==="construction" ? await db.constructionProject.findMany({where:{...where,status:"published"},take:limit,
      select:{id:true,title:true,description:true,goalMinor:true,currency:true,milestones:{
        where:{status:"published"},orderBy:{createdAt:"asc"},select:{id:true,title:true,description:true,completedAt:true}}}})
   :null;
  if(data===null)throw new HttpError(404,"NOT_FOUND","Unknown resource.");
  return ok({organization:{id:org.id,name:org.name},items:data});
 });
}

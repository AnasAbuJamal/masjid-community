import {z} from "zod";
import type {Prisma} from "@prisma/client";
import {HttpError} from "./http";
import {db} from "./db";

// Fixed, reviewable public categories. Never claim that an omitted feature
// exists on an older gathering, or infer audience from attendance demographics.
export const GATHERING_CATEGORIES=[
 "lecture","workshop","community_meal","youth","service","other"
] as const;
export const GATHERING_AUDIENCES=[
 "everyone","adults","families","youth","children","women","men"
] as const;
export const GATHERING_ACCESSIBILITY=[
 "step_free","hearing_support","quiet_space"
] as const;
export const GATHERING_SELECT={
 id:true,title:true,description:true,location:true,startAt:true,endAt:true,
 capacity:true,rsvpCount:true,waitlistEnabled:true,
 rsvpDeadlineAt:true,cancellationDeadlineAt:true,cancellationTerms:true,
 category:true,audience:true,accessibilityFeatures:true,accessibilityNotes:true,
 venue:{select:{id:true,name:true,timeZone:true,organizationId:true}}
} as const;

export function gatheringFilters(params:URLSearchParams){
 const keys=["eventId","q","from","to","venueId","category","audience","accessibility","cursor"];
 if([...params.keys()].some(k=>!keys.includes(k))||
    keys.some(k=>params.getAll(k).length>1)||
    (params.has("eventId")&&keys.some(k=>k!=="eventId"&&params.has(k))))
  throw new HttpError(422,"BAD_QUERY","Unsupported or duplicate gathering filters.");
 const optional=(key:string)=>params.get(key)||null;
 const eventId=optional("eventId");
 const id=eventId?z.string().min(8).max(128).parse(eventId):null;
 if(params.has("cursor")&&!optional("cursor"))
  throw new HttpError(422,"BAD_CURSOR","A nonempty page cursor is required.");
 const cursor=optional("cursor")?z.string()
  .regex(/^[A-Za-z0-9_-]{8,128}$/,"Invalid page cursor.")
  .parse(optional("cursor")):null;
 const qRaw=optional("q");
 const q=qRaw?z.string().trim().min(2).max(80).parse(qRaw):null;
 const fromRaw=optional("from"),toRaw=optional("to");
 const from=fromRaw?new Date(z.iso.datetime().parse(fromRaw)):null;
 const to=toRaw?new Date(z.iso.datetime().parse(toRaw)):null;
 if(from&&to&&to<=from)
  throw new HttpError(422,"INVALID_RANGE","End of date range must be after its start.");
 const venueId=optional("venueId")?z.string().min(8).max(128).parse(optional("venueId")):null;
 const category=optional("category")?z.enum(GATHERING_CATEGORIES).parse(optional("category")):null;
 const audience=optional("audience")?z.enum(GATHERING_AUDIENCES).parse(optional("audience")):null;
 const accessibility=optional("accessibility")
  ?z.enum(GATHERING_ACCESSIBILITY).parse(optional("accessibility")):null;
 const search:Prisma.EventWhereInput=q?{OR:[
  {title:{contains:q,mode:"insensitive"}},
  {description:{contains:q,mode:"insensitive"}},
  {location:{contains:q,mode:"insensitive"}}
 ]}:{};
 const filters:Prisma.EventWhereInput={
  ...search,
  ...(venueId?{venueId}:{}),
  ...(category?{category}:{}),
  ...(audience?{audience}:{}),
  ...(accessibility?{accessibilityFeatures:{has:accessibility}}:{})
 };
 return {id,cursor,filters,from,to,venueId};
}

export function publishedGatheringWhere(
 orgId:string,parts:ReturnType<typeof gatheringFilters>,now=new Date()
):Prisma.EventWhereInput{
 return {organizationId:orgId,status:"published",
  ...(parts.id?{id:parts.id}:{
   startAt:{gte:parts.from&&parts.from>now?parts.from:now,
    ...(parts.to?{lt:parts.to}:{})},
   ...parts.filters
  })
 };
}

// Prevent a malformed imported record from presenting another mosque's
// venue name/timezone, even if an external DB writer bypasses the API guard.
// Database trigger enforcement provides another independent layer.
export function publicGatheringItems<T extends {
 venue:{id:string;name:string;timeZone:string;organizationId:string}|null
}>(items:T[],organizationId:string){
 return items.map(({venue,...event})=>({
  ...event,venue:venue?.organizationId===organizationId
   ?{id:venue.id,name:venue.name,timeZone:venue.timeZone}:null
 }));
}

// Keyset pagination (startAt, id) avoids offset drift and duplicates where
// events share a start instant. Cursor IDs are never authorities: every
// cursor is resolved inside the identical tenant, publication and filter set.
// If a cursor is removed, unpublished, starts in the past, or belongs to a
// different organization/filter, it is rejected without an existence oracle.
export const GATHERING_PAGE_SIZE=25;
export async function publishedGatheringPage(
 organizationId:string,parts:ReturnType<typeof gatheringFilters>,now=new Date()
){
 const base=publishedGatheringWhere(organizationId,parts,now);
 const pivot=parts.cursor?await db.event.findFirst({
  where:{AND:[base,{id:parts.cursor}]},
  select:{id:true,startAt:true}
 }):null;
 if(parts.cursor&&!pivot)
  throw new HttpError(404,"CURSOR_UNAVAILABLE","This gathering page is unavailable. Restart the search.");
 const where:Prisma.EventWhereInput=pivot?{AND:[base,{OR:[
  {startAt:{gt:pivot.startAt}},
  {startAt:pivot.startAt,id:{gt:pivot.id}}
 ]}]}:base;
 const rows=await db.event.findMany({
  where,select:GATHERING_SELECT,orderBy:[{startAt:"asc"},{id:"asc"}],
  take:parts.id?1:GATHERING_PAGE_SIZE+1
 });
 const hasMore=!parts.id&&rows.length>GATHERING_PAGE_SIZE;
 const items=hasMore?rows.slice(0,GATHERING_PAGE_SIZE):rows;
 return {items:publicGatheringItems(items,organizationId),
  hasMore,nextCursor:hasMore?items[items.length-1].id:null,pageSize:GATHERING_PAGE_SIZE};
}

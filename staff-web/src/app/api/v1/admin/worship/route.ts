import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok,localDate} from "@/lib/http";
const isoDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("jummah"),venueId:z.string().min(8),localDate:isoDate,ordinal:z.number().int().min(1).max(5),
  khutbahAt:time.optional(),iqamahAt:time,language:z.string().trim().max(20).optional()}),
 z.object({kind:z.literal("faith"),faithKind:z.enum(["ramadan_start","eid_al_fitr","eid_al_adha","moon_sighting","other"]),localDate:isoDate,
  title:z.string().trim().min(4).max(150),body:z.string().trim().min(10).max(2500),published:z.boolean()})
]);
function validLocalDate(date:string){
 const parsed=new Date(date+"T12:00:00Z");
 if(!Number.isFinite(parsed.valueOf())||parsed.toISOString().slice(0,10)!==date)
  throw new HttpError(422,"INVALID_DATE","Enter a valid calendar date.");
 return parsed;
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","staff"]);
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  const today=localDate(new Date(),org.timeZone);
  const [venues,notices]=await Promise.all([
   db.venue.findMany({where:{organizationId:org.id},take:30,select:{id:true,name:true,timeZone:true,
    jummahSessions:{where:{localDate:{gte:today}},take:30,orderBy:[{localDate:"asc"},{ordinal:"asc"}]}}}),
   db.faithNotice.findMany({where:{organizationId:org.id},take:70,orderBy:{localDate:"desc"},
    select:{id:true,kind:true,localDate:true,title:true,body:true,status:true,revision:true,publishedAt:true}})
  ]);
  return ok({venues,notices});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin"]);
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  const parsed=validLocalDate(input.localDate);
  if(input.kind==="jummah"){
   if(parsed.getUTCDay()!==5)throw new HttpError(422,"NOT_FRIDAY","Jummah sessions must use a Friday date.");
   const venue=await db.venue.findFirst({where:{id:input.venueId,organizationId:org.id}});
   if(!venue)throw new HttpError(404,"VENUE_NOT_FOUND","Prayer venue unavailable.");
   const result=await db.jummahSession.upsert({where:{venueId_localDate_ordinal:{venueId:venue.id,localDate:input.localDate,ordinal:input.ordinal}},
    update:{khutbahAt:input.khutbahAt,iqamahAt:input.iqamahAt,language:input.language},
    create:{venueId:venue.id,localDate:input.localDate,ordinal:input.ordinal,khutbahAt:input.khutbahAt,iqamahAt:input.iqamahAt,language:input.language}});
   await db.auditEvent.create({data:{actorId:user.id,action:"worship.jummah.publish",entity:"JummahSession",entityId:result.id}});
   return ok({id:result.id,published:true});
  }
  const entry=await db.faithNotice.upsert({where:{organizationId_kind_localDate:{organizationId:org.id,kind:input.faithKind,localDate:input.localDate}},
   update:{title:input.title,body:input.body,status:input.published?"published":"draft",approvedById:input.published?user.id:null,
    publishedAt:input.published?new Date():null,revision:{increment:1}},
   create:{organizationId:org.id,kind:input.faithKind,localDate:input.localDate,title:input.title,body:input.body,
    status:input.published?"published":"draft",approvedById:input.published?user.id:null,publishedAt:input.published?new Date():null}});
  await db.auditEvent.create({data:{actorId:user.id,action:input.published?"worship.faith.publish":"worship.faith.draft",entity:"FaithNotice",entityId:entry.id}});
  return ok({id:entry.id,status:entry.status,revision:entry.revision});
 });
}
export async function DELETE(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin"]);
  const {kind,id}=z.object({kind:z.enum(["jummah","faith"]),id:z.string().min(8)}).parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  if(kind==="jummah"){
   const old=await db.jummahSession.findFirst({where:{id,venue:{organizationId:org.id}}});
   if(!old)throw new HttpError(404,"NOT_FOUND","Session unavailable.");
   await db.jummahSession.delete({where:{id:old.id}});
  }else{
   const updated=await db.faithNotice.updateMany({where:{id,organizationId:org.id},data:{status:"archived",publishedAt:null,revision:{increment:1}}});
   if(!updated.count)throw new HttpError(404,"NOT_FOUND","Notice unavailable.");
  }
  await db.auditEvent.create({data:{actorId:user.id,action:"worship."+kind+".remove",entity:kind,entityId:id}});
  return ok({id,removed:true});
 });
}

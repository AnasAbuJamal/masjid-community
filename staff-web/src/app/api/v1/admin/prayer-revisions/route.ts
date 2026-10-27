import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireCapability} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,localDate,ok} from "@/lib/http";

const dateInput=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const clock=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const optionalClock=z.preprocess(value=>value===""?null:value,clock.nullish());
const create=z.object({
 action:z.literal("create"),
 venueId:z.string().min(8),
 localDate:dateInput,
 source:z.string().trim().min(3).max(120),
 correctionReason:z.string().trim().max(500).optional(),
 fajr:clock,sunrise:clock,dhuhr:clock,asr:clock,maghrib:clock,isha:clock,
 fajrIqamah:optionalClock,dhuhrIqamah:optionalClock,asrIqamah:optionalClock,
 maghribIqamah:optionalClock,ishaIqamah:optionalClock
});
const command=z.discriminatedUnion("action",[
 create,
 z.object({action:z.literal("submit"),id:z.string().min(8)}),
 z.object({action:z.literal("approve"),id:z.string().min(8)}),
 z.object({action:z.literal("publish"),id:z.string().min(8)}),
 z.object({action:z.literal("withdraw"),id:z.string().min(8)})
]);
const names=["fajr","sunrise","dhuhr","asr","maghrib","isha"] as const;
const iqamah=[["fajr","fajrIqamah"],["dhuhr","dhuhrIqamah"],["asr","asrIqamah"],
 ["maghrib","maghribIqamah"],["isha","ishaIqamah"]] as const;

function verifyDate(date:string) {
 const d=new Date(date+"T12:00:00Z");
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)
  throw new HttpError(422,"INVALID_DATE","Use a valid mosque-local calendar date.");
}
function verifyTimes(input:z.infer<typeof create>) {
 const values=names.map(k=>input[k]);
 if(values.some((v,i)=>i>0&&v<=values[i-1]))
  throw new HttpError(422,"TIME_ORDER","Published adhan and sunrise times must increase through the day.");
 for(const [prayer,field] of iqamah) {
  if(input[field]&&input[field]<input[prayer])
   throw new HttpError(422,"IQAMAH_ORDER","Iqamah cannot be before the corresponding adhan.");
 }
}
function fields(input:z.infer<typeof create>){
 return {fajr:input.fajr,sunrise:input.sunrise,dhuhr:input.dhuhr,asr:input.asr,
  maghrib:input.maghrib,isha:input.isha,
  fajrIqamah:input.fajrIqamah||null,dhuhrIqamah:input.dhuhrIqamah||null,
  asrIqamah:input.asrIqamah||null,maghribIqamah:input.maghribIqamah||null,
  ishaIqamah:input.ishaIqamah||null,source:input.source};
}
function snapshot(item:Record<string,unknown>){
 const keys=[...names,"fajrIqamah","dhuhrIqamah","asrIqamah","maghribIqamah","ishaIqamah","source"];
 return Object.fromEntries(keys.map(key=>[key,item[key]??null]));
}
async function organization(){
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 if(!org)throw new HttpError(503,"NOT_CONFIGURED","Configure the organization before editing worship.");
 return org;
}
function conflict(message:string):never{
 throw new HttpError(409,"STALE_REVISION",message);
}

export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireCapability(req,"worship_publish");
  const org=await organization();
  const venues=await db.venue.findMany({where:{organizationId:org.id},take:50,orderBy:{id:"asc"},
   select:{id:true,name:true,timeZone:true}});
  const requested=req.nextUrl.searchParams.get("venueId");
  const selected=venues.find(v=>v.id===requested)??venues[0];
  if(requested&&!venues.some(v=>v.id===requested))
   throw new HttpError(404,"VENUE_NOT_FOUND","Venue is not part of this mosque.");
  if(!selected)return ok({userId:user.id,venues,selectedVenue:null,revisions:[],published:[]});
  const now=localDate(new Date(),selected.timeZone);
  const [revisions,published]=await Promise.all([
   db.prayerScheduleRevision.findMany({where:{venueId:selected.id},
    orderBy:[{localDate:"desc"},{revision:"desc"}],take:60}),
   db.prayerDay.findMany({where:{venueId:selected.id,localDate:{gte:now}},orderBy:{localDate:"asc"},take:30,
    select:{id:true,localDate:true,revision:true,published:true,source:true,updatedAt:true}})
  ]);
  return ok({userId:user.id,venues,selectedVenue:selected,revisions,published});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireCapability(req,"worship_publish");
  const org=await organization();
  const input=command.parse(await jsonBody(req));

  if(input.action==="create"){
   verifyDate(input.localDate);
   verifyTimes(input);
   const venue=await db.venue.findFirst({where:{id:input.venueId,organizationId:org.id}});
   if(!venue)throw new HttpError(404,"VENUE_NOT_FOUND","Venue is not part of this mosque.");
   const current=await db.prayerDay.findUnique({where:{venueId_localDate:{venueId:venue.id,localDate:input.localDate}}});
   const baseRevision=current?.published?current.revision:0;
   const [active,latest]=await Promise.all([
    db.prayerScheduleRevision.findFirst({where:{venueId:venue.id,localDate:input.localDate,
     status:{in:["draft","pending","approved"]}}}),
    db.prayerScheduleRevision.findFirst({where:{venueId:venue.id,localDate:input.localDate},
     orderBy:{revision:"desc"},select:{revision:true}})
   ]);
   if(active)conflict("Finish or withdraw the existing candidate before drafting another.");
   const nextRevision=Math.max(baseRevision+1,(latest?.revision||0)+1);
   const isPast=input.localDate<localDate(new Date(),venue.timeZone);
   if((baseRevision>0||isPast)&&(!input.correctionReason||input.correctionReason.length<10))
    throw new HttpError(422,"CORRECTION_REASON","Provide a reason of at least 10 characters for an existing or past schedule.");
   try{
    const result=await db.$transaction(async tx=>{
     const item=await tx.prayerScheduleRevision.create({data:{
      venueId:venue.id,localDate:input.localDate,baseRevision,revision:nextRevision,
      ...fields(input),correctionReason:input.correctionReason||null,authoredById:user.id
     }});
     await tx.auditEvent.create({data:{actorId:user.id,action:"worship.prayer.draft",entity:"PrayerScheduleRevision",
      entityId:item.id,detail:JSON.stringify({venueId:venue.id,localDate:input.localDate,revision:item.revision})}});
     return item;
    });
    return ok({id:result.id,status:result.status,revision:result.revision},201);
   }catch(e){
    if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")
     conflict("A candidate for this date and revision already exists. Submit, withdraw or publish it before creating another.");
    throw e;
   }
  }

  const item=await db.prayerScheduleRevision.findFirst({where:{id:input.id,venue:{organizationId:org.id}}});
  if(!item)throw new HttpError(404,"DRAFT_NOT_FOUND","Prayer schedule revision is unavailable.");

  if(input.action==="submit"){
   if(item.authoredById!==user.id)throw new HttpError(403,"NOT_AUTHOR","Only the named author can submit this draft.");
   if(item.status!=="draft")conflict("Only drafts can be submitted.");
   const changed=await db.prayerScheduleRevision.updateMany({where:{id:item.id,status:"draft",authoredById:user.id},
    data:{status:"pending",submittedAt:new Date()}});
   if(!changed.count)conflict("The draft was changed. Reload before submitting.");
   await db.auditEvent.create({data:{actorId:user.id,action:"worship.prayer.submit",entity:"PrayerScheduleRevision",entityId:item.id}});
   return ok({id:item.id,status:"pending"});
  }
  if(input.action==="withdraw"){
   if(item.authoredById!==user.id)throw new HttpError(403,"NOT_AUTHOR","Only the named author may withdraw their draft.");
   if(!["draft","pending"].includes(item.status))conflict("Only unpublished drafts may be withdrawn.");
   const changed=await db.prayerScheduleRevision.updateMany({where:{id:item.id,status:item.status},data:{status:"withdrawn"}});
   if(!changed.count)conflict("The draft was changed before it could be withdrawn.");
   await db.auditEvent.create({data:{actorId:user.id,action:"worship.prayer.withdraw",entity:"PrayerScheduleRevision",entityId:item.id}});
   return ok({id:item.id,status:"withdrawn"});
  }
  if(input.action==="approve"){
   if(item.authoredById===user.id)throw new HttpError(403,"SEPARATION_REQUIRED","A different authorized reviewer must approve this schedule.");
   if(item.status!=="pending")conflict("Only submitted schedules may be approved.");
   const changed=await db.prayerScheduleRevision.updateMany({where:{id:item.id,status:"pending",approvedById:null},
    data:{status:"approved",approvedById:user.id,approvedAt:new Date()}});
   if(!changed.count)conflict("Another reviewer already changed this schedule.");
   await db.auditEvent.create({data:{actorId:user.id,action:"worship.prayer.approve",entity:"PrayerScheduleRevision",
    entityId:item.id,detail:JSON.stringify({author:item.authoredById,revision:item.revision})}});
   return ok({id:item.id,status:"approved"});
  }

  if(item.status==="published")return ok({id:item.id,status:"published",revision:item.revision,alreadyPublished:true});
  if(item.status!=="approved"||!item.approvedById||item.approvedById===item.authoredById)
   conflict("Publication requires approval by a different eligible reviewer.");
  try{
   return await db.$transaction(async tx=>{
    const candidate=await tx.prayerScheduleRevision.findUnique({where:{id:item.id}});
    if(!candidate||candidate.status!=="approved")conflict("The approval is no longer current.");
    const previous=await tx.prayerDay.findUnique({where:{venueId_localDate:{
     venueId:candidate.venueId,localDate:candidate.localDate}}});
    const base=previous?.published?previous.revision:0;
    if(base!==candidate.baseRevision)conflict("The public schedule has changed since this draft began.");
    const now=new Date();
    const data={
     fajr:candidate.fajr,sunrise:candidate.sunrise,dhuhr:candidate.dhuhr,asr:candidate.asr,
     maghrib:candidate.maghrib,isha:candidate.isha,
     fajrIqamah:candidate.fajrIqamah,dhuhrIqamah:candidate.dhuhrIqamah,asrIqamah:candidate.asrIqamah,
     maghribIqamah:candidate.maghribIqamah,ishaIqamah:candidate.ishaIqamah,
     source:candidate.source,published:true,publishedAt:now,revision:candidate.revision
    };
    if(previous){
     const updated=await tx.prayerDay.updateMany({where:{
      id:previous.id,revision:previous.revision,published:previous.published
     },data});
     if(!updated.count)conflict("Another editor published a different revision.");
    }else{
     await tx.prayerDay.create({data:{venueId:candidate.venueId,localDate:candidate.localDate,...data}});
    }
    const updatedCandidate=await tx.prayerScheduleRevision.updateMany({
     where:{id:candidate.id,status:"approved"},data:{status:"published",publishedAt:now}
    });
    if(!updatedCandidate.count)conflict("Another publisher completed this revision.");
    await tx.auditEvent.create({data:{actorId:user.id,action:"worship.prayer.publish",
     entity:"PrayerScheduleRevision",entityId:candidate.id,
     detail:JSON.stringify({author:candidate.authoredById,approver:candidate.approvedById,
      venueId:candidate.venueId,localDate:candidate.localDate,
      revision:candidate.revision,reason:candidate.correctionReason,
      previous:previous?snapshot(previous):null,published:snapshot(candidate)})}});
    return ok({id:candidate.id,status:"published",revision:candidate.revision});
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }catch(e){
   if(e instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(e.code))
    conflict("The schedule was published or changed concurrently. Reload to see the latest revision.");
   throw e;
  }
 });
}

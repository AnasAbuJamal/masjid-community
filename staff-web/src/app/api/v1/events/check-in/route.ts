import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const record=z.object({eventId:z.string().min(8),rsvpId:z.string().min(8),
 expectedRevision:z.number().int().min(0).max(1000000)});
const command=z.discriminatedUnion("action",[
 record.extend({action:z.literal("arrive")}),
 record.extend({action:z.literal("correct"),reason:z.string().trim().min(10).max(300)})
]);

// Neither the public API nor unassigned staff can request an event's attendee roster.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const actor=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const eventId=req.nextUrl.searchParams.get("eventId");
  if(!eventId){
   const assignments=await db.eventHostAssignment.findMany({where:{
    hostId:actor.id,revokedAt:null,
    event:{organizationId:org.id,status:"published",endAt:{gte:new Date(Date.now()-7*86400000)}}
   },take:70,orderBy:{assignedAt:"desc"},
   select:{event:{select:{id:true,title:true,startAt:true,endAt:true}}}});
   return ok({events:assignments.map(row=>row.event)});
  }
  const parsedId=z.string().min(8).parse(eventId);
  const assignment=await db.eventHostAssignment.findFirst({where:{
   eventId:parsedId,hostId:actor.id,revokedAt:null,
   event:{organizationId:org.id,status:"published"}
  },select:{event:{select:{id:true,title:true,startAt:true,endAt:true}}}});
  if(!assignment)throw new HttpError(404,"EVENT_UNAVAILABLE","Assigned gathering unavailable.");
  const roster=await db.eventRSVP.findMany({
   where:{eventId:parsedId,status:"confirmed"},
   orderBy:[{createdAt:"asc"},{id:"asc"}],take:300,
   select:{id:true,checkedInAt:true,checkInRevision:true,
    user:{select:{firstName:true,lastName:true}}}
  });
  return ok({event:assignment.event,roster,
   complete:roster.length<300,
   policy:"Host-only confirmed registrations. List capped at 300. Attendance can be marked from 2 hours before to 1 hour after gathering; corrections until 24 hours after."});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireVerified(req);
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try{
   const result=await db.$transaction(async tx=>{
    // Authorize again within the same transaction as the attendance mutation.
    const assigned=await tx.eventHostAssignment.findFirst({where:{
     eventId:input.eventId,hostId:actor.id,revokedAt:null,
     event:{organizationId:org.id,status:"published"}
    },select:{event:{select:{startAt:true,endAt:true}}}});
    if(!assigned)throw new HttpError(404,"EVENT_UNAVAILABLE","Assigned gathering unavailable.");
    const now=new Date();
    const start=assigned.event.startAt.getTime(),end=assigned.event.endAt.getTime();
    const earliest=start-2*3600000;
    const latest=input.action==="arrive"?end+3600000:end+24*3600000;
    if(now.getTime()<earliest||now.getTime()>latest)
     throw new HttpError(409,"CHECK_IN_WINDOW","This attendance action is outside the approved gathering window.");
    const attendee=await tx.eventRSVP.findFirst({where:{
     id:input.rsvpId,eventId:input.eventId,status:"confirmed"
    },select:{id:true,checkedInAt:true,checkInRevision:true}});
    if(!attendee)throw new HttpError(404,"NOT_CONFIRMED","Confirmed attendee unavailable.");
    if(attendee.checkInRevision!==input.expectedRevision)
     throw new HttpError(409,"STALE_CHECK_IN","Attendance changed. Refresh the roster.");
    if(input.action==="arrive"&&attendee.checkedInAt)
     throw new HttpError(409,"ALREADY_CHECKED_IN","This attendee is already checked in.");
    if(input.action==="correct"&&!attendee.checkedInAt)
     throw new HttpError(409,"NOT_CHECKED_IN","No recorded arrival to correct.");
    const updated=await tx.eventRSVP.updateMany({
     where:{id:attendee.id,eventId:input.eventId,status:"confirmed",
      checkInRevision:input.expectedRevision,
      checkedInAt:input.action==="arrive"?null:{not:null}},
     data:{checkedInAt:input.action==="arrive"?now:null,
      checkedInById:input.action==="arrive"?actor.id:null,
      checkInRevision:{increment:1}}
    });
    if(!updated.count)throw new HttpError(409,"STALE_CHECK_IN","Attendance changed. Refresh the roster.");
    await tx.auditEvent.create({data:{
     actorId:actor.id,action:input.action==="arrive"?"gather.check-in":"gather.check-in.correct",
     entity:"EventRSVP",entityId:attendee.id,
     detail:JSON.stringify({eventId:input.eventId,organizationId:org.id,
      revision:input.expectedRevision+1,
      ...(input.action==="correct"?{reason:input.reason}:{})})
    }});
    return {rsvpId:attendee.id,checkedIn:input.action==="arrive",revision:input.expectedRevision+1};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"STALE_CHECK_IN","Attendance changed. Refresh the roster.");
   throw error;
  }
 });
}

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

// Confirmation alone is not permission to disclose a name or record an arrival.
// Revalidate recipient identity and active membership in the *event's* mosque.
// Keep old RSVP rows for separately approved retention/appeal handling.
function eligibleAttendee(organizationId:string):Prisma.EventRSVPWhereInput{
 return {user:{status:"active",verifiedAt:{not:null},
  memberships:{some:{organizationId,status:"active"}}}};
}

// A staff assignment is never a permanent entitlement. A demotion to the
// student role, suspended home membership or lost verification must revoke
// roster access immediately even when a historical assignment still exists.
function eligibleHost(organizationId:string,actorId:string):Prisma.EventHostAssignmentWhereInput{
 return {hostId:actorId,revokedAt:null,
  host:{status:"active",verifiedAt:{not:null},role:{not:"student"},
   memberships:{some:{organizationId,status:"active"}}}};
}

const ROSTER_PAGE_SIZE=50;
// Neither the public API nor unassigned staff can request an event's attendee roster.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const actor=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const params=req.nextUrl.searchParams;
  const keys=["eventId","cursor"];
  if([...params.keys()].some(key=>!keys.includes(key))||
     keys.some(key=>params.getAll(key).length>1))
   throw new HttpError(422,"BAD_QUERY","Unsupported or duplicated roster query.");
  const eventId=params.get("eventId");
  if(!eventId&&params.has("cursor"))
   throw new HttpError(422,"BAD_QUERY","A roster page requires a gathering.");
  if(!eventId){
   const assignments=await db.eventHostAssignment.findMany({where:{
    ...eligibleHost(org.id,actor.id),
    event:{organizationId:org.id,status:"published",endAt:{gte:new Date(Date.now()-7*86400000)}}
   },take:70,orderBy:{assignedAt:"desc"},
   select:{event:{select:{id:true,title:true,startAt:true,endAt:true}}}});
   return ok({events:assignments.map(row=>row.event)});
  }
  const parsedId=z.string().min(8).max(128).parse(eventId);
  const cursorRaw=params.get("cursor");
  if(cursorRaw!==null&&!cursorRaw)
   throw new HttpError(422,"BAD_CURSOR","A nonempty roster cursor is required.");
  const cursor=cursorRaw?z.string().regex(/^[A-Za-z0-9_-]{8,128}$/).parse(cursorRaw):null;
  const assignment=await db.eventHostAssignment.findFirst({where:{
   eventId:parsedId,...eligibleHost(org.id,actor.id),
   event:{organizationId:org.id,status:"published",endAt:{gte:new Date(Date.now()-7*86400000)}}
  },select:{event:{select:{id:true,title:true,startAt:true,endAt:true}}}});
  if(!assignment)throw new HttpError(404,"EVENT_UNAVAILABLE","Assigned gathering unavailable.");
  const eligible:Prisma.EventRSVPWhereInput={
   eventId:parsedId,status:"confirmed",...eligibleAttendee(org.id)
  };
  // No cursor lookups before verifying the exact host/event permission.
  // An external RSVP ID cannot become a way to enumerate foreign names.
  const pivot=cursor?await db.eventRSVP.findFirst({
   where:{AND:[eligible,{id:cursor}]},select:{id:true,createdAt:true}
  }):null;
  if(cursor&&!pivot)
   throw new HttpError(404,"ROSTER_CURSOR_UNAVAILABLE",
    "This roster page is unavailable. Refresh the assigned gathering.");
  const where:Prisma.EventRSVPWhereInput=pivot?{AND:[eligible,{OR:[
   {createdAt:{gt:pivot.createdAt}},
   {createdAt:pivot.createdAt,id:{gt:pivot.id}}
  ]}]}:eligible;
  const rows=await db.eventRSVP.findMany({
   where,orderBy:[{createdAt:"asc"},{id:"asc"}],take:ROSTER_PAGE_SIZE+1,
   select:{id:true,checkedInAt:true,checkInRevision:true,
    user:{select:{firstName:true,lastName:true}}}
  });
  const hasMore=rows.length>ROSTER_PAGE_SIZE;
  const roster=hasMore?rows.slice(0,ROSTER_PAGE_SIZE):rows;
  return ok({event:assignment.event,roster,pageSize:ROSTER_PAGE_SIZE,
   nextCursor:hasMore?roster[roster.length-1].id:null,hasMore,complete:!hasMore,
   policy:"Assigned hosts can view only confirmed registrations of currently active verified mosque members. Ineligible historical rows require separately authorized review. Private rosters are paged in sets of 50 and must never be exported, photographed or shared. Arrivals can be marked from 2 hours before to 1 hour after the gathering; corrections until 24 hours after."});
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
     eventId:input.eventId,...eligibleHost(org.id,actor.id),
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
     id:input.rsvpId,eventId:input.eventId,status:"confirmed",
     ...eligibleAttendee(org.id)
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
      ...eligibleAttendee(org.id),
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
    return {rsvpId:attendee.id,checkedIn:input.action==="arrive",
     checkedInAt:input.action==="arrive"?now:null,
     revision:input.expectedRevision+1};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"STALE_CHECK_IN","Attendance changed. Refresh the roster.");
   throw error;
  }
 });
}

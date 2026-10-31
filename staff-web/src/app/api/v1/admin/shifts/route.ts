import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {notifyUser} from "@/lib/notifications";
import {resolveMosqueLocalTime} from "@/lib/zoned-schedule-time";
import {requireCapability} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
// Serializable shift writes return explicit conflicts, never false completion.
async function shiftTransaction<T>(action:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 try{return await db.$transaction(action,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}
 catch(error){
  if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
   throw new HttpError(409,"SHIFT_CHANGED","Another scheduler changed this shift. Refresh and retry.");
  throw error;
 }
}
function mosqueInstant(local:string,timeZone:string):Date{
 const result=resolveMosqueLocalTime(local,timeZone);
 if(!result.ok)throw new HttpError(422,result.reason,
  result.reason==="AMBIGUOUS_LOCAL_TIME"?
   "This mosque clock time repeats when daylight saving ends. Choose an unambiguous time.":
  result.reason==="NONEXISTENT_LOCAL_TIME"?
   "This clock time does not exist at the mosque when daylight saving begins.":
   "Enter a valid time for the configured mosque timezone.");
 return result.date;
}
const localClock=z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("schedule"),applicationId:z.string().min(8),startAt:z.iso.datetime(),endAt:z.iso.datetime()}).strict(),
 z.object({kind:z.literal("schedule-local"),applicationId:z.string().min(8),
  startLocal:localClock,endLocal:localClock}).strict(),
 z.object({kind:z.literal("update"),shiftId:z.string().min(8),action:z.enum(["check-in","complete","cancel"])}).strict(),
 z.object({kind:z.literal("correct"),shiftId:z.string().min(8),
  action:z.enum(["adjust-arrival","remove-arrival"]),
  checkedInAt:z.iso.datetime().optional(),checkedInLocal:localClock.optional(),
  reason:z.string().trim().min(12).max(500)
 }).strict()
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireCapability(req,"volunteers_manage");
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},
   select:{id:true,name:true,timeZone:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [applications,shifts]=await Promise.all([
   db.volunteerApplication.findMany({where:{
    status:"approved",opportunity:{organizationId:org.id,published:true},
    user:{status:"active",role:{not:"student"},verifiedAt:{not:null},
     memberships:{some:{organizationId:org.id,status:"active"}}}
   },take:100,include:{
     user:{select:{firstName:true,lastName:true}},opportunity:{select:{title:true,startsAt:true}}}}),
   db.volunteerShift.findMany({where:{opportunity:{organizationId:org.id}},take:100,orderBy:{startAt:"desc"},include:{
     volunteer:{select:{firstName:true,lastName:true}},opportunity:{select:{title:true}}}})
  ]);
  return ok({organization:{name:org.name,timeZone:org.timeZone},applications,shifts});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireCapability(req,"volunteers_manage");
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},
   select:{id:true,name:true,timeZone:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(input.kind==="schedule"||input.kind==="schedule-local"){
   const start=input.kind==="schedule-local"
    ?mosqueInstant(input.startLocal,org.timeZone):new Date(input.startAt);
   const end=input.kind==="schedule-local"
    ?mosqueInstant(input.endLocal,org.timeZone):new Date(input.endAt);
   if(start<=new Date()||end<=start||end.getTime()-start.getTime()>24*60*60*1000)
    throw new HttpError(422,"INVALID_SHIFT","Choose a future shift up to 24 hours long.");
   const result=await shiftTransaction(async tx=>{
    const app=await tx.volunteerApplication.findFirst({where:{
      id:input.applicationId,status:"approved",
      opportunity:{organizationId:org.id,published:true},
      user:{status:"active",role:{not:"student"},verifiedAt:{not:null},
       memberships:{some:{organizationId:org.id,status:"active"}}}
    }});
    if(!app)throw new HttpError(404,"NOT_APPROVED","Application is not approved.");
    // Check the same person's existing commitments across all organizations.
    // Only a generic conflict is returned; no foreign shift details are disclosed.
    const conflict=await tx.volunteerShift.findFirst({where:{
     userId:app.userId,status:"scheduled",startAt:{lt:end},endAt:{gt:start}
    },select:{id:true}});
    if(conflict)throw new HttpError(409,"OVERLAPPING_SHIFT","This volunteer has an overlapping shift.");
    const shift=await tx.volunteerShift.create({data:{applicationId:app.id,opportunityId:app.opportunityId,userId:app.userId,startAt:start,endAt:end}});
    await notifyUser(tx,org.id,app.userId,"Volunteer shift scheduled","You have a new volunteer shift. View your volunteer schedule.");
    await tx.auditEvent.create({data:{actorId:actor.id,action:"volunteer.shift.schedule",entity:"VolunteerShift",entityId:shift.id}});
    return {id:shift.id,status:shift.status};
   });
   return ok(result,201);
  }
  if(input.kind==="correct"){
   // Historical attendance may be corrected even if a member has since been
   // suspended. This never confers new attendance eligibility or grants a
   // volunteer permission to revise their own record.
   const provided=Number(Boolean(input.checkedInAt))+Number(Boolean(input.checkedInLocal));
   if(input.action==="adjust-arrival"?provided!==1:provided!==0)
    throw new HttpError(422,"INVALID_CORRECTION",
     "Supply exactly one corrected arrival time for an adjustment and no time for a removal.");
   const correctedAt=input.checkedInLocal?mosqueInstant(input.checkedInLocal,org.timeZone):
    input.checkedInAt?new Date(input.checkedInAt):null;
   const result=await shiftTransaction(async tx=>{
    const shift=await tx.volunteerShift.findFirst({where:{
     id:input.shiftId,opportunity:{organizationId:org.id}
    }});
    if(!shift)throw new HttpError(409,"SHIFT_NOT_AVAILABLE","Shift is not available for correction.");
    if(!shift.checkedInAt||!["scheduled","completed"].includes(shift.status))
     throw new HttpError(409,"NO_RECORDED_ARRIVAL","There is no recorded arrival to correct.");
    const now=new Date();
    // Limit high-impact changes to the coordinator's short operational
    // review period. A later dispute needs a separately governed process.
    if(now.getTime()>shift.endAt.getTime()+72*60*60_000)
     throw new HttpError(409,"CORRECTION_WINDOW_CLOSED","Attendance correction window has closed.");
    if(input.action==="remove-arrival"&&shift.status==="completed")
     throw new HttpError(409,"COMPLETED_SHIFT","A completed shift requires separate review to reverse attendance.");
    if(correctedAt){
     if(correctedAt.getTime()<shift.startAt.getTime()-15*60_000||
        correctedAt.getTime()>Math.min(shift.endAt.getTime(),now.getTime()))
      throw new HttpError(422,"INVALID_ARRIVAL","Corrected arrival must be within the actual check-in window.");
     if(correctedAt.getTime()===shift.checkedInAt.getTime())
      throw new HttpError(409,"NO_CHANGE","The corrected time must differ from the recorded time.");
    }
    const changed=await tx.volunteerShift.updateMany({where:{
     id:shift.id,status:shift.status,checkedInAt:shift.checkedInAt,
     opportunity:{organizationId:org.id}
    },data:{checkedInAt:correctedAt}});
    if(changed.count!==1)throw new HttpError(409,"SHIFT_CHANGED","Attendance changed. Refresh and try again.");
    await tx.auditEvent.create({data:{
     actorId:actor.id,action:"volunteer.shift."+input.action,
     entity:"VolunteerShift",entityId:shift.id,
     detail:JSON.stringify({reason:input.reason,
      previousCheckedInAt:shift.checkedInAt.toISOString(),
      correctedCheckedInAt:correctedAt?.toISOString()??null})
    }});
    await notifyUser(tx,org.id,shift.userId,"Volunteer attendance corrected",
     "A coordinator corrected your recorded volunteer attendance. Review your shift history.");
    return {id:shift.id,action:input.action,checkedInAt:correctedAt?.toISOString()??null};
   });
   return ok(result);
  }
  const result=await shiftTransaction(async tx=>{
   const shift=await tx.volunteerShift.findFirst({where:{id:input.shiftId,opportunity:{organizationId:org.id}}});
   if(!shift||shift.status!=="scheduled")throw new HttpError(409,"NOT_SCHEDULED","Shift is not available for this action.");
   if(input.action==="check-in"){
    // Approved applications and shifts are historical records, not permanent
    // permission to check in a suspended or unverified volunteer.
    const eligible=await tx.user.findFirst({where:{
     id:shift.userId,status:"active",role:{not:"student"},verifiedAt:{not:null},
     memberships:{some:{organizationId:org.id,status:"active"}}
    },select:{id:true}});
    const stillApproved=await tx.volunteerApplication.findFirst({where:{
     id:shift.applicationId,userId:shift.userId,opportunityId:shift.opportunityId,
     status:"approved",opportunity:{organizationId:org.id,published:true}
    },select:{id:true}});
    if(!eligible||!stillApproved)
     throw new HttpError(409,"VOLUNTEER_INELIGIBLE",
      "Volunteer approval or mosque membership is no longer active. Recheck before attendance.");
    if(shift.checkedInAt)throw new HttpError(409,"ALREADY_CHECKED_IN","Volunteer already checked in.");
    const now=new Date();
    if(shift.startAt>new Date(now.getTime()+15*60_000))
     throw new HttpError(409,"TOO_EARLY","Check-in starts fifteen minutes before the shift.");
    if(shift.endAt<=now)
     throw new HttpError(409,"TOO_LATE","The shift ended. Check-in requires a separately reviewed correction.");
   }
   if(input.action==="complete"){
    if(!shift.checkedInAt)throw new HttpError(422,"NOT_CHECKED_IN","Check in before completing a shift.");
    if(shift.startAt>new Date())
     throw new HttpError(409,"SHIFT_NOT_STARTED","The shift has not begun. Completion cannot be recorded.");
   }
   if(input.action==="cancel"&&shift.checkedInAt)
    throw new HttpError(409,"CHECKED_IN_SHIFT","A checked-in shift cannot be silently cancelled. Contact a coordinator for correction.");
   const updated=await tx.volunteerShift.updateMany({where:{
    id:shift.id,status:"scheduled",opportunity:{organizationId:org.id},
    ...(input.action==="complete"?{checkedInAt:{not:null}}:{checkedInAt:null})
   },
    data:input.action==="check-in"?{checkedInAt:new Date()}:{status:input.action==="complete"?"completed":"cancelled"}});
   if(!updated.count)throw new HttpError(409,"SHIFT_CHANGED","Shift already changed.");
   await tx.auditEvent.create({data:{actorId:actor.id,action:"volunteer.shift."+input.action,entity:"VolunteerShift",entityId:shift.id}});
   if(input.action==="cancel")await notifyUser(tx,org.id,shift.userId,"Volunteer shift cancelled","The mosque has cancelled a scheduled volunteer shift.");
   return {id:shift.id,action:input.action};
  });
  return ok(result);
 });
}

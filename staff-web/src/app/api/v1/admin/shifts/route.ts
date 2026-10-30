import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {notifyUser} from "@/lib/notifications";
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
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("schedule"),applicationId:z.string().min(8),startAt:z.iso.datetime(),endAt:z.iso.datetime()}),
 z.object({kind:z.literal("update"),shiftId:z.string().min(8),action:z.enum(["check-in","complete","cancel"])})
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireCapability(req,"volunteers_manage");
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [applications,shifts]=await Promise.all([
   db.volunteerApplication.findMany({where:{status:"approved",opportunity:{organizationId:org.id}},take:100,include:{
     user:{select:{firstName:true,lastName:true,email:true}},opportunity:{select:{title:true,startsAt:true}}}}),
   db.volunteerShift.findMany({where:{opportunity:{organizationId:org.id}},take:100,orderBy:{startAt:"desc"},include:{
     volunteer:{select:{firstName:true,lastName:true}},opportunity:{select:{title:true}}}})
  ]);
  return ok({applications,shifts});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireCapability(req,"volunteers_manage");
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(input.kind==="schedule"){
   const start=new Date(input.startAt),end=new Date(input.endAt);
   if(start<=new Date()||end<=start||end.getTime()-start.getTime()>24*60*60*1000)
    throw new HttpError(422,"INVALID_SHIFT","Choose a future shift up to 24 hours long.");
   const result=await shiftTransaction(async tx=>{
    const app=await tx.volunteerApplication.findFirst({where:{
      id:input.applicationId,status:"approved",opportunity:{organizationId:org.id}
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
  const result=await shiftTransaction(async tx=>{
   const shift=await tx.volunteerShift.findFirst({where:{id:input.shiftId,opportunity:{organizationId:org.id}}});
   if(!shift||shift.status!=="scheduled")throw new HttpError(409,"NOT_SCHEDULED","Shift is not available for this action.");
   if(input.action==="check-in"){
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

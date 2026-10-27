import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("schedule"),applicationId:z.string().min(8),startAt:z.iso.datetime(),endAt:z.iso.datetime()}),
 z.object({kind:z.literal("update"),shiftId:z.string().min(8),action:z.enum(["check-in","complete","cancel"])})
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","staff"]);
  const [applications,shifts]=await Promise.all([
   db.volunteerApplication.findMany({where:{status:"approved"},take:100,include:{
     user:{select:{firstName:true,lastName:true,email:true}},opportunity:{select:{title:true,startsAt:true}}}}),
   db.volunteerShift.findMany({take:100,orderBy:{startAt:"desc"},include:{
     volunteer:{select:{firstName:true,lastName:true}},opportunity:{select:{title:true}}}})
  ]);
  return ok({applications,shifts});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireVerified(req,["admin","staff"]);
  const input=command.parse(await jsonBody(req));
  if(input.kind==="schedule"){
   const start=new Date(input.startAt),end=new Date(input.endAt);
   if(start<=new Date()||end<=start||end.getTime()-start.getTime()>24*60*60*1000)
    throw new HttpError(422,"INVALID_SHIFT","Choose a future shift up to 24 hours long.");
   const result=await db.$transaction(async tx=>{
    const app=await tx.volunteerApplication.findFirst({where:{id:input.applicationId,status:"approved"}});
    if(!app)throw new HttpError(404,"NOT_APPROVED","Application is not approved.");
    const conflict=await tx.volunteerShift.findFirst({where:{userId:app.userId,status:"scheduled",startAt:{lt:end},endAt:{gt:start}}});
    if(conflict)throw new HttpError(409,"OVERLAPPING_SHIFT","This volunteer has an overlapping shift.");
    const shift=await tx.volunteerShift.create({data:{applicationId:app.id,opportunityId:app.opportunityId,userId:app.userId,startAt:start,endAt:end}});
    await tx.notification.create({data:{userId:app.userId,title:"Volunteer shift scheduled",body:"You have a new volunteer shift. View your volunteer schedule."}});
    await tx.auditEvent.create({data:{actorId:actor.id,action:"volunteer.shift.schedule",entity:"VolunteerShift",entityId:shift.id}});
    return {id:shift.id,status:shift.status};
   },{isolationLevel:"Serializable"});
   return ok(result,201);
  }
  const result=await db.$transaction(async tx=>{
   const shift=await tx.volunteerShift.findUnique({where:{id:input.shiftId}});
   if(!shift||shift.status!=="scheduled")throw new HttpError(409,"NOT_SCHEDULED","Shift is not available for this action.");
   if(input.action==="check-in"){
    if(shift.checkedInAt)throw new HttpError(409,"ALREADY_CHECKED_IN","Volunteer already checked in.");
    if(shift.startAt>new Date(Date.now()+15*60_000))throw new HttpError(409,"TOO_EARLY","Check-in is allowed up to 15 minutes before the shift.");
   }
   if(input.action==="complete"&&!shift.checkedInAt)throw new HttpError(422,"NOT_CHECKED_IN","Check in before completing a shift.");
   const updated=await tx.volunteerShift.updateMany({where:{id:shift.id,status:"scheduled"},
    data:input.action==="check-in"?{checkedInAt:new Date()}:{status:input.action==="complete"?"completed":"cancelled"}});
   if(!updated.count)throw new HttpError(409,"SHIFT_CHANGED","Shift already changed.");
   await tx.auditEvent.create({data:{actorId:actor.id,action:"volunteer.shift."+input.action,entity:"VolunteerShift",entityId:shift.id}});
   if(input.action==="cancel")await tx.notification.create({data:{userId:shift.userId,title:"Volunteer shift cancelled",body:"The mosque has cancelled a scheduled volunteer shift."}});
   return {id:shift.id,action:input.action};
  },{isolationLevel:"Serializable"});
  return ok(result);
 });
}

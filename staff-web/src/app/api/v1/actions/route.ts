import { NextRequest } from "next/server";
import {Prisma} from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireVerified, audit } from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import { handled, HttpError, jsonBody, ok, assertSameOrigin } from "@/lib/http";

const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("rsvp"),eventId:z.string().min(8)}),
 z.object({kind:z.literal("volunteer"),opportunityId:z.string().min(8)}),
 z.object({kind:z.literal("vote"),proposalId:z.string().min(8)}),
 z.object({kind:z.literal("job"),jobId:z.string().min(8),coverLetter:z.string().trim().min(10).max(3000)}),
 z.object({kind:z.literal("rental"),resourceId:z.string().min(8),startAt:z.iso.datetime(),endAt:z.iso.datetime()}),
 z.object({kind:z.literal("attendance"),sessionId:z.string().min(8),studentId:z.string().min(8),status:z.enum(["present","absent","late","excused"])}),
]);
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const input=schema.parse(await jsonBody(req));
  const organization=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!organization)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(input.kind==="rsvp"){
    try{
    const output=await db.$transaction(async tx=>{
      const event=await tx.event.findFirst({where:{id:input.eventId,organizationId:organization.id}});
      if(!event||event.status!=="published"||event.startAt<=new Date())
        throw new HttpError(404,"UNAVAILABLE","Event unavailable.");
      const existing=await tx.eventRSVP.findUnique({where:{eventId_userId:{eventId:event.id,userId:user.id}}});
      if(existing)return {
        joined:existing.status==="confirmed",alreadyJoined:true,status:existing.status,
        message:existing.status==="confirmed"?"You already have a confirmed place.":"You are already on the waitlist."
      };
      const claimed=await tx.event.updateMany({
        where:{id:event.id,status:"published",startAt:{gt:new Date()},
          ...(event.capacity===null?{}:{rsvpCount:{lt:event.capacity}})},
        data:{rsvpCount:{increment:1}}
      });
      if(claimed.count){
        await tx.eventRSVP.create({data:{eventId:event.id,userId:user.id,status:"confirmed"}});
        return {joined:true,alreadyJoined:false,status:"confirmed",message:"Your event reservation is confirmed."};
      }
      if(!event.waitlistEnabled)
        throw new HttpError(409,"EVENT_FULL","This gathering is full and has no waitlist.");
      await tx.eventRSVP.create({data:{eventId:event.id,userId:user.id,status:"waitlisted"}});
      return {joined:false,alreadyJoined:false,status:"waitlisted",
        message:"You are on the waitlist. This is not a confirmed reservation."};
    },{isolationLevel:"Serializable"});
    return ok(output,201);
    }catch(error){
      if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2034","P2002"].includes(error.code))
        throw new HttpError(409,"RETRY_RESERVATION","The event reservation changed. Please try again.");
      throw error;
    }
  }
  if(input.kind==="volunteer"){
    const opp=await db.volunteerOpportunity.findFirst({where:{id:input.opportunityId,organizationId:organization.id,published:true}});
    if(!opp)throw new HttpError(404,"NOT_FOUND","Opportunity unavailable.");
    const row=await db.volunteerApplication.upsert({where:{opportunityId_userId:{opportunityId:opp.id,userId:user.id}},update:{},create:{opportunityId:opp.id,userId:user.id}});
    return ok({id:row.id,status:row.status},201);
  }
  if(input.kind==="vote"){
    const proposal=await db.proposal.findFirst({where:{id:input.proposalId,organizationId:organization.id,status:"published"}});
    if(!proposal)throw new HttpError(404,"NOT_FOUND","Proposal unavailable.");
    const row=await db.proposalVote.upsert({where:{proposalId_userId:{proposalId:proposal.id,userId:user.id}},update:{},create:{proposalId:proposal.id,userId:user.id}});
    return ok({id:row.id,voted:true},201);
  }
  if(input.kind==="job"){
    const job=await db.jobPosting.findFirst({where:{id:input.jobId,organizationId:organization.id,status:"published"}});
    if(!job)throw new HttpError(404,"NOT_FOUND","Job unavailable.");
    const row=await db.jobApplication.upsert({where:{jobId_userId:{jobId:job.id,userId:user.id}},update:{},create:{jobId:job.id,userId:user.id,coverLetter:input.coverLetter}});
    return ok({id:row.id,applied:true},201);
  }
  if(input.kind==="rental"){
    const start=new Date(input.startAt),end=new Date(input.endAt);
    if(start<=new Date()||end<=start||end.getTime()-start.getTime()>7*86400000)throw new HttpError(422,"INVALID_TIME","Choose a future interval up to seven days.");
    const item=await db.rentalResource.findFirst({where:{id:input.resourceId,organizationId:organization.id,published:true}});
    if(!item)throw new HttpError(404,"NOT_FOUND","Rental unavailable.");
    if(await db.rentalBooking.findFirst({where:{resourceId:item.id,status:"approved",startAt:{lt:end},endAt:{gt:start}}}))throw new HttpError(409,"BOOKED","Time unavailable.");
    const row=await db.rentalBooking.create({data:{resourceId:item.id,userId:user.id,startAt:start,endAt:end}});
    return ok({id:row.id,status:row.status,message:"Request sent for review; booking not confirmed."},201);
  }
  if(input.kind==="attendance"){
    if(!["teacher","admin"].includes(user.role))throw new HttpError(403,"FORBIDDEN","Teacher permission required.");
    const org=organization;
    const session=await db.classSession.findFirst({
      where:{id:input.sessionId,classSection:{program:{organizationId:org.id}}},
      include:{classSection:{include:{teachers:true}}}
    });
    if(!session||!(user.role==="admin"||session.classSection.teachers.some(x=>x.teacherId===user.id)))throw new HttpError(403,"NOT_ASSIGNED","Class is not assigned.");
    const enrollment=await db.enrollment.findFirst({where:{studentId:input.studentId,classId:session.classId,status:"active",student:schoolStudentScope(org.id)}});
    if(!enrollment||enrollment.status!=="active")throw new HttpError(404,"NOT_ENROLLED","Student not enrolled.");
    const row=await db.attendance.upsert({where:{sessionId_studentId:{sessionId:session.id,studentId:input.studentId}},update:{status:input.status,markedById:user.id},create:{sessionId:session.id,studentId:input.studentId,status:input.status,markedById:user.id}});
    await audit(user.id,"attendance.mark","Attendance",row.id);
    return ok({id:row.id,status:row.status});
  }
  throw new HttpError(422,"BAD_ACTION","Unknown action.");
 });
}

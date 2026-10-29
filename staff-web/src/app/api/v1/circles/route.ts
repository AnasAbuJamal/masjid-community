import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const command=z.object({circleId:z.string().min(8)});
const cooldown={declined:14,left:7} as const;

export async function GET(){
 return handled(async()=>{
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)return ok({organization:null,items:[]});
  const items=await db.circle.findMany({
   where:{organizationId:org.id,status:"published"},
   orderBy:[{createdAt:"desc"},{id:"asc"}],take:100,
   select:{id:true,title:true,summary:true,cadence:true,guidelines:true}
  });
  return ok({organization:{id:org.id,name:org.name},items,
   note:"Public descriptions only. Circle membership and private updates require moderator approval."});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const member=await requireVerified(req);
  if(member.role==="student")throw new HttpError(403,"ADULT_ONLY","This initial circle program accepts verified adult members only.");
  const {circleId}=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try {
   const outcome=await db.$transaction(async tx=>{
    const circle=await tx.circle.findFirst({where:{id:circleId,organizationId:org.id,status:"published"},select:{id:true}});
    if(!circle)throw new HttpError(404,"CIRCLE_UNAVAILABLE","Published circle unavailable.");
    const prior=await tx.circleMember.findUnique({where:{
     circleId_userId:{circleId,userId:member.id}
    }});
    if(prior?.status==="requested"||prior?.status==="approved")
     return {id:prior.id,status:prior.status,created:false};
    if(prior?.status==="declined"||prior?.status==="left"){
     const interval=cooldown[prior.status]*86400000;
     if(prior.updatedAt.getTime()+interval>Date.now())
      throw new HttpError(409,"JOIN_COOLDOWN","You can request to join again after the review cooldown.");
    }
    const row=prior
     ?await tx.circleMember.update({where:{id:prior.id},data:{
       status:"requested",requestedAt:new Date(),reviewedAt:null,
       reviewedById:null,decisionReason:null}})
     :await tx.circleMember.create({data:{circleId,userId:member.id}});
    await tx.auditEvent.create({data:{
     actorId:member.id,action:"circle.join.request",entity:"CircleMember",entityId:row.id,
     detail:JSON.stringify({circleId,organizationId:org.id})
    }});
    return {id:row.id,status:row.status,created:true};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok({...outcome,
    message:outcome.status==="approved"?"Your membership is approved.":outcome.created?"Request submitted for host review. You cannot view private updates yet.":"Your request is awaiting host review."},outcome.created?201:200);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"JOIN_CHANGED","Circle membership changed. Refresh and retry.");
   throw error;
  }
 });
}

export async function DELETE(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const member=await requireVerified(req);
  const {circleId}=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const result=await db.$transaction(async tx=>{
   const circle=await tx.circle.findFirst({where:{id:circleId,organizationId:org.id},
    select:{id:true}});
   if(!circle)throw new HttpError(404,"CIRCLE_UNAVAILABLE","Circle unavailable.");
   const row=await tx.circleMember.findUnique({where:{circleId_userId:{circleId,userId:member.id}}});
   if(!row||row.status==="left")return {left:true,alreadyLeft:true};
   if(row.status==="declined")throw new HttpError(409,"JOIN_COOLDOWN",
    "A declined request must remain in review cooldown. You may request a review from the mosque.");
   const updated=await tx.circleMember.updateMany({
    where:{id:row.id,circleId,userId:member.id,status:{in:["requested","approved"]}},
    data:{status:"left",reviewedAt:null,reviewedById:null,decisionReason:null}
   });
   if(!updated.count)throw new HttpError(409,"JOIN_CHANGED","Membership changed. Refresh and retry.");
   await tx.auditEvent.create({data:{actorId:member.id,action:"circle.member.leave",
    entity:"CircleMember",entityId:row.id,detail:JSON.stringify({circleId,organizationId:org.id})}});
   return {left:true,alreadyLeft:false};
  });
  return ok(result);
 });
}

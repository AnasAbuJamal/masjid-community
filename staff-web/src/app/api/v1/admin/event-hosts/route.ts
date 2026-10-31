import {NextRequest} from "next/server";
import {z} from "zod";
import {Prisma} from "@prisma/client";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const inputSchema=z.object({
 eventId:z.string().min(8),hostId:z.string().min(8),
 action:z.enum(["assign","revoke"])
}).strict();

export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [events,members]=await Promise.all([
   db.event.findMany({
    where:{organizationId:org.id,status:"published",endAt:{gte:new Date(Date.now()-7*86400000)}},
    orderBy:{startAt:"asc"},take:70,
    select:{id:true,title:true,startAt:true,endAt:true,
     hostAssignments:{where:{revokedAt:null},select:{id:true,hostId:true,
      host:{select:{firstName:true,lastName:true}}}}}
   }),
   db.user.findMany({where:{status:"active",verifiedAt:{not:null},role:{not:"student"},
    memberships:{some:{organizationId:org.id,status:"active"}}},take:100,
    orderBy:{firstName:"asc"},select:{id:true,firstName:true,lastName:true,role:true}})
  ]);
  return ok({events,members});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=inputSchema.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  // Check event publication and host eligibility inside the same
  // serialized transaction that writes the assignment and audit record.
  try{
   const result=await db.$transaction(async tx=>{
    const event=await tx.event.findFirst({
     where:{id:input.eventId,organizationId:org.id,status:"published"},
     select:{id:true}
    });
    if(!event)throw new HttpError(404,"EVENT_NOT_FOUND","Published gathering unavailable.");
    if(input.action==="assign"){
     const member=await tx.user.findFirst({where:{
      id:input.hostId,status:"active",verifiedAt:{not:null},role:{not:"student"},
      memberships:{some:{organizationId:org.id,status:"active"}}
     },select:{id:true}});
     if(!member)throw new HttpError(422,"INVALID_HOST",
      "Choose a verified, active non-student member of this mosque.");
    }
   if(input.action==="revoke"){
    const changed=await tx.eventHostAssignment.updateMany({where:{
     eventId:event.id,hostId:input.hostId,revokedAt:null,
     event:{organizationId:org.id}
    },data:{revokedAt:new Date()}});
    if(!changed.count)throw new HttpError(404,"ASSIGNMENT_NOT_FOUND","Active host assignment unavailable.");
   }else{
    await tx.eventHostAssignment.upsert({
     where:{eventId_hostId:{eventId:event.id,hostId:input.hostId}},
     create:{eventId:event.id,hostId:input.hostId,assignedById:admin.id},
     update:{revokedAt:null,assignedById:admin.id,assignedAt:new Date()}
    });
   }
   await tx.auditEvent.create({data:{
    actorId:admin.id,action:"gather.host."+input.action,entity:"Event",
    entityId:event.id,detail:JSON.stringify({hostId:input.hostId,organizationId:org.id})
   }});
   return {eventId:event.id,hostId:input.hostId,action:input.action};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&
      ["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"HOST_ASSIGNMENT_CHANGED",
     "The assignment changed while being saved. Refresh and retry.");
   throw error;
  }
 });
}

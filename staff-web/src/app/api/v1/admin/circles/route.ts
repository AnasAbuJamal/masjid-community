import {NextRequest} from "next/server";
import {z} from "zod";
import {Prisma} from "@prisma/client";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const create=z.object({action:z.literal("create"),
 title:z.string().trim().min(5).max(120),
 summary:z.string().trim().min(20).max(1500),
 cadence:z.string().trim().min(4).max(140),
 guidelines:z.string().trim().min(20).max(1600),
 hostId:z.string().min(8),published:z.boolean().default(false)}).strict();
const change=z.object({action:z.literal("change-status"),circleId:z.string().min(8),
 status:z.enum(["published","archived"])}).strict();

export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [circles,hosts]=await Promise.all([
   db.circle.findMany({where:{organizationId:org.id},orderBy:{createdAt:"desc"},take:100,
    select:{id:true,title:true,status:true,cadence:true,hostId:true,
     host:{select:{firstName:true,lastName:true}},_count:{select:{members:true}}}}),
   db.user.findMany({where:{status:"active",verifiedAt:{not:null},role:{not:"student"},
    memberships:{some:{organizationId:org.id,status:"active"}}},
    orderBy:{firstName:"asc"},take:100,
    select:{id:true,firstName:true,lastName:true}})
  ]);
  return ok({circles,hosts});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=create.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  // A preflight check is insufficient: check host eligibility and write
  // the circle/audit inside one serializable database transaction.
  try{
   const result=await db.$transaction(async tx=>{
    const host=await tx.user.findFirst({where:{
     id:input.hostId,status:"active",verifiedAt:{not:null},role:{not:"student"},
     memberships:{some:{organizationId:org.id,status:"active"}}
    },select:{id:true}});
    if(!host)throw new HttpError(422,"INVALID_HOST",
     "Choose a verified active non-student member of this mosque.");
    const circle=await tx.circle.create({data:{
     organizationId:org.id,hostId:host.id,title:input.title,
     summary:input.summary,cadence:input.cadence,guidelines:input.guidelines,
     status:input.published?"published":"draft"
    }});
    await tx.auditEvent.create({data:{actorId:admin.id,action:"circle.create",entity:"Circle",
     entityId:circle.id,
     detail:JSON.stringify({organizationId:org.id,hostId:host.id,published:input.published})}});
    return {id:circle.id,status:circle.status};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result,201);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&
      ["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"CIRCLE_CHANGED",
     "Circle authorization changed during creation. Refresh and retry.");
   throw error;
  }
 });
}

export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=change.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const result=await db.$transaction(async tx=>{
   const current=await tx.circle.findFirst({where:{id:input.circleId,organizationId:org.id},
    select:{id:true,status:true,hostId:true}});
   if(!current)throw new HttpError(404,"CIRCLE_UNAVAILABLE","Circle unavailable.");
   if(current.status===input.status)return {id:current.id,status:current.status,unchanged:true};
   if(current.status==="archived")throw new HttpError(409,"CIRCLE_ARCHIVED","Archived circles cannot be republished without a new safeguarding review.");
   if(input.status==="published"){
    const host=await tx.user.findFirst({where:{
     id:current.hostId,status:"active",verifiedAt:{not:null},role:{not:"student"},
     memberships:{some:{organizationId:org.id,status:"active"}}
    },select:{id:true}});
    if(!host)throw new HttpError(409,"HOST_UNAVAILABLE","Assign a currently verified adult host before publication.");
   }
   const updated=await tx.circle.updateMany({where:{id:current.id,organizationId:org.id,status:current.status},
    data:{status:input.status}});
   if(!updated.count)throw new HttpError(409,"CIRCLE_CHANGED","Circle status changed. Refresh.");
   await tx.auditEvent.create({data:{actorId:admin.id,action:"circle.status."+input.status,
    entity:"Circle",entityId:current.id,detail:JSON.stringify({organizationId:org.id,previous:current.status})}});
   return {id:current.id,status:input.status,unchanged:false};
  });
  return ok(result);
 });
}

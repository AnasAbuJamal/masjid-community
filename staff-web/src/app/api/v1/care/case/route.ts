import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {careCoordinator,decryptCare} from "@/lib/care";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const status=z.object({caseId:z.string().min(8),status:z.enum(["in_review","closed"]),
 reason:z.string().trim().min(10).max(240)});
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {actor,org}=await careCoordinator(req);
  const caseId=z.string().min(8).parse(req.nextUrl.searchParams.get("caseId"));
  const c=await db.$transaction(async tx=>{
   const current=await tx.careRequest.findFirst({where:{
    id:caseId,organizationId:org.id,status:{not:"closed"},
    access:{some:{assigneeId:actor.id,status:"approved",expiresAt:{gt:new Date()},revokedAt:null}}
   },select:{id:true,reference:true,status:true,encryptedMessage:true,createdAt:true}});
   if(!current)throw new HttpError(404,"CARE_CASE_UNAVAILABLE",
    "This case is closed or you have no current approved assignment.");
   await tx.auditEvent.create({data:{
    actorId:actor.id,action:"care.case.read",entity:"CareRequest",entityId:current.id,
    detail:JSON.stringify({organizationId:org.id})
   }});
   return current;
  });
  const message=decryptCare(c.encryptedMessage,org.id,c.id);
  return ok({reference:c.reference,status:c.status,createdAt:c.createdAt,message,
   policy:"Confidential. Contact the requester through separately authorized channels. Never paste case details into general email, push or analytics."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {actor,org}=await careCoordinator(req);
  const input=status.parse(await jsonBody(req));
  try{
   const result=await db.$transaction(async tx=>{
    const c=await tx.careRequest.findFirst({where:{
     id:input.caseId,organizationId:org.id,status:{not:"closed"},
     access:{some:{assigneeId:actor.id,status:"approved",
      expiresAt:{gt:new Date()},revokedAt:null}}
    },select:{id:true,reference:true,status:true}});
    if(!c)throw new HttpError(404,"CARE_CASE_UNAVAILABLE",
     "This case is closed or your assignment has expired.");
    if(c.status===input.status)throw new HttpError(409,"CARE_NO_CHANGE","Case is already at this stage.");
    const updated=await tx.careRequest.updateMany({where:{id:c.id,organizationId:org.id,status:c.status},
     data:{status:input.status,...(input.status==="closed"?{closedAt:new Date()}:{})}});
    if(!updated.count)throw new HttpError(409,"CARE_CHANGED","Case state changed. Refresh.");
    if(input.status==="closed")await tx.careCaseAccess.updateMany({where:{
     caseId:c.id,status:{in:["proposed","approved"]}
    },data:{status:"revoked",revokedAt:new Date()}});
    await tx.auditEvent.create({data:{
     actorId:actor.id,action:"care.case."+input.status,entity:"CareRequest",entityId:c.id,
     detail:JSON.stringify({organizationId:org.id,reason:input.reason})
    }});
    return {reference:c.reference,status:input.status};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"CARE_CHANGED","Case state changed. Refresh.");
   throw error;
  }
 });
}

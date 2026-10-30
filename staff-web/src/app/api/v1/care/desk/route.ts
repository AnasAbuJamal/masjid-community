import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {careCoordinator} from "@/lib/care";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const command=z.discriminatedUnion("action",[
 z.object({action:z.literal("propose-access"),caseId:z.string().min(8),
  assigneeId:z.string().min(8),purpose:z.string().trim().min(15).max(280)}),
 z.object({action:z.literal("approve-access"),accessId:z.string().min(8)}),
 z.object({action:z.literal("revoke-access"),accessId:z.string().min(8),
  reason:z.string().trim().min(10).max(200)})
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {actor,org}=await careCoordinator(req);
  const [requests,access,coordinators]=await Promise.all([
   db.careRequest.findMany({where:{organizationId:org.id},orderBy:{createdAt:"desc"},take:100,
    select:{id:true,reference:true,status:true,createdAt:true,closedAt:true}}),
   db.careCaseAccess.findMany({where:{careCase:{organizationId:org.id},status:{in:["proposed","approved"]}},
    orderBy:{createdAt:"desc"},take:150,
    select:{id:true,caseId:true,assigneeId:true,proposedById:true,approvedById:true,status:true,expiresAt:true,
     assignee:{select:{firstName:true,lastName:true}}}}),
   db.user.findMany({where:{
    role:"staff",status:"active",verifiedAt:{not:null},mfaEnabledAt:{not:null},
    memberships:{some:{organizationId:org.id,status:"active",
     grants:{some:{capability:"care_manage",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]}}}}
   },select:{id:true,firstName:true,lastName:true},orderBy:{firstName:"asc"},take:40})
  ]);
  // No applicant names, message content, email, categories or case contact
  // details are shown in this triage index.
  return ok({requests,access,coordinators,viewerId:actor.id,
   policy:"Two distinct trained care coordinators must authorize a case assignee before any confidential narrative can be decrypted."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {actor,org}=await careCoordinator(req);
  const input=command.parse(await jsonBody(req));
  try{
   const result=await db.$transaction(async tx=>{
    const now=new Date();
    if(input.action==="propose-access"){
     if(input.assigneeId===actor.id)throw new HttpError(403,"SELF_ASSIGNMENT",
      "Another coordinator must propose your case assignment.");
     const c=await tx.careRequest.findFirst({where:{
      id:input.caseId,organizationId:org.id,status:{not:"closed"}
     },select:{id:true}});
     if(!c)throw new HttpError(404,"CARE_CASE_UNAVAILABLE","Open case unavailable.");
     const member=await tx.user.findFirst({where:{
      id:input.assigneeId,role:"staff",status:"active",verifiedAt:{not:null},mfaEnabledAt:{not:null},
      memberships:{some:{organizationId:org.id,status:"active",
       grants:{some:{capability:"care_manage",revokedAt:null,
        OR:[{expiresAt:null},{expiresAt:{gt:now}}]}}}}
     },select:{id:true}});
     if(!member)throw new HttpError(422,"INVALID_ASSIGNEE",
      "Choose another MFA-enrolled care coordinator in this mosque.");
     const prior=await tx.careCaseAccess.findUnique({where:{
      caseId_assigneeId:{caseId:c.id,assigneeId:member.id}
     },select:{id:true}});
     if(prior)throw new HttpError(409,"ACCESS_ALREADY_RECORDED",
      "An access request or historical approval already exists for this case.");
     const saved=await tx.careCaseAccess.create({data:{
      caseId:c.id,assigneeId:member.id,proposedById:actor.id,
      reason:input.purpose,expiresAt:new Date(now.getTime()+24*3600000)
     }});
     await tx.auditEvent.create({data:{
      actorId:actor.id,action:"care.access.propose",entity:"CareCaseAccess",entityId:saved.id,
      detail:JSON.stringify({organizationId:org.id,caseId:c.id,assigneeId:member.id})
     }});
     return {id:saved.id,status:"proposed"};
    }
    const prior=await tx.careCaseAccess.findFirst({where:{
     id:input.accessId,careCase:{organizationId:org.id}
    },select:{id:true,caseId:true,proposedById:true,assigneeId:true,status:true,expiresAt:true}});
    if(!prior)throw new HttpError(404,"ACCESS_UNAVAILABLE","Case access record unavailable.");
    if(input.action==="approve-access"){
     if(prior.status!=="proposed"||prior.expiresAt<=now)throw new HttpError(409,"ACCESS_NOT_PENDING","Access proposal expired or already decided.");
     if(prior.proposedById===actor.id||prior.assigneeId===actor.id)
      throw new HttpError(403,"TWO_PERSON_REQUIRED",
       "Approval must come from another coordinator, not the proposer or assignee.");
     const caseStillOpen=await tx.careRequest.findFirst({where:{
      id:prior.caseId,organizationId:org.id,status:{not:"closed"}
     },select:{id:true}});
     if(!caseStillOpen)throw new HttpError(409,"CARE_CLOSED","The case is already closed.");
     const authorized=await tx.roleGrant.findFirst({where:{
      membership:{organizationId:org.id,userId:prior.assigneeId,status:"active",
       user:{role:"staff",status:"active",verifiedAt:{not:null},mfaEnabledAt:{not:null}}},
      capability:"care_manage",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:now}}]
     },select:{id:true}});
     if(!authorized)throw new HttpError(409,"ASSIGNEE_REVOKED","The proposed assignee no longer has confidential-care authority.");
     const changed=await tx.careCaseAccess.updateMany({where:{id:prior.id,status:"proposed",expiresAt:{gt:now}},
      data:{status:"approved",approvedById:actor.id,approvedAt:now,expiresAt:new Date(now.getTime()+7*86400000)}});
     if(!changed.count)throw new HttpError(409,"ACCESS_CHANGED","Access proposal changed. Refresh.");
     await tx.auditEvent.create({data:{
      actorId:actor.id,action:"care.access.approve",entity:"CareCaseAccess",entityId:prior.id,
      detail:JSON.stringify({organizationId:org.id,caseId:prior.caseId,assigneeId:prior.assigneeId})
     }});
     return {id:prior.id,status:"approved"};
    }
    if(prior.status!=="approved"||prior.expiresAt<=now)
     throw new HttpError(409,"ACCESS_NOT_ACTIVE","Only a current approved case grant may be revoked.");
    const changed=await tx.careCaseAccess.updateMany({where:{id:prior.id,status:"approved"},
     data:{status:"revoked",revokedAt:now}});
    if(!changed.count)throw new HttpError(409,"ACCESS_CHANGED","Case access already changed.");
    await tx.auditEvent.create({data:{
     actorId:actor.id,action:"care.access.revoke",entity:"CareCaseAccess",entityId:prior.id,
     detail:JSON.stringify({organizationId:org.id,caseId:prior.caseId,reason:input.reason})
    }});
    return {id:prior.id,status:"revoked"};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result,result.status==="proposed"?201:200);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"ACCESS_CHANGED","Confidential access changed. Refresh.");
   throw error;
  }
 });
}

import {NextRequest} from "next/server";
import {randomBytes,randomUUID} from "node:crypto";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
import {carePolicy,encryptCare,requireCareIntake} from "@/lib/care";

const input=z.object({
 message:z.string().trim().min(20).max(650),
 consent:z.literal(true),
 consentVersion:z.literal("care-consent-v1")
});
export async function GET(){
 return handled(async()=>ok(carePolicy()));
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const policy=requireCareIntake();
  const user=await requireVerified(req);
  if(user.role==="student")throw new HttpError(403,"ADULT_ONLY",
   "This preliminary online intake accepts verified adult applicants only.");
  const values=input.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const recent=await db.careRequest.count({where:{
   organizationId:org.id,requesterId:user.id,createdAt:{gt:new Date(Date.now()-86400000)}
  }});
  if(recent>=3)throw new HttpError(429,"CARE_REQUEST_LIMIT",
   "You already have several recent requests. Contact the mosque directly for a follow-up.");
  const id=randomUUID();
  const reference="CARE-"+randomBytes(6).toString("hex").toUpperCase();
  const encryptedMessage=encryptCare(values.message,org.id,id);
  const now=new Date();
  const request=await db.$transaction(async tx=>{
   const saved=await tx.careRequest.create({data:{
    id,reference,organizationId:org.id,requesterId:user.id,
    encryptedMessage,consentVersion:policy.consentVersion,consentedAt:now,
    retentionAt:new Date(now.getTime()+90*86400000)
   },select:{id:true,reference:true,status:true,createdAt:true}});
   await tx.auditEvent.create({data:{
    actorId:user.id,action:"care.request.submit",entity:"CareRequest",entityId:saved.id,
    detail:JSON.stringify({organizationId:org.id,consentVersion:policy.consentVersion})
   }});
   return saved;
  });
  return ok({reference:request.reference,status:request.status,createdAt:request.createdAt,
   responseExpectation:policy.response,
   message:"Your private reference has been recorded. This is not an emergency response service."},201);
 });
}

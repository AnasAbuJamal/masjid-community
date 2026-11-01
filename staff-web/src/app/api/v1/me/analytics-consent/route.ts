import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const change=z.object({enabled:z.boolean(),confirm:z.literal(true)}).strict();
const policy="Optional and off by default per mosque. With consent, historical and future confirmed RSVPs may contribute only to coarse administrator-only bands for completed public gatherings. Never use for advertising, profiling or browsing surveillance; counts below ten are suppressed. Revocation excludes your records from future calculations. No external tracking provider is involved.";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org}=await requireMemberContext(req);
  if(user.role==="student")throw new HttpError(403,"STUDENT_ANALYTICS_DISABLED",
   "School student accounts are not eligible for this pilot.");
  const row=await db.organizationAnalyticsConsent.findUnique({where:{
   organizationId_userId:{organizationId:org.id,userId:user.id}
  },select:{enabled:true,consentedAt:true}});
  return ok({organization:{id:org.id,name:org.name},
   enabled:!!row?.enabled&&!!row.consentedAt,consentedAt:row?.enabled?row.consentedAt:null,policy});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {user,org}=await requireMemberContext(req);
  if(user.role==="student")throw new HttpError(403,"STUDENT_ANALYTICS_DISABLED",
   "Student-role accounts cannot opt in to optional attendance analytics.");
  const input=change.parse(await jsonBody(req));
  try{
   const result=await db.$transaction(async tx=>{
    const membership=await tx.organizationMembership.findUnique({where:{
     organizationId_userId:{organizationId:org.id,userId:user.id}
    },select:{status:true}});
    const currentUser=await tx.user.findFirst({where:{
     id:user.id,status:"active",verifiedAt:{not:null},role:{not:"student"}
    },select:{id:true}});
    if(membership?.status!=="active"||!currentUser)
     throw new HttpError(403,"CONSENT_UNAVAILABLE",
      "An active, verified non-student membership is required.");
    const existing=await tx.organizationAnalyticsConsent.findUnique({where:{
     organizationId_userId:{organizationId:org.id,userId:user.id}
    },select:{id:true,enabled:true,consentedAt:true}});
    // An opt-out without any past consent needs no persistent row.
    if(!existing&&!input.enabled)return {enabled:false,consentedAt:null,changed:false};
    if(existing?.enabled===input.enabled)return {
     enabled:!!existing.enabled,consentedAt:existing.enabled?existing.consentedAt:null,changed:false
    };
    const now=new Date();
    const saved=existing?await tx.organizationAnalyticsConsent.update({
     where:{id:existing.id},
     data:{enabled:input.enabled,consentedAt:input.enabled?now:null},
     select:{enabled:true,consentedAt:true}
    }):await tx.organizationAnalyticsConsent.create({data:{
     organizationId:org.id,userId:user.id,enabled:true,consentedAt:now
    },select:{enabled:true,consentedAt:true}});
    await tx.auditEvent.create({data:{actorId:user.id,action:"analytics.consent.change",
     entity:"OrganizationAnalyticsConsent",entityId:org.id,
     detail:JSON.stringify({organizationId:org.id,from:existing?.enabled||false,to:saved.enabled,
      purpose:"coarse_completed_gatherings",channel:"internal_only"})
    }});
    return {...saved,changed:true};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok({organization:{id:org.id,name:org.name},...result,policy});
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&
      ["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"CONSENT_CHANGED","Consent was changed in another session. Refresh.");
   throw error;
  }
 });
}

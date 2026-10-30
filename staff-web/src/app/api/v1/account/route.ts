import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireActor} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const update=z.object({firstName:z.string().trim().min(1).max(100).optional(),lastName:z.string().trim().min(1).max(100).optional(),
 newsletterOptIn:z.boolean().optional(),eventEmailOptIn:z.boolean().optional(),quietHoursEnabled:z.boolean().optional()});
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireActor(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  const membership=org?await db.organizationMembership.findUnique({where:{
   organizationId_userId:{organizationId:org.id,userId:user.id}
  },select:{status:true}}):null;
  const [preferences,sessions,deletion]=await Promise.all([
   db.userPreference.findUnique({where:{userId:user.id}}),
   db.authSession.findMany({where:{userId:user.id,revokedAt:null,expiresAt:{gt:new Date()}},take:30,
    orderBy:{createdAt:"desc"},select:{id:true,createdAt:true,expiresAt:true}}),
   org&&membership?.status==="active"?
    db.deletionRequest.findFirst({where:{userId:user.id,organizationId:org.id},
     orderBy:{createdAt:"desc"},select:{id:true,status:true,createdAt:true}}):Promise.resolve(null)
  ]);
  return ok({profile:{firstName:user.firstName,lastName:user.lastName,email:user.email,role:user.role,verified:!!user.verifiedAt},
   preferences:{newsletterOptIn:preferences?.newsletterOptIn||false,eventEmailOptIn:preferences?.eventEmailOptIn||false,quietHoursEnabled:preferences?.quietHoursEnabled||false,
    deprecated:true,effectiveForDelivery:false},
   sessions,deletion});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireActor(req);
  const values=update.parse(await jsonBody(req));
  if(values.newsletterOptIn!==undefined||values.eventEmailOptIn!==undefined||values.quietHoursEnabled!==undefined)
   throw new HttpError(409,"ORG_PREFERENCES_REQUIRED",
    "Legacy account-wide email switches do not constitute mosque-specific consent. Use /api/v1/me/preferences.");
  const {firstName,lastName}=values;
  await db.$transaction(async tx=>{
   if(firstName!==undefined||lastName!==undefined)
    await tx.user.update({where:{id:user.id},data:{...(firstName!==undefined?{firstName}:{}),...(lastName!==undefined?{lastName}:{})}});
  // Do not write misleading account-global email opt-ins. The new
  // organization-scoped delivery preference endpoint is authoritative.
   await tx.auditEvent.create({data:{actorId:user.id,action:"account.profile.update",entity:"User",entityId:user.id}});
  });
  return ok({saved:true});
 });
}

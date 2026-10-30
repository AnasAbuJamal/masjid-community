import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {notifyUser} from "@/lib/notifications";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const capability=z.enum(["worship_publish","facilities_manage","volunteers_manage","community_moderate","care_manage"]);
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("role"),userId:z.string().min(8),role:z.enum(["member","staff","teacher","finance"])}),
 z.object({kind:z.literal("grant"),userId:z.string().min(8),capability,expiresAt:z.iso.datetime().optional()}),
 z.object({kind:z.literal("revoke"),userId:z.string().min(8),capability}),
 z.object({kind:z.literal("membership"),userId:z.string().min(8),status:z.enum(["active","suspended"])})
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","No organization.");
  const memberships=await db.organizationMembership.findMany({where:{organizationId:org.id},take:250,
   orderBy:{joinedAt:"desc"},select:{id:true,status:true,joinedAt:true,
    user:{select:{id:true,email:true,firstName:true,lastName:true,role:true,status:true,verifiedAt:true,mfaEnabledAt:true}},
    grants:{select:{id:true,capability:true,expiresAt:true,revokedAt:true}}}});
  return ok({organization:{id:org.id,name:org.name},memberships,policy:"Only an MFA-verified administrator may manage roles. This interface never grants the administrator role."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=command.parse(await jsonBody(req));
  if(admin.id===input.userId)throw new HttpError(403,"SELF_CHANGE_DENIED","An administrator cannot modify their own authority through this portal.");
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is unavailable.");
  const membership=await db.organizationMembership.findUnique({where:{organizationId_userId:{organizationId:org.id,userId:input.userId}},
   include:{user:true}});
  if(!membership||membership.user.status!=="active"||membership.user.role==="admin")
   throw new HttpError(404,"NOT_FOUND","This member cannot be managed through this portal.");
  if(input.kind==="membership"){
   const result=await db.$transaction(async tx=>{
    const updated=await tx.organizationMembership.update({where:{id:membership.id},data:{status:input.status}});
    if(input.status==="suspended")await tx.authSession.updateMany({where:{userId:membership.userId,revokedAt:null},data:{revokedAt:new Date()}});
    await tx.auditEvent.create({data:{actorId:admin.id,action:"team.membership."+input.status,entity:"OrganizationMembership",entityId:updated.id}});
    return updated;
   });
   return ok({id:result.id,status:result.status});
  }
  if(membership.status!=="active")throw new HttpError(403,"MEMBERSHIP_SUSPENDED","Restore this membership before changing its role.");
  if(!membership.user.verifiedAt)throw new HttpError(403,"ACCOUNT_UNVERIFIED","Verify the member's email before assigning privileges.");
  if(input.kind==="role"){
   // The one-time, email-bound acceptance path is required for first
   // promotion to staff. Legacy role editing cannot bypass consent/MFA.
   if(input.role==="staff"&&membership.user.role!=="staff")
    throw new HttpError(409,"INVITATION_REQUIRED",
     "New staff authority requires a verified, accepted, one-time invitation.");
   await db.$transaction(async tx=>{
    await tx.user.update({where:{id:input.userId},data:{role:input.role}});
    await tx.authSession.updateMany({where:{userId:input.userId,revokedAt:null},data:{revokedAt:new Date()}});
    if(input.role!=="staff")await tx.roleGrant.updateMany({where:{membershipId:membership.id,revokedAt:null},data:{revokedAt:new Date()}});
    await tx.auditEvent.create({data:{actorId:admin.id,action:"team.role."+input.role,entity:"User",entityId:input.userId}});
    await notifyUser(tx,input.userId,"Your community access was updated","Please sign in again to review your updated community permissions.");
   });
   return ok({id:input.userId,role:input.role,sessionRevoked:true});
  }
  if(membership.user.role!=="staff")throw new HttpError(403,"STAFF_REQUIRED","Capability grants require a verified staff account.");
  if(input.kind==="revoke"){
   const count=await db.$transaction(async tx=>{
    const changed=await tx.roleGrant.updateMany({where:{membershipId:membership.id,capability:input.capability,revokedAt:null},data:{revokedAt:new Date()}});
    if(!changed.count)throw new HttpError(404,"GRANT_NOT_FOUND","No active grant for this capability.");
    await tx.authSession.updateMany({where:{userId:input.userId,revokedAt:null},data:{revokedAt:new Date()}});
    await tx.auditEvent.create({data:{actorId:admin.id,action:"team.capability.revoke."+input.capability,entity:"OrganizationMembership",entityId:membership.id}});
    return changed.count;
   });
   return ok({id:input.userId,capability:input.capability,revoked:true});
  }
  const expiresAt=input.expiresAt?new Date(input.expiresAt):null;
  if(expiresAt&&expiresAt<=new Date())throw new HttpError(422,"GRANT_EXPIRY","Capability expiry must be in the future.");
  if(input.capability==="care_manage"){
   if(!membership.user.mfaEnabledAt)throw new HttpError(403,"CARE_MFA_REQUIRED",
    "A care coordinator must enroll an authenticator before permission can be granted.");
   if(!expiresAt||expiresAt>new Date(Date.now()+30*86400000))
    throw new HttpError(422,"CARE_GRANT_EXPIRY",
     "Confidential care access must be time limited to at most 30 days.");
  }
  const grant=await db.$transaction(async tx=>{
   const saved=await tx.roleGrant.upsert({where:{membershipId_capability:{membershipId:membership.id,capability:input.capability}},
    update:{grantedById:admin.id,grantedAt:new Date(),expiresAt,revokedAt:null},
    create:{membershipId:membership.id,capability:input.capability,grantedById:admin.id,expiresAt}});
   await tx.authSession.updateMany({where:{userId:input.userId,revokedAt:null},data:{revokedAt:new Date()}});
   await tx.auditEvent.create({data:{actorId:admin.id,action:"team.capability.grant."+input.capability,entity:"RoleGrant",entityId:saved.id}});
   return saved;
  });
  return ok({id:grant.id,capability:grant.capability,expiresAt:grant.expiresAt,sessionRevoked:true});
 });
}

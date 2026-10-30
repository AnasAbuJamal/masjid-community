import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {inviteCiCaptureEnabled,inviteEmailConfigured,makeStaffInvitationToken,sendStaffInvite} from "@/lib/staff-invitations";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

// Confidential-care permission is deliberately excluded; its own MFA,
// safeguarding and maximum-30-day review process is required.
const grant=z.enum(["worship_publish","facilities_manage","volunteers_manage","community_moderate"]);
const issue=z.object({action:z.literal("issue"),email:z.email().max(254),
 capabilities:z.array(grant).min(1).max(4).refine(v=>new Set(v).size===v.length,
  "Each capability may appear only once"),expiresHours:z.number().int().min(1).max(72)});
const revoke=z.object({action:z.literal("revoke"),id:z.string().min(8)});
const command=z.discriminatedUnion("action",[issue,revoke]);

export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const items=await db.staffInvitation.findMany({where:{organizationId:org.id},
   orderBy:{createdAt:"desc"},take:100,
   select:{id:true,invitedEmail:true,capabilities:true,createdAt:true,expiresAt:true,
    acceptedAt:true,revokedAt:true}});
  return ok({organization:{name:org.name},items,deliveryConfigured:inviteEmailConfigured(),
   policy:"Invitations are email-bound, one-use, and never grant access before the invitee verifies their identity and authenticator."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const values=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(values.action==="revoke"){
   const updated=await db.$transaction(async tx=>{
    const changed=await tx.staffInvitation.updateMany({where:{
     id:values.id,organizationId:org.id,acceptedAt:null,revokedAt:null
    },data:{revokedAt:new Date()}});
    if(!changed.count)throw new HttpError(404,"INVITATION_UNAVAILABLE","A pending invitation was not found.");
    await tx.auditEvent.create({data:{actorId:admin.id,action:"staff.invitation.revoke",
     entity:"StaffInvitation",entityId:values.id,
     detail:JSON.stringify({organizationId:org.id})}});
    return changed.count;
   });
   return ok({revoked:updated===1});
  }
  const capture=inviteCiCaptureEnabled();
  if(!capture&&!inviteEmailConfigured())throw new HttpError(503,"INVITE_DELIVERY_UNAVAILABLE",
   "Staff invitations require a configured, verified email delivery service.");
  const email=values.email.trim().toLowerCase();
  const member=await db.user.findUnique({where:{email},select:{
   id:true,role:true,status:true,memberships:{where:{status:"active"},select:{organizationId:true}}
  }});
  if(member&&(member.status!=="active"||member.role!=="member"||
   member.memberships.some(m=>m.organizationId!==org.id)))
   throw new HttpError(409,"INVITATION_ELIGIBILITY",
    "This role transition requires individual review; multi-organization accounts are not supported by this pilot.");
  const {token,hash}=makeStaffInvitationToken();
  const expiresAt=new Date(Date.now()+values.expiresHours*3600000);
  try{
   const item=await db.$transaction(async tx=>{
    // Reissue revokes any older unaccepted link, including links still in
    // flight. No previous invitation can later be accepted accidentally.
    await tx.staffInvitation.updateMany({where:{
     organizationId:org.id,invitedEmail:email,acceptedAt:null,revokedAt:null
    },data:{revokedAt:new Date()}});
    const created=await tx.staffInvitation.create({data:{
     organizationId:org.id,invitedEmail:email,tokenHash:hash,
     capabilities:values.capabilities,issuedById:admin.id,expiresAt
    }});
    await tx.auditEvent.create({data:{actorId:admin.id,action:"staff.invitation.issue",
     entity:"StaffInvitation",entityId:created.id,
     detail:JSON.stringify({organizationId:org.id,capabilities:values.capabilities,expiresAt})}});
    return created;
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   if(!capture){
    const delivered=await sendStaffInvite(email,org.name,token,expiresAt);
    if(!delivered){
     await db.staffInvitation.updateMany({where:{
      id:item.id,organizationId:org.id,acceptedAt:null,revokedAt:null
     },data:{revokedAt:new Date()}});
     throw new HttpError(503,"INVITE_DELIVERY_FAILED",
      "The invitation could not be delivered. Please verify the email provider before retrying.");
    }
   }
   return ok({id:item.id,expiresAt,delivery:capture?"synthetic-ci-capture":"email",
    ...(capture?{ciOnlyToken:token}:{})},201);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"INVITATION_CHANGED","Another invitation operation completed. Refresh and retry.");
   throw error;
  }
 });
}

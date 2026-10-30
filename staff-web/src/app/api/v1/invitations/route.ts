import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireActor,sessionFrom,tokenHash} from "@/lib/auth";
import {appendIntegrityAudit} from "@/lib/integrity-audit";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const command=z.discriminatedUnion("action",[
 z.object({action:z.literal("preview"),token:z.string().regex(/^[a-f0-9]{64}$/i)}),
 z.object({action:z.literal("accept"),token:z.string().regex(/^[a-f0-9]{64}$/i)})
]);
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireActor(req);
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const invite=await db.staffInvitation.findUnique({where:{tokenHash:tokenHash(input.token)},
   select:{id:true,organizationId:true,invitedEmail:true,capabilities:true,issuedById:true,
    expiresAt:true,acceptedAt:true,revokedAt:true}});
  if(!invite||invite.organizationId!==org.id||invite.revokedAt||invite.acceptedAt||
   invite.expiresAt<=new Date()||invite.invitedEmail!==user.email.trim().toLowerCase())
   throw new HttpError(404,"INVITATION_UNAVAILABLE",
    "This invitation is unavailable, expired or not issued to the signed-in identity.");
  // Accepting new privileges requires a fresh authenticator check, not a
  // potentially week-old session MFA claim.
  const freshMfa=!!user.mfaVerified&&!!await db.authSession.findFirst({where:{
   userId:user.id,tokenHash:tokenHash(sessionFrom(req)),revokedAt:null,
   expiresAt:{gt:new Date()},
   mfaVerifiedAt:{gt:new Date(Date.now()-10*60000)}
  },select:{id:true}});
  if(input.action==="preview")return ok({
   organization:{name:org.name},capabilities:invite.capabilities,
   role:"staff",expiresAt:invite.expiresAt,
   verified:!!user.verifiedAt,mfaEnabled:user.mfaEnabled,mfaVerified:freshMfa,
   policy:"No authority changes until you verify your email, enable your authenticator, and explicitly accept. This pilot does not support accounts active in multiple organizations."
  });
  if(!user.verifiedAt)throw new HttpError(403,"EMAIL_NOT_VERIFIED","Verify your email first.");
  if(!user.mfaEnabled||!freshMfa)throw new HttpError(403,"INVITE_MFA_REQUIRED",
   "Enroll and freshly verify an authenticator within 10 minutes of accepting staff duties.");
  try{
   const result=await db.$transaction(async tx=>{
    const now=new Date();
    const current=await tx.staffInvitation.findFirst({where:{
     id:invite.id,organizationId:org.id,invitedEmail:user.email.trim().toLowerCase(),
     acceptedAt:null,revokedAt:null,expiresAt:{gt:now}
    },select:{id:true,issuedById:true,capabilities:true}});
    if(!current)throw new HttpError(409,"INVITATION_CHANGED",
     "Invitation was already accepted, expired, or revoked.");
    const issuer=await tx.user.findFirst({where:{
     id:current.issuedById,status:"active",role:"admin",verifiedAt:{not:null},
     memberships:{some:{organizationId:org.id,status:"active"}}
    },select:{id:true}});
    if(!issuer)throw new HttpError(409,"ISSUER_UNAVAILABLE",
     "The inviting steward is no longer authorized; a new invitation is required.");
    const currentAccount=await tx.user.findFirst({where:{
     id:user.id,role:"member",status:"active",verifiedAt:{not:null},mfaEnabledAt:{not:null}
    },select:{id:true}});
    if(!currentAccount)throw new HttpError(409,"ROLE_CHANGED",
     "Your current role cannot accept this staff invitation.");
    const other=await tx.organizationMembership.count({where:{
     userId:user.id,status:"active",organizationId:{not:org.id}
    }});
    if(other)throw new HttpError(409,"MULTI_ORG_REVIEW",
     "A separate identity and tenant policy review is needed before a multi-mosque account may accept staff authority.");
    const existing=await tx.organizationMembership.findUnique({where:{
     organizationId_userId:{organizationId:org.id,userId:user.id}
    },select:{id:true,status:true}});
    if(existing?.status!=="active"&&existing)
     throw new HttpError(409,"MEMBERSHIP_INACTIVE",
      "An existing suspended or left membership requires independent steward review.");
    const assigned=existing||await tx.organizationMembership.create({data:{
     organizationId:org.id,userId:user.id
    },select:{id:true,status:true}});
    const claimed=await tx.staffInvitation.updateMany({where:{
     id:invite.id,organizationId:org.id,acceptedAt:null,revokedAt:null,expiresAt:{gt:now}
    },data:{acceptedAt:now,acceptedUserId:user.id}});
    if(!claimed.count)throw new HttpError(409,"INVITATION_CHANGED","Invitation is no longer available.");
    const promoted=await tx.user.updateMany({where:{
     id:user.id,role:"member",status:"active",verifiedAt:{not:null},mfaEnabledAt:{not:null}
    },data:{role:"staff"}});
    if(!promoted.count)throw new HttpError(409,"ROLE_CHANGED","Your account permissions changed. Contact the steward.");
    // Invited authority is scoped to this one membership and expires after
    // 14 days; a steward must review renewals. Care grants are never invited.
    const grantExpiresAt=new Date(now.getTime()+14*86400000);
    for(const capability of current.capabilities){
     if(capability==="care_manage")throw new HttpError(409,"INVITATION_UNSAFE",
      "Confidential-case grants require a separate safeguarding approval.");
     await tx.roleGrant.upsert({where:{
      membershipId_capability:{membershipId:assigned.id,capability}
     },create:{membershipId:assigned.id,capability,grantedById:issuer.id,
      expiresAt:grantExpiresAt},
     update:{grantedById:issuer.id,grantedAt:now,revokedAt:null,expiresAt:grantExpiresAt}});
    }
    await tx.authSession.updateMany({where:{userId:user.id,revokedAt:null},
     data:{revokedAt:now}});
    await tx.auditEvent.create({data:{
     actorId:user.id,action:"staff.invitation.accept",entity:"StaffInvitation",entityId:invite.id,
     detail:JSON.stringify({organizationId:org.id,issuedById:issuer.id,
      capabilities:current.capabilities,grantExpiresAt})
    }});
    await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
     action:"staff.invitation.accept",entity:"StaffInvitation",entityId:invite.id,
     evidence:{from:"member",to:"staff",scope:"organization",
      expiresAt:grantExpiresAt.toISOString(),sessionRevoked:true}});
    return {organization:org.name,role:"staff",capabilities:current.capabilities,
     grantExpiresAt,sessionRevoked:true};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"INVITATION_CHANGED",
     "Another invitation acceptance completed. Sign in again to check your permissions.");
   throw error;
  }
 });
}

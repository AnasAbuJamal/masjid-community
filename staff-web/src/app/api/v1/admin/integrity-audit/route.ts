import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";
import {verifyIntegrityAudit} from "@/lib/integrity-audit";

export async function GET(req:NextRequest){
 return handled(async()=>{
  // The pilot administrator can review its chain. Independently delegated
  // staff reviewers need an active home-mosque grant and a verified MFA
  // session. No account-global role or foreign tenant header grants access.
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},
   select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(user.role!=="admin"){
   if(user.role!=="staff")throw new HttpError(403,"AUDIT_REVIEW_REQUIRED",
    "Protected audit review requires a separately delegated reviewer capability.");
   if(!user.mfaEnabled||!user.mfaVerified)throw new HttpError(403,"AUDITOR_MFA_REQUIRED",
    "An enrolled and verified authenticator is required for protected audit review.");
   const grant=await db.roleGrant.findFirst({where:{
    capability:"audit_review",revokedAt:null,
    membership:{organizationId:org.id,userId:user.id,status:"active"},
    expiresAt:{gt:new Date()}
   },select:{id:true}});
   if(!grant)throw new HttpError(403,"AUDIT_REVIEW_REQUIRED",
    "Protected audit review requires a current time-limited mosque grant.");
  }
  const result=await verifyIntegrityAudit(org.id);
  const recent=await db.integrityAuditEvent.findMany({where:{organizationId:org.id},
   orderBy:{sequence:"desc"},take:70,select:{
    sequence:true,occurredAt:true,requestId:true,action:true,entity:true,
    outcome:true,previousHash:true,recordHash:true,
    actorId:true
   }});
  // No full actor identity, target ID, changed email, school/case/finance
  // payload or private diff is returned to a general administration screen.
  // The truncated pseudonym cannot be used for authorization.
  return ok({organization:{name:org.name},verification:result,
   records:recent.map(row=>({
    sequence:row.sequence,occurredAt:row.occurredAt,requestId:row.requestId,
    action:row.action,entity:row.entity,outcome:row.outcome,
    actorHint:row.actorId.slice(-6),hashPrefix:row.recordHash.slice(0,12)
   })),
   policy:"New protected actions only. Existing legacy audit events are unsealed. Verification covers up to 10,000 events for this mosque and requires its independent HMAC key. This is application-level tamper evidence, not external anchor or DBA-proof certification."});
 });
}

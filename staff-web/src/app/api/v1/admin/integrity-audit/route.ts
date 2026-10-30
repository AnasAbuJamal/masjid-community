import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";
import {verifyIntegrityAudit} from "@/lib/integrity-audit";

export async function GET(req:NextRequest){
 return handled(async()=>{
  // Pilot is administrator+MFA only. A dedicated scoped auditor capability,
  // multi-organization switch and independent head storage are still missing.
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},
   select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
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

import {NextRequest} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {handled,HttpError,ok} from "@/lib/http";

// Dedicated read-only operations credential, distinct from the cron worker
// and from all member/staff sessions. No dashboard/UI or public detail route.
function authorized(req:NextRequest){
 const secret=process.env.SILA_OPERATIONS_SECRET;
 if(!secret||secret.length<32||secret===process.env.CRON_SECRET||secret===process.env.AUTH_SECRET)throw new HttpError(503,"OPS_NOT_CONFIGURED",
  "Operational checks are not configured.");
 const supplied=Buffer.from(req.headers.get("authorization")||"","utf8");
 const expected=Buffer.from("Bearer "+secret,"utf8");
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))
  throw new HttpError(401,"UNAUTHORIZED","Operational authorization required.");
}

export async function GET(req:NextRequest){
 return handled(async()=>{
  authorized(req);
  const now=new Date(),overdueAt=new Date(now.getTime()-15*60_000);
  const [pending,retry,leased,exhausted,overdue,expiredLeases,
   oldestDue,failedPayouts,pendingRefunds,privacyReviews]=await Promise.all([
    db.outboxEvent.count({where:{status:"pending"}}),
    db.outboxEvent.count({where:{status:"retry"}}),
    db.outboxEvent.count({where:{status:"leased"}}),
    db.outboxEvent.count({where:{status:"exhausted"}}),
    db.outboxEvent.count({where:{
     status:{in:["pending","retry"]},availableAt:{lt:overdueAt}
    }}),
    db.outboxEvent.count({where:{status:"leased",leaseUntil:{lt:now}}}),
    db.outboxEvent.findFirst({where:{
     status:{in:["pending","retry"]},availableAt:{lte:now}
    },orderBy:{availableAt:"asc"},select:{availableAt:true}}),
    db.providerPayout.count({where:{state:"failed"}}),
    db.refundRequest.count({where:{status:{in:["submitting","provider_pending","failed"]}}}),
    db.deletionRequest.count({where:{status:{in:["pending","in_review"]}}})
  ]);
  const oldestDueMinutes=oldestDue?
   Math.max(0,Math.floor((now.getTime()-oldestDue.availableAt.getTime())/60_000)):null;
  const attention=overdue>0||expiredLeases>0||exhausted>0||
   failedPayouts>0||pendingRefunds>0;
  // Aggregate counts only. Deliberately no organization names, user IDs,
  // message text, child records, money amounts, case details, URLs or secrets.
  // "attention" is a visibility signal, NOT a measured SLA or proof that a
  // real provider delivered a message or bank reconciled a payout.
  return ok({
   checkedAt:now.toISOString(),state:attention?"attention":"observed",
   outbox:{pending,retry,leased,exhausted,overdue15m:overdue,
    expiredLeases,oldestDueMinutes},
   finance:{providerReportedFailedPayouts:failedPayouts,
    unresolvedRefundWorkflows:pendingRefunds,reconciliationCertified:false},
   privacy:{requestsAwaitingReview:privacyReviews},
   policy:"Operational counts are for authorized responders only; thresholds are preliminary and do not establish an RPO, RTO or SLA."
  });
 });
}

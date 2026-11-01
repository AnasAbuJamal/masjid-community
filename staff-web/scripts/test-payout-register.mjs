// Signed provider payout reports, stale webhook protection, exception-only
// review and multi-organization refusal. Synthetic disposable CI DB only.
import assert from "node:assert/strict";
import {randomBytes,createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import Stripe from "stripe";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("/masjid_ci"))
 throw Error("Signed payout tests require disposable masjid_ci PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||"sk_test_ci_synthetic_no_network");
const secret=process.env.STRIPE_WEBHOOK_SECRET||"";
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,cache:r.headers.get("cache-control"),...await r.json().catch(()=>({}))};
}
const eventIds=[];let eventCounter=0;
async function webhook(type,payout,created){
 const id="evt_ci_payout_"+randomBytes(9).toString("hex")+(++eventCounter);
 eventIds.push(id);
 const payload=JSON.stringify({
  id,created,type,object:"event",data:{object:payout}
 });
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret});
 const r=await fetch(base+"webhooks/stripe",{
  method:"POST",headers:{"Content-Type":"application/json","stripe-signature":signature},
  body:payload
 });
 return {status:r.status,...await r.json().catch(()=>({})),payload,signature};
}
let adminSession=null,foreignOrg=null,payoutId=null;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(memberLogin.status,200);
 const memberToken=memberLogin.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 assert.equal((await request("admin/payouts")).status,401);
 assert.equal((await request("admin/payouts","GET",undefined,memberToken)).status,403);
 const before=await request("admin/payouts","GET",undefined,adminToken);
 assert.equal(before.status,200);
 assert.equal(before.data.reconciliationReady,false);
 assert.match(before.data.warning,/NOT reconciliation/);
 const id="po_ci_"+randomUUID().replaceAll("-","");
 const now=Math.floor(Date.now()/1000);
 const basePayout={object:"payout",id,amount:2785,currency:"usd",
  arrival_date:now+86400,status:"pending",failure_code:null};
 const invalid=await webhook("payout.paid",{...basePayout,status:"pending"},now-50);
 assert.equal(invalid.status,409,"signed but inconsistent payout state denied");
 assert.equal(invalid.error.code,"PAYOUT_EVENT_MISMATCH");
 assert.equal(await db.providerPayout.count({where:{providerPayoutId:id}}),0);
 const pending=await webhook("payout.created",basePayout,now-40);
 assert.equal(pending.status,200,JSON.stringify(pending));
 const exactReplay=await fetch(base+"webhooks/stripe",{
  method:"POST",headers:{"Content-Type":"application/json","stripe-signature":pending.signature},
  body:pending.payload
 });
 assert.equal(exactReplay.status,200,"exact signed webhook replay is idempotent");
 payoutId=(await db.providerPayout.findUniqueOrThrow({
  where:{providerPayoutId:id}
 })).id;
 const firstState=await db.providerPayout.findUniqueOrThrow({where:{id:payoutId}});
 assert.equal(firstState.organizationId,org.id);
 assert.equal(firstState.state,"pending");
 assert.equal(firstState.amountMinor,2785);
 const paid=await webhook("payout.paid",{...basePayout,status:"paid"},now-30);
 assert.equal(paid.status,200);
 const posted=await db.providerPayout.findUniqueOrThrow({where:{id:payoutId}});
 assert.equal(posted.state,"paid");
 const stale=await webhook("payout.created",basePayout,now-80);
 assert.equal(stale.status,200,"delayed provider creation event handled without state rollback");
 assert.equal((await db.providerPayout.findUniqueOrThrow({where:{id:payoutId}})).state,"paid");
 const mismatch=await webhook("payout.paid",{...basePayout,status:"paid",amount:9999},now-20);
 assert.equal(mismatch.status,409,"same payout ID cannot have new amount");
 assert.equal(mismatch.error.code,"PAYOUT_AMOUNT_MISMATCH");
 assert.equal((await db.providerPayout.findUniqueOrThrow({where:{id:payoutId}})).amountMinor,2785);
 const failed=await webhook("payout.failed",{...basePayout,status:"failed",failure_code:"account_closed"},now-10);
 assert.equal(failed.status,200,"bank return after provider paid event remains visible");
 const returned=await db.providerPayout.findUniqueOrThrow({where:{id:payoutId}});
 assert.equal(returned.state,"failed");
 assert.equal(returned.failureCode,"account_closed");
 const forbiddenRollback=await webhook("payout.paid",{...basePayout,status:"paid"},now+10);
 assert.equal(forbiddenRollback.status,409,"failed/canceled terminal payout cannot silently become paid");
 assert.equal(forbiddenRollback.error.code,"PAYOUT_TERMINAL_CONFLICT");
 assert.equal((await db.providerPayout.findUniqueOrThrow({where:{id:payoutId}})).state,"failed");
 const queue=await request("admin/payouts","GET",undefined,adminToken);
 assert.equal(queue.status,200);
 assert.equal(queue.cache,"no-store");
 assert.equal(queue.data.reconciliationReady,false);
 const one=queue.data.payouts.find(p=>p.id===payoutId);
 assert.ok(one);
 assert.equal(one.state,"failed");
 assert.equal(one.amountMinor,2785);
 assert.ok(!Object.hasOwn(one,"reconciledAt"),"no fabricated reconciliation evidence");
 assert.ok(!JSON.stringify(queue.data).includes("grossMinor"),"unknown gross cannot be manufactured");
 assert.ok(!JSON.stringify(queue.data).includes("feeMinor"),"unknown fees cannot be manufactured");
 const noMember=await request("admin/payouts","POST",{
  payoutId,reasonCode:"bank_credit_unverified"
 },memberToken);
 assert.equal(noMember.status,403);
 const noGuess=await request("admin/payouts","POST",{
  payoutId:"unrelated_private_payout",reasonCode:"bank_credit_unverified"
 },adminToken);
 assert.equal(noGuess.status,404);
 // New free-text notes are forbidden: financial/bank/donor details must not
 // accidentally enter a long-lived review record or searchable audit.
 const oldFreeText=await request("admin/payouts","POST",{
  payoutId,body:"Sensitive donor and bank details should never be stored."
 },adminToken);
 assert.equal(oldFreeText.status,422);
 const unknown=await request("admin/payouts","POST",{
  payoutId,reasonCode:"made_up_bank_confirmation"
 },adminToken);
 assert.equal(unknown.status,422);
 const extra=await request("admin/payouts","POST",{
  payoutId,reasonCode:"bank_credit_unverified",bankAccount:"do_not_store"
 },adminToken);
 assert.equal(extra.status,422,"unknown PII-bearing fields are rejected");
 const reasonCode="bank_credit_unverified";
 const noteBody="Unresolved exception: Actual bank credit is not independently verified. This note does not certify payout settlement.";
 const record=await request("admin/payouts","POST",{payoutId,reasonCode},adminToken);
 assert.equal(record.status,201);
 assert.equal(record.data.reasonCode,reasonCode);
 assert.equal(record.data.settlementCertified,false);
 assert.match(record.data.message,/unreconciled/);
 assert.equal((await request("admin/payouts","POST",{payoutId,reasonCode},adminToken)).status,409,
  "replaying the same category cannot create duplicate audit/exception records");
 const different=await request("admin/payouts","POST",{
  payoutId,reasonCode:"provider_transfer_failed"
 },adminToken);
 assert.equal(different.status,201,"independent evidence gaps can be classified separately");
 const audit=await db.auditEvent.findMany({where:{
  entity:"ProviderPayout",entityId:payoutId,action:"finance.payout.note"
 }});
 assert.equal(audit.length,2);
 assert.ok(audit.every(x=>!x.detail.includes(noteBody)),
  "audit records contain only fixed category IDs, never note text");
 assert.ok(audit.some(x=>JSON.parse(x.detail).reasonCode===reasonCode));
 assert.ok(audit.every(x=>JSON.parse(x.detail).settlementCertified===false));
 const noted=await request("admin/payouts","GET",undefined,adminToken);
 const returnedNotes=noted.data.payouts.find(p=>p.id===payoutId).notes;
 assert.equal(returnedNotes.length,2);
 assert.ok(returnedNotes.some(n=>n.body===noteBody));
 assert.ok(returnedNotes.every(n=>n.body.includes("does not certify payout settlement.")));
 assert.equal(noted.data.payouts.find(p=>p.id===payoutId).notesComplete,true);
 assert.equal(noted.data.notesPageSize,10);
 assert.equal(noted.data.reconciliationReady,false);
 // Two simultaneous reviewers cannot create duplicate evidence under
 // Serializable isolation; one wins, one must get a conflict to refresh.
 const parallel=await Promise.all([
  request("admin/payouts","POST",{payoutId,reasonCode:"clearing_ledger_unmatched"},adminToken),
  request("admin/payouts","POST",{payoutId,reasonCode:"clearing_ledger_unmatched"},adminToken)
 ]);
 assert.deepEqual(parallel.map(p=>p.status).sort(),[201,409],
  "concurrent duplicate evidence must have exactly one winner");
 const confirmedCount=await db.payoutReviewNote.count({where:{
  payoutId,body:{startsWith:"Unresolved exception: Accounting clearing"}
 }});
 assert.equal(confirmedCount,1);
 const auditAfter=await db.auditEvent.findMany({where:{
  entity:"ProviderPayout",entityId:payoutId,action:"finance.payout.note"
 }});
 assert.equal(auditAfter.length,3,"concurrent losing request creates no audit");
 assert.ok(auditAfter.every(a=>JSON.parse(a.detail).settlementCertified===false));
 // Simulate a legacy payout with deeper historical notes. The staff
 // response must disclose that the view is truncated, not claim completeness.
 await db.payoutReviewNote.createMany({data:Array.from({length:11},(_,i)=>({
  payoutId,authorId:admin.id,
  body:"Legacy CI historical investigation, non-personal marker "+String(i+1)
 }))});
 const history=await request("admin/payouts","GET",undefined,adminToken);
 const historyPayout=history.data.payouts.find(p=>p.id===payoutId);
 assert.equal(history.status,200);
 assert.equal(history.data.notesPageSize,10);
 assert.equal(historyPayout.notes.length,10);
 assert.equal(historyPayout.notesComplete,false,
  "finance reviewer must be told historical records are omitted");
 assert.ok(historyPayout.notes.every(n=>!n.body.includes("Sensitive donor")),
  "synthetic history contains no personal data");
 const foreign=await db.organization.create({data:{
  slug:"payout-isolation-"+randomUUID(),name:"Another private mosque"
 }});
 foreignOrg=foreign.id;
 const blocked=await webhook("payout.paid",{
  ...basePayout,id:"po_ci_foreign_"+randomUUID().replaceAll("-",""),status:"paid"
 },now+15);
 assert.equal(blocked.status,409,
  "global Stripe key cannot silently assign payouts to the first organization after tenant expansion");
 assert.equal(blocked.error.code,"PAYOUT_TENANT_UNCONFIGURED");
 assert.equal(await db.providerPayout.count({where:{organizationId:foreignOrg}}),0);
 assert.equal(await db.providerPayout.count({where:{organizationId:org.id}}),1);
 console.log("Verified signed payout states, immutable amount, stale/failed event safety, private notes and multi-mosque fail-closed scope.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 if(payoutId){
  await db.payoutReviewNote.deleteMany({where:{payoutId}});
  await db.auditEvent.deleteMany({where:{
   entity:"ProviderPayout",entityId:payoutId
  }});
  await db.providerPayout.deleteMany({where:{id:payoutId}});
 }
 if(eventIds.length)await db.paymentEvent.deleteMany({where:{providerEventId:{in:eventIds}}});
 if(foreignOrg)await db.organization.deleteMany({where:{id:foreignOrg}});
 await db.$disconnect();
}

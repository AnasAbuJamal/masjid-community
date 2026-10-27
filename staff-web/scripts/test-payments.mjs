// Exercises real signed webhook, replay and ledger paths against disposable CI Postgres; NO provider network calls.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import Stripe from "stripe";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||!process.env.DATABASE_URL?.includes("masjid_ci"))throw Error("Refusing live payment test.");
const db=new PrismaClient();
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||"sk_test_ci_synthetic_no_network");
const secret=process.env.STRIPE_WEBHOOK_SECRET||"";
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const base="http://127.0.0.1:3000/api/v1/";
let counter=0;
async function webhook(type,object){
 const id="evt_ci_"+(++counter);
 const payload=JSON.stringify({id,type,object:"event",data:{object}});
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret});
 const res=await fetch(base+"webhooks/stripe",{method:"POST",headers:{"Content-Type":"application/json","stripe-signature":signature},body:payload});
 const json=await res.json();
 return {status:res.status,value:json,id,payload,signature};
}
async function signedPayload(payload,signature){
 const res=await fetch(base+"webhooks/stripe",{method:"POST",headers:{"Content-Type":"application/json","stripe-signature":signature},body:payload});
 return {status:res.status,value:await res.json()};
}
async function assertionJournal(sourceType,sourceId,amount){
 const entry=await db.journalEntry.findUniqueOrThrow({where:{sourceType_sourceId:{sourceType,sourceId}},include:{lines:true}});
 assert.equal(entry.lines.length,2);
 assert.equal(entry.lines.reduce((s,x)=>s+x.debitMinor,0),amount);
 assert.equal(entry.lines.reduce((s,x)=>s+x.creditMinor,0),amount);
}
try{
 const user=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const org=await db.organization.findFirstOrThrow();
 const campaign=await db.donationCampaign.create({data:{organizationId:org.id,title:"CI community giving",purpose:"Signed payment test",published:true}});
 const donation=await db.donation.create({data:{campaignId:campaign.id,donorId:user.id,amountMinor:3175,stripeSessionId:"cs_test_ci_donation_1"}});
 const wrong=await signedPayload(JSON.stringify({id:"evt_bad",type:"charge.refunded",data:{object:{}}}),"not_valid");
 assert.equal(wrong.status,400,"unsigned/untrusted provider callbacks rejected");
 const mismatch=await webhook("checkout.session.completed",{id:"cs_test_ci_donation_1",payment_status:"paid",amount_total:9999,
   currency:"usd",payment_intent:"pi_ci_donation_1",metadata:{donationId:donation.id}});
 assert.equal(mismatch.status,409,"mismatched amount must never be posted");
 assert.equal((await db.donation.findUniqueOrThrow({where:{id:donation.id}})).status,"pending");
 const initial=await webhook("checkout.session.completed",{id:"cs_test_ci_donation_1",payment_status:"paid",amount_total:3175,
  currency:"usd",payment_intent:"pi_ci_donation_1",metadata:{donationId:donation.id}});
 assert.equal(initial.status,200,JSON.stringify(initial.value));
 assert.equal((await db.donation.findUniqueOrThrow({where:{id:donation.id}})).status,"paid");
 const receipt=await db.paymentReceipt.findUniqueOrThrow({where:{sourceType_sourceId:{sourceType:"donation",sourceId:donation.id}}});
 assert.equal(receipt.amountMinor,3175);
 await assertionJournal("donation_paid",donation.id,3175);
 assert.equal((await signedPayload(initial.payload,initial.signature)).status,200,"exact replay idempotent");
 const repeated=await webhook("checkout.session.async_payment_succeeded",{id:"cs_test_ci_donation_1",payment_status:"paid",
  amount_total:3175,currency:"usd",payment_intent:"pi_ci_donation_1",metadata:{donationId:donation.id}});
 assert.equal(repeated.status,200,"distinct signed success event must be idempotent");
 assert.equal(await db.paymentReceipt.count({where:{donationId:donation.id}}),1,"exactly one receipt");
 const login=await fetch(base+"auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:memberEmail,password})});
 const auth=(await login.json()).data;
 assert.equal(login.status,200);
 const own=await fetch(base+"receipts/"+receipt.id,{headers:{Authorization:"Bearer "+auth.token}});
 assert.equal(own.status,200,"owner can see paid receipt");
 const guest=await fetch(base+"receipts/"+receipt.id);
 assert.equal(guest.status,401,"guest cannot see donor identity");
 const partial=await webhook("charge.refunded",{id:"ch_test_ci_donation_1",payment_intent:"pi_ci_donation_1",amount:3175,amount_refunded:500});
 assert.equal(partial.status,200);
 assert.equal((await db.donation.findUniqueOrThrow({where:{id:donation.id}})).status,"paid","partial refunds cannot masquerade as full refunds");
 const admin=await db.user.findFirstOrThrow({where:{role:"admin"}});
 const requested=await db.refundRequest.create({data:{organizationId:org.id,sourceKind:"donation",sourceId:donation.id,
  amountMinor:3175,currency:"usd",reason:"CI tests provider-confirmed refund",requestedById:admin.id,status:"provider_pending"}});
 const unauthorized=await fetch(base+"admin/refunds",{headers:{Authorization:"Bearer "+auth.token}});
 assert.equal(unauthorized.status,403,"ordinary members cannot review refunds");
 const full=await webhook("charge.refunded",{id:"ch_test_ci_donation_1",payment_intent:"pi_ci_donation_1",amount:3175,amount_refunded:3175});
 assert.equal(full.status,200,JSON.stringify(full.value));
 assert.equal((await db.donation.findUniqueOrThrow({where:{id:donation.id}})).status,"refunded");
 assert.equal((await db.refundRequest.findUniqueOrThrow({where:{id:requested.id}})).status,"completed");
 await assertionJournal("donation_refund",donation.id,3175);
 assert.ok((await db.paymentReceipt.findUniqueOrThrow({where:{id:receipt.id}})).reversedAt);

 const invoice=await db.schoolInvoice.findFirstOrThrow();
 await db.schoolInvoice.update({where:{id:invoice.id},data:{stripeSessionId:"cs_test_ci_tuition_1"}});
 const tuition=await webhook("checkout.session.completed",{id:"cs_test_ci_tuition_1",payment_status:"paid",amount_total:invoice.amountMinor,
  currency:"usd",payment_intent:"pi_ci_tuition_1",metadata:{invoiceId:invoice.id}});
 assert.equal(tuition.status,200,JSON.stringify(tuition.value));
 assert.equal((await db.schoolInvoice.findUniqueOrThrow({where:{id:invoice.id}})).status,"paid");
 const schoolReceipt=await db.paymentReceipt.findUniqueOrThrow({where:{sourceType_sourceId:{sourceType:"tuition",sourceId:invoice.id}}});
 assert.equal(schoolReceipt.amountMinor,invoice.amountMinor);
 await assertionJournal("tuition_paid",invoice.id,invoice.amountMinor);
 const tuitionRefund=await webhook("charge.refunded",{id:"ch_test_ci_tuition_1",payment_intent:"pi_ci_tuition_1",amount:invoice.amountMinor,amount_refunded:invoice.amountMinor});
 assert.equal(tuitionRefund.status,200);
 assert.equal((await db.schoolInvoice.findUniqueOrThrow({where:{id:invoice.id}})).status,"refunded");
 await assertionJournal("tuition_refund",invoice.id,invoice.amountMinor);
 console.log("Verified Stripe signature, payment amount, webhook replay, private receipts, balanced payment/reversal journals and full refunds for tuition/donations.");
}catch(error){console.error(error);process.exitCode=1;}finally{await db.$disconnect();}

// Whole monthly-giving lifecycle, signed SYNTHETIC provider events, no network provider calls.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import Stripe from "stripe";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||process.env.GITHUB_ACTIONS!=="true"||
 process.env.DATABASE_URL!=="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci"||
 process.env.SILA_RECURRING_CI_CAPTURE!=="test-only"||process.env.STRIPE_SECRET_KEY!=="sk_test_ci_synthetic_no_network")
 throw Error("Recurring tests require exact isolated CI database and synthetic provider capture.");
const db=new PrismaClient(),stripe=new Stripe(process.env.STRIPE_SECRET_KEY),base="http://127.0.0.1:3000/api/v1/";
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const run=randomUUID().replaceAll("-","");let seq=0,token;
async function call(path,method="GET",body,bearer=token){
 const response=await fetch(base+path,{method,headers:{...(bearer?{Authorization:"Bearer "+bearer}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,cache:response.headers.get("cache-control"),...await response.json()};
}
async function signed(type,object,{id="evt_recurring_"+run+"_"+(++seq),created=1793630000+seq}={}){
 const payload=JSON.stringify({id,type,created,object:"event",data:{object}});
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
 const response=await fetch(base+"webhooks/stripe",{method:"POST",headers:{"stripe-signature":signature,"Content-Type":"application/json"},body:payload});
 return {status:response.status,id,...await response.json()};
}
let foreign=null;
try{
 const home=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const login=await call("auth/login","POST",{email:memberEmail,password},null);assert.equal(login.status,200);token=login.data.token;
 const other=await db.user.create({data:{email:"recurring-other-"+run+"@example.test",firstName:"Synthetic",lastName:"Other",
  passwordHash:member.passwordHash,verifiedAt:new Date(),memberships:{create:{organizationId:home.id}}}});
 const otherLogin=await call("auth/login","POST",{email:other.email,password},null);assert.equal(otherLogin.status,200);
 const campaign=await db.donationCampaign.create({data:{organizationId:home.id,title:"Synthetic monthly giving "+run,purpose:"CI only, no actual money",published:true}});
 const terms={campaignId:campaign.id,amountMinor:2500,anonymous:false,termsVersion:"monthly-usd-v1",confirm:true,requestKey:"recurring_intent_"+run};
 assert.equal((await call("donations/recurring","POST",terms,null)).status,401);
 assert.equal((await call("donations/recurring","POST",{...terms,confirm:false})).status,422);
 assert.equal((await call("donations/recurring","POST",{...terms,termsVersion:"unapproved"})).status,422);
 assert.equal((await call("donations/recurring","POST",{...terms,amountMinor:2500.5})).status,422);
 assert.equal((await call("donations/recurring","POST",{...terms,donorId:other.id})).status,422);
 const before=await call("donations/recurring");assert.equal(before.status,200);assert.equal(before.data.enabled,true);assert.equal(before.cache,"no-store");
 const start=await call("donations/recurring","POST",terms);assert.equal(start.status,201,JSON.stringify(start));
 const giftId=start.data.giftId;
 assert.equal(start.data.status,"pending");assert.ok(start.data.checkoutUrl.startsWith("https://checkout.stripe.com/"));
 const retried=await call("donations/recurring","POST",terms);assert.equal(retried.status,200);assert.equal(retried.data.giftId,giftId);
 assert.equal((await call("donations/recurring","POST",{...terms,amountMinor:2600})).status,409);
 assert.equal(await db.recurringGift.count({where:{donorId:member.id,requestKey:terms.requestKey}}),1);
 const consent=await db.recurringGift.findUniqueOrThrow({where:{id:giftId}});assert.equal(consent.termsVersion,terms.termsVersion);assert.ok(consent.consentedAt);
 assert.equal((await call("donations/recurring?giftId="+giftId,"GET",undefined,otherLogin.data.token)).status,404);
 assert.equal((await call("donations/recurring/"+giftId+"/cancel","POST",{confirm:true},otherLogin.data.token)).status,404);
 assert.equal((await call("donations/recurring/"+giftId+"/cancel","POST",{confirm:true})).status,409,"unverified checkout has no cancellable provider mandate yet");
 const subscriptionId="sub_ci_"+run,customerId="cus_ci_"+run;
 const subscription=(status="active")=>({id:subscriptionId,customer:customerId,status,metadata:{recurringGiftId:giftId},items:{has_more:false,data:[{quantity:1,price:{currency:"usd",unit_amount:2500,recurring:{interval:"month",interval_count:1}}}]}});
 const completion=await signed("checkout.session.completed",{id:consent.stripeSessionId,mode:"subscription",amount_total:2500,currency:"usd",payment_status:"paid",
  subscription:subscriptionId,customer:customerId,metadata:{recurringGiftId:giftId}});
 assert.equal(completion.status,200,JSON.stringify(completion));
 assert.equal(await db.recurringInstallment.count({where:{giftId}}),0,"checkout success alone is never a donation/receipt");
 const activated=await signed("customer.subscription.created",subscription());assert.equal(activated.status,200,JSON.stringify(activated));
 assert.equal((await db.recurringGift.findUniqueOrThrow({where:{id:giftId}})).status,"active");
 const wrongSubscription=await signed("customer.subscription.updated",{...subscription(),items:{has_more:false,data:[{quantity:1,price:{currency:"usd",unit_amount:9999,recurring:{interval:"month",interval_count:1}}}]}});
 assert.equal(wrongSubscription.status,409);
 const invoice=(n,{paid=true,amount=2500,customer=customerId,sub=subscriptionId}={})=>({id:"in_ci_"+run+"_"+n,customer,status:paid?"paid":"open",amount_paid:paid?amount:0,amount_due:amount,total:amount,currency:"usd",billing_reason:"subscription_cycle",
  parent:{type:"subscription_details",subscription_details:{subscription:sub,metadata:{recurringGiftId:giftId}}},
  ...(paid?{payments:{has_more:false,data:[{status:"paid",amount_paid:amount,currency:"usd",payment:{type:"payment_intent",payment_intent:"pi_ci_"+run+"_"+n}}]}}:{})});
 for(const bad of [invoice(1,{amount:9999}),invoice(1,{customer:"cus_ci_other"}),invoice(1,{sub:"sub_ci_other"})]){
  const rejected=await signed("invoice.payment_succeeded",bad);assert.equal(rejected.status,409,JSON.stringify(rejected));
  assert.equal(await db.paymentEvent.count({where:{providerEventId:rejected.id}}),0,"unverified event is rolled back for retry");
 }
 const noProof=invoice(1);delete noProof.payments;
 assert.equal((await signed("invoice.paid",noProof)).status,409,"out-of-band or absent actual payment cannot create receipt");
 const first=await signed("invoice.payment_succeeded",invoice(1));assert.equal(first.status,200,JSON.stringify(first));
 const initial=await db.recurringInstallment.findUniqueOrThrow({where:{invoiceId:invoice(1).id},include:{donation:{include:{receipt:true}}}});
 assert.equal(initial.donation.status,"paid");assert.ok(initial.donation.receipt);
 assert.equal((await signed("invoice.payment_succeeded",invoice(1),{id:first.id})).status,200,"exact event replay idempotent");
 assert.equal((await signed("invoice.paid",invoice(1))).status,200,"distinct paid event for same invoice idempotent");
 assert.equal(await db.paymentReceipt.count({where:{donationId:initial.donationId}}),1);
 const receipt=await call("receipts/"+initial.donation.receipt.id);assert.equal(receipt.status,200);assert.equal(receipt.data.organization.id,home.id);assert.equal(receipt.data.organization.timeZone,home.timeZone);
 assert.equal((await call("receipts/"+initial.donation.receipt.id,"GET",undefined,otherLogin.data.token)).status,404);
 const paidEntry=await db.journalEntry.findUniqueOrThrow({where:{sourceType_sourceId:{sourceType:"donation_paid",sourceId:initial.donationId}},include:{lines:true}});
 assert.equal(paidEntry.lines.reduce((n,line)=>n+line.debitMinor,0),2500);assert.equal(paidEntry.lines.reduce((n,line)=>n+line.creditMinor,0),2500);
 const noticesBefore=await db.notification.count({where:{userId:member.id,organizationId:home.id}});
 assert.equal((await signed("invoice.payment_failed",invoice(2,{paid:false}))).status,200);
 const failed=await db.recurringInstallment.findUniqueOrThrow({where:{invoiceId:invoice(2).id},include:{donation:{include:{receipt:true}}}});
 assert.equal(failed.donation.status,"failed");assert.equal(failed.donation.receipt,null);
 assert.equal(await db.notification.count({where:{userId:member.id,organizationId:home.id}}),noticesBefore+1,"first failed installment creates one private service notice/outbox");
 assert.equal((await signed("invoice.payment_failed",invoice(2,{paid:false}))).status,200);
 assert.equal(await db.notification.count({where:{userId:member.id,organizationId:home.id}}),noticesBefore+1,"distinct retry failure does not create duplicate notices");
 assert.equal((await signed("invoice.payment_succeeded",invoice(2))).status,200,"same invoice can recover after a failed attempt");
 assert.equal((await signed("invoice.payment_failed",invoice(2,{paid:false}))).status,200);
 assert.equal((await db.donation.findUniqueOrThrow({where:{id:failed.donationId}})).status,"paid","late failure cannot undo verified payment");
 // Existing maker/checker/full-refund accounting remains applicable per installment.
 assert.equal((await signed("charge.refunded",{id:"ch_ci_"+run,payment_intent:initial.donation.paymentIntentId,amount:2500,amount_refunded:2500})).status,200);
 assert.equal((await db.donation.findUniqueOrThrow({where:{id:initial.donationId}})).status,"refunded");
 assert.ok((await db.paymentReceipt.findUniqueOrThrow({where:{id:initial.donation.receipt.id}})).reversedAt);
 // More than one page of paid installments; no silent history truncation.
 for(let i=3;i<=23;i++)assert.equal((await signed("invoice.payment_succeeded",invoice(i))).status,200);
 const page=await call("donations/recurring?giftId="+giftId);assert.equal(page.status,200);assert.equal(page.data.installments.length,20);assert.ok(page.data.nextCursor);
 const next=await call("donations/recurring?giftId="+giftId+"&cursor="+page.data.nextCursor);assert.equal(next.status,200);assert.equal(next.data.installments.length,3);
 assert.equal(new Set([...page.data.installments,...next.data.installments].map(i=>i.invoiceId)).size,23);
 assert.equal(next.data.nextCursor,null);
 assert.equal((await call("donations/recurring?giftId="+giftId+"&cursor=not_owned_invoice")).status,404);
 assert.equal((await call("donations/recurring?giftId="+giftId+"&giftId="+giftId)).status,422);
 assert.equal((await call("donations/recurring/"+giftId+"/cancel","POST",{confirm:false})).status,422);
 const cancelled=await call("donations/recurring/"+giftId+"/cancel","POST",{confirm:true});assert.equal(cancelled.status,200,JSON.stringify(cancelled));
 assert.equal(cancelled.data.cancelled,true);assert.equal(cancelled.data.pending,false);assert.equal(cancelled.data.status,"cancelled");
 assert.equal((await call("donations/recurring/"+giftId+"/cancel","POST",{confirm:true})).data.cancelled,true);
 assert.equal((await signed("customer.subscription.updated",subscription(),{created:1793639999})).status,200);
 assert.equal((await db.recurringGift.findUniqueOrThrow({where:{id:giftId}})).status,"cancelled","late provider activity never resurrects cancelled mandate");
 assert.equal((await call("donations/recurring","POST",terms)).status,409,"an old confirmed request cannot silently start another subscription");
 const archive=await call("account/export","POST",{password,confirm:true});assert.equal(archive.status,200,JSON.stringify(archive.error));
 assert.ok(archive.data.recurringGifts.some(gift=>gift.id===giftId&&gift.termsVersion==="monthly-usd-v1"&&gift.status==="cancelled"));
 assert.ok(!JSON.stringify(archive.data.recurringGifts).includes(subscriptionId),"private mandate export excludes provider identifiers");
 // Owner alone is insufficient: an unrelated mosque's receipt remains private.
 foreign=await db.organization.create({data:{slug:"ci-recurring-receipt-"+run,name:"Synthetic foreign receipt mosque"}});
 const foreignCampaign=await db.donationCampaign.create({data:{organizationId:foreign.id,title:"Synthetic foreign archive",purpose:"CI only"}});
 const foreignDonation=await db.donation.create({data:{campaignId:foreignCampaign.id,donorId:member.id,amountMinor:100,status:"paid"}});
 const foreignReceipt=await db.paymentReceipt.create({data:{receiptNumber:"CI-FOREIGN-"+run,sourceType:"donation",sourceId:foreignDonation.id,donationId:foreignDonation.id,amountMinor:100,currency:"usd"}});
 assert.equal((await call("receipts/"+foreignReceipt.id)).status,404,"same owner cannot fetch foreign mosque receipt from pilot context");
 await db.paymentReceipt.delete({where:{id:foreignReceipt.id}});await db.donation.delete({where:{id:foreignDonation.id}});
 await db.donationCampaign.delete({where:{id:foreignCampaign.id}});await db.organization.delete({where:{id:foreign.id}});foreign=null;
 console.log("Verified explicit monthly consent, idempotent checkout, provider mandate binding, signed per-period payments, failed recovery, refunds, 23-row private history, owner/mosque isolation and terminal cancellation; no real provider calls.");
}finally{await db.$disconnect();}

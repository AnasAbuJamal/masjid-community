import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { postVerifiedPayment, reverseVerifiedPayment } from "@/lib/ledger";
import { fail, handled, HttpError, ok } from "@/lib/http";

export async function POST(req:NextRequest){
 return handled(async()=>{
  const key=process.env.STRIPE_SECRET_KEY,secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!key||!secret)throw new HttpError(503,"NOT_CONFIGURED","Webhook unavailable.");
  const signature=req.headers.get("stripe-signature");
  if(!signature)return fail(400,"NO_SIGNATURE","Missing signature.");
  const stripe=new Stripe(key);
  let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(await req.text(),signature,secret);}
  catch{return fail(400,"BAD_SIGNATURE","Signature invalid.");}
  await db.$transaction(async tx=>{
   const already=await tx.paymentEvent.findUnique({where:{providerEventId:event.id}});
   if(already)return;
   await tx.paymentEvent.create({data:{providerEventId:event.id,type:event.type}});
   if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
    const session=event.data.object as Stripe.Checkout.Session;
    if(session.payment_status!=="paid")return;
    const intent=typeof session.payment_intent==="string"?session.payment_intent:session.payment_intent?.id||null;
    const donationId=session.metadata?.donationId,invoiceId=session.metadata?.invoiceId;
    if(!!donationId===!!invoiceId)throw new HttpError(409,"PAYMENT_KIND","Exactly one payment source must be set.");
    if(donationId){
     const record=await tx.donation.findUnique({where:{id:donationId},include:{campaign:{select:{organizationId:true}}}});
     if(!record||(record.stripeSessionId&&record.stripeSessionId!==session.id)||
      record.amountMinor!==session.amount_total||record.currency!==session.currency)
      throw new HttpError(409,"DONATION_MISMATCH","Provider amount or payment source differs from donation.");
     if(record.status==="pending"){
      await tx.donation.update({where:{id:record.id},data:{status:"paid",stripeSessionId:session.id,paymentIntentId:intent}});
      await postVerifiedPayment(tx,{organizationId:record.campaign.organizationId,sourceType:"donation",sourceId:record.id,
       amountMinor:record.amountMinor,currency:record.currency,paymentIntentId:intent});
     }
    }else if(invoiceId){
     const record=await tx.schoolInvoice.findUnique({where:{id:invoiceId}});
     if(!record||record.amountMinor!==session.amount_total||record.currency!==session.currency||
      (record.stripeSessionId!==session.id&&!record.stripeSessionId?.startsWith("creating_")))
      throw new HttpError(409,"INVOICE_MISMATCH","Provider amount or payment source differs from invoice.");
     if(record.status==="pending"){
      await tx.schoolInvoice.update({where:{id:record.id},data:{status:"paid",paidAt:new Date(),stripeSessionId:session.id,paymentIntentId:intent}});
      await postVerifiedPayment(tx,{organizationId:record.organizationId,sourceType:"tuition",sourceId:record.id,
       amountMinor:record.amountMinor,currency:record.currency,paymentIntentId:intent});
     }
    }
   }
   if(event.type==="checkout.session.expired"||event.type==="checkout.session.async_payment_failed"){
    const session=event.data.object as Stripe.Checkout.Session;
    await tx.donation.updateMany({where:{stripeSessionId:session.id,status:"pending"},data:{status:"failed"}});
    await tx.schoolInvoice.updateMany({where:{stripeSessionId:session.id,status:"pending"},data:{stripeSessionId:null}});
   }
   if(event.type==="charge.refunded"){
    const charge=event.data.object as Stripe.Charge;
    const intent=typeof charge.payment_intent==="string"?charge.payment_intent:charge.payment_intent?.id||null;
    if(!intent)throw new HttpError(409,"REFUND_NOT_LINKED","Refund has no payment intent.");
    const donation=await tx.donation.findUnique({where:{paymentIntentId:intent},include:{campaign:{select:{organizationId:true}}}});
    const invoice=!donation?await tx.schoolInvoice.findUnique({where:{paymentIntentId:intent}}):null;
    if(!donation&&!invoice)throw new HttpError(409,"REFUND_NOT_LINKED","Refund does not match a recorded payment.");
    const amount=donation?.amountMinor||invoice!.amountMinor;
    if(charge.amount!==amount)throw new HttpError(409,"CHARGE_AMOUNT_MISMATCH","Charge does not match original payment.");
    if(charge.amount_refunded!==amount)return; // A partial refund requires provider reconciliation, not a false fully-refunded state.
    if(donation?.status==="paid"){
     await tx.donation.update({where:{id:donation.id},data:{status:"refunded"}});
     await reverseVerifiedPayment(tx,{organizationId:donation.campaign.organizationId,sourceType:"donation",sourceId:donation.id,
      amountMinor:amount,currency:donation.currency,paymentIntentId:intent});
     await tx.refundRequest.updateMany({where:{sourceKind:"donation",sourceId:donation.id,status:{in:["submitting","provider_pending","failed"]}},data:{status:"completed"}});
    }
    if(invoice?.status==="paid"){
     await tx.schoolInvoice.update({where:{id:invoice.id},data:{status:"refunded"}});
     await reverseVerifiedPayment(tx,{organizationId:invoice.organizationId,sourceType:"tuition",sourceId:invoice.id,
      amountMinor:amount,currency:invoice.currency,paymentIntentId:intent});
     await tx.refundRequest.updateMany({where:{sourceKind:"tuition",sourceId:invoice.id,status:{in:["submitting","provider_pending","failed"]}},data:{status:"completed"}});
    }
   }
  },{isolationLevel:"Serializable"});
  return ok({received:true});
 });
}

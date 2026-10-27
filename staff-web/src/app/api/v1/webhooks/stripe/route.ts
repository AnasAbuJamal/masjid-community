import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { fail, handled, HttpError, ok } from "@/lib/http";
export async function POST(req:NextRequest){
 return handled(async()=>{
  const key=process.env.STRIPE_SECRET_KEY,secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!key||!secret)throw new HttpError(503,"NOT_CONFIGURED","Webhook unavailable.");
  const sig=req.headers.get("stripe-signature");
  if(!sig)return fail(400,"NO_SIGNATURE","Missing signature.");
  const stripe=new Stripe(key);
  let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(await req.text(),sig,secret);}
  catch{return fail(400,"BAD_SIGNATURE","Signature invalid.");}
  await db.$transaction(async tx=>{
    if(await tx.paymentEvent.findUnique({where:{providerEventId:event.id}}))return;
    await tx.paymentEvent.create({data:{providerEventId:event.id,type:event.type}});
    if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
      const session=event.data.object as Stripe.Checkout.Session;
      if(session.payment_status!=="paid")return;
      const donationId=session.metadata?.donationId,invoiceId=session.metadata?.invoiceId;
      if(donationId){
        const donation=await tx.donation.findUnique({where:{id:donationId}});
        if(!donation||(donation.stripeSessionId&&donation.stripeSessionId!==session.id)||
          donation.amountMinor!==session.amount_total||donation.currency!==session.currency)
          throw new HttpError(409,"AMOUNT_MISMATCH","Payment does not match donation.");
        if(donation.status==="pending")await tx.donation.update({where:{id:donation.id},data:{status:"paid",stripeSessionId:session.id}});
      }
      if(invoiceId){
        const invoice=await tx.schoolInvoice.findUnique({where:{id:invoiceId}});
        if(!invoice||invoice.amountMinor!==session.amount_total||invoice.currency!==session.currency||
           (invoice.stripeSessionId!==session.id&&!invoice.stripeSessionId?.startsWith("creating_")))
          throw new HttpError(409,"INVOICE_MISMATCH","Payment does not match invoice.");
        if(invoice.status==="pending")await tx.schoolInvoice.update({where:{id:invoice.id},data:{status:"paid",paidAt:new Date(),stripeSessionId:session.id}});
      }
    }
    if(event.type==="checkout.session.expired"){
      const session=event.data.object as Stripe.Checkout.Session;
      await tx.donation.updateMany({where:{stripeSessionId:session.id,status:"pending"},data:{status:"failed"}});
      await tx.schoolInvoice.updateMany({where:{stripeSessionId:session.id,status:"pending"},data:{stripeSessionId:null}});
    }
  });
  return ok({received:true});
 });
}

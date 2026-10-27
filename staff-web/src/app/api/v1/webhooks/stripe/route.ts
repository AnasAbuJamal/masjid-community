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
    if(event.type==="checkout.session.completed"){
      const session=event.data.object as Stripe.Checkout.Session;
      const donationId=session.metadata?.donationId;
      if(!donationId||session.payment_status!=="paid")return;
      const donation=await tx.donation.findUnique({where:{id:donationId}});
      if(!donation||(donation.stripeSessionId && donation.stripeSessionId!==session.id)||donation.amountMinor!==session.amount_total||donation.currency!==session.currency)
        throw new HttpError(409,"AMOUNT_MISMATCH","Payment does not match donation.");
      await tx.donation.update({where:{id:donation.id},data:{status:"paid",stripeSessionId:session.id}});
    }
    if(event.type==="checkout.session.expired"){
      const session=event.data.object as Stripe.Checkout.Session;
      await tx.donation.updateMany({where:{stripeSessionId:session.id,status:"pending"},data:{status:"failed"}});
    }
  });
  return ok({received:true});
 });
}

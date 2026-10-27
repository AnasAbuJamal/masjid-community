import { NextRequest } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import { assertSameOrigin, handled, HttpError, jsonBody, ok } from "@/lib/http";
const payload=z.object({campaignId:z.string().min(8),amountMinor:z.number().int().min(100).max(10000000),anonymous:z.boolean().default(false)});
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const input=payload.parse(await jsonBody(req));
  const campaign=await db.donationCampaign.findFirst({where:{id:input.campaignId,published:true}});
  if(!campaign)throw new HttpError(404,"NOT_FOUND","Campaign unavailable.");
  if(campaign.currency!=="usd")throw new HttpError(422,"CURRENCY","Only USD checkout is enabled.");
  if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)throw new HttpError(503,"PROVIDER","Payments are not configured.");
  const origin=process.env.NEXT_PUBLIC_APP_URL;
  if(!origin||(process.env.NODE_ENV==="production"&&!origin.startsWith("https://")))throw new HttpError(503,"ORIGIN","Checkout origin is not configured.");
  const donation=await db.donation.create({data:{campaignId:campaign.id,donorId:user.id,amountMinor:input.amountMinor,currency:"usd",anonymous:input.anonymous}});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const session=await stripe.checkout.sessions.create({
      mode:"payment",customer_email:user.email,
      success_url:origin+"/payment-result?result=pending",
      cancel_url:origin+"/payment-result?result=cancelled",
      line_items:[{price_data:{currency:"usd",product_data:{name:campaign.title},unit_amount:input.amountMinor},quantity:1}],
      metadata:{donationId:donation.id},
    },{idempotencyKey:donation.id});
    await db.donation.update({where:{id:donation.id},data:{stripeSessionId:session.id}});
    return ok({donationId:donation.id,checkoutUrl:session.url,status:"pending"},201);
  }catch{
    await db.donation.update({where:{id:donation.id},data:{status:"failed"}});
    throw new HttpError(503,"PAYMENT_ERROR","Cannot initialize payment.");
  }
 });
}

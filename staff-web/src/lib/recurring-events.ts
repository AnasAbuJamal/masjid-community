import type {Prisma,RecurringGiftStatus} from "@prisma/client";
import type Stripe from "stripe";
import {HttpError} from "./http";
import {invoiceEvidence,providerIdentity,subscriptionEvidence} from "./recurring-contract";
import {postVerifiedPayment} from "./ledger";
import {notifyUser} from "./notifications";
type DB=Prisma.TransactionClient;
const statuses:Record<string,RecurringGiftStatus>={active:"active",past_due:"past_due",unpaid:"past_due",
 incomplete:"incomplete",incomplete_expired:"failed",canceled:"cancelled",paused:"paused"};
export async function recordRecurringEvent(tx:DB,event:{id:string;type:string;created:number;data:{object:unknown}}):Promise<boolean>{
 const object=event.data.object;
 const type=event.type;
 let giftId:string|undefined;
 if(type.startsWith("checkout.session."))giftId=(object as Stripe.Checkout.Session).metadata?.recurringGiftId;
 else if(type.startsWith("customer.subscription."))giftId=(object as Stripe.Subscription).metadata?.recurringGiftId;
 else if(type.startsWith("invoice."))giftId=(object as Stripe.Invoice).parent?.subscription_details?.metadata?.recurringGiftId;
 else return false;
 if(!giftId)return false; // Unrelated provider products never create a SILA mandate.
 const gift=await tx.recurringGift.findUnique({where:{id:giftId},include:{campaign:{select:{organizationId:true}}}});
 if(!gift||!Number.isSafeInteger(event.created)||event.created<=0)
  throw new HttpError(409,"RECURRING_SOURCE","Recurring provider evidence does not match an approved mandate.");
 const expected={id:gift.id,amountMinor:gift.amountMinor,currency:gift.currency,
  subscriptionId:gift.stripeSubscriptionId,customerId:gift.stripeCustomerId};
 if(type==="checkout.session.expired"){
  const session=object as Stripe.Checkout.Session;
  if(gift.stripeSessionId&&gift.stripeSessionId!==session.id)throw new HttpError(409,"RECURRING_SOURCE","Checkout identity differs.");
  if(!gift.stripeSubscriptionId&&gift.status==="pending")await tx.recurringGift.update({where:{id:gift.id},data:{status:"failed"}});
  return true;
 }
 if(type==="checkout.session.completed"||type==="checkout.session.async_payment_succeeded"){
  const session=object as Stripe.Checkout.Session;
  const subscriptionId=providerIdentity(session.subscription,"sub_"),customerId=providerIdentity(session.customer,"cus_");
  if(session.mode!=="subscription"||!subscriptionId||!customerId||
   gift.stripeSessionId&&gift.stripeSessionId!==session.id||
   gift.stripeSubscriptionId&&gift.stripeSubscriptionId!==subscriptionId||
   gift.stripeCustomerId&&gift.stripeCustomerId!==customerId||
   session.amount_total!==gift.amountMinor||session.currency!==gift.currency)
   throw new HttpError(409,"RECURRING_SOURCE","Checkout mandate identity or amount differs.");
  await tx.recurringGift.update({where:{id:gift.id},data:{stripeSessionId:session.id,
   stripeSubscriptionId:subscriptionId,stripeCustomerId:customerId}});
  // Checkout completion is never an installment receipt or a donation.
  return true;
 }
 if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(type)){
  const evidence=subscriptionEvidence(object,expected);
  if(!evidence||type==="customer.subscription.deleted"&&evidence.status!=="canceled")
   throw new HttpError(409,"RECURRING_MISMATCH","Subscription mandate differs from consented monthly terms.");
  if(event.created<gift.providerEventCreated||gift.status==="cancelled")return true;
  await tx.recurringGift.update({where:{id:gift.id},data:{stripeSubscriptionId:evidence.subscriptionId,
   stripeCustomerId:evidence.customerId,status:statuses[evidence.status],providerEventCreated:event.created}});
  return true;
 }
 if(!["invoice.payment_succeeded","invoice.paid","invoice.payment_failed"].includes(type))return true;
 const paid=type!=="invoice.payment_failed";
 const evidence=invoiceEvidence(object,expected,paid);
 if(!evidence)throw new HttpError(409,"RECURRING_PAYMENT_MISMATCH","Installment lacks matching subscription, amount or actual payment evidence.");
 let installment=await tx.recurringInstallment.findUnique({where:{invoiceId:evidence.invoiceId},include:{donation:true}});
 const firstFailure=!paid&&(!installment||installment.donation.status==="pending");
 if(installment&&(installment.giftId!==gift.id||installment.donation.donorId!==gift.donorId||
  installment.donation.campaignId!==gift.campaignId||installment.donation.amountMinor!==gift.amountMinor))
  throw new HttpError(409,"RECURRING_PAYMENT_MISMATCH","Invoice belongs to a different mandate.");
 if(!installment){
  const donation=await tx.donation.create({data:{campaignId:gift.campaignId,donorId:gift.donorId,amountMinor:gift.amountMinor,
   currency:gift.currency,anonymous:gift.anonymous,status:paid?"pending":"failed"}});
  installment=await tx.recurringInstallment.create({data:{invoiceId:evidence.invoiceId,giftId:gift.id,
   donationId:donation.id},include:{donation:true}});
 }
 if(!paid){
  if(installment.donation.status==="pending")await tx.donation.update({where:{id:installment.donationId},data:{status:"failed"}});
  if(firstFailure)await notifyUser(tx,gift.campaign.organizationId,gift.donorId,
   "Account update / تحديث الحساب","Review a private account update in SILA. / راجع تحديثًا خاصًا بحسابك في صلة.");
  return true;
 }
 if(installment.donation.status==="paid"||installment.donation.status==="refunded"){
  if(installment.donation.paymentIntentId!==evidence.paymentIntentId)
   throw new HttpError(409,"RECURRING_PAYMENT_MISMATCH","Invoice payment identity changed.");
  return true;
 }
 const used=await tx.donation.findUnique({where:{paymentIntentId:evidence.paymentIntentId!},select:{id:true}});
 if(used&&used.id!==installment.donationId)throw new HttpError(409,"RECURRING_PAYMENT_MISMATCH","Payment is already linked to another donation.");
 await tx.donation.update({where:{id:installment.donationId},data:{status:"paid",paymentIntentId:evidence.paymentIntentId}});
 await postVerifiedPayment(tx,{organizationId:gift.campaign.organizationId,sourceType:"donation",sourceId:installment.donationId,
  amountMinor:gift.amountMinor,currency:gift.currency,paymentIntentId:evidence.paymentIntentId});
 return true;
}

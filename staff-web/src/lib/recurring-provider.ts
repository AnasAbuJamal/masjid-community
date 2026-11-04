import Stripe from "stripe";
import {HttpError} from "./http";
export const recurringEnabled=()=>process.env.SILA_RECURRING_GIVING_ENABLED==="true"&&
 !!process.env.STRIPE_SECRET_KEY&&!!process.env.STRIPE_WEBHOOK_SECRET;
const synthetic=()=>process.env.SILA_RECURRING_CI_CAPTURE==="test-only"&&
 process.env.GITHUB_ACTIONS==="true"&&!process.env.VERCEL&&!process.env.NETLIFY&&
 process.env.DATABASE_URL==="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci"&&
 process.env.STRIPE_SECRET_KEY==="sk_test_ci_synthetic_no_network";
function provider(){
 // Disabling NEW mandates must never disable existing donors' cancellation
 // or signed installment processing.
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)
  throw new HttpError(503,"RECURRING_DISABLED","Monthly giving provider is not configured.");
 return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
export async function recurringCheckout(gift:{id:string;amountMinor:number;currency:string},email:string,title:string,origin:string){
 if(synthetic())return {id:"cs_test_synthetic_"+gift.id,url:"https://checkout.stripe.com/c/pay/cs_test_synthetic_"+gift.id};
 return provider().checkout.sessions.create({mode:"subscription",customer_email:email,
  success_url:origin+"/payment-result?result=pending",cancel_url:origin+"/payment-result?result=cancelled",
  line_items:[{quantity:1,price_data:{currency:gift.currency,unit_amount:gift.amountMinor,
   product_data:{name:title},recurring:{interval:"month",interval_count:1}}}],
  metadata:{recurringGiftId:gift.id},subscription_data:{metadata:{recurringGiftId:gift.id}},
  custom_text:{submit:{message:"Monthly until cancelled. Stop future renewals in SILA. Previously initiated charges may finish. Refunds require separate review."}}
 },{idempotencyKey:"recurring-checkout-"+gift.id});
}
export async function cancelRecurringSubscription(id:string){
 if(synthetic())return {id,status:"canceled"};
 const stripe=provider();
 const existing=await stripe.subscriptions.retrieve(id);
 if(existing.status==="canceled")return existing;
 return stripe.subscriptions.cancel(id,{invoice_now:false,prorate:false},
  {idempotencyKey:"recurring-cancel-"+id});
}
export async function hydrateRecurringInvoice(invoice:Stripe.Invoice){
 if(invoice.payments!==undefined)return invoice;
 if(synthetic())throw new HttpError(409,"RECURRING_PAYMENT_EVIDENCE","Synthetic invoices require explicit payment evidence.");
 // Clover invoice payments are not always expanded in webhook snapshots.
 // Retrieve only the signed invoice id, never a client supplied URL.
 return provider().invoices.retrieve(invoice.id,{expand:["payments"]});
}

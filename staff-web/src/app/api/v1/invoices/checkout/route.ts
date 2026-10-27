import {randomUUID} from "node:crypto";
import {NextRequest} from "next/server";
import Stripe from "stripe";
import {z} from "zod";
import {requireVerified} from "@/lib/auth";
import {db} from "@/lib/db";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireVerified(req);
  const {invoiceId}=z.object({invoiceId:z.string().min(8)}).parse(await jsonBody(req));
  const invoice=await db.schoolInvoice.findUnique({where:{id:invoiceId}});
  if(!invoice||invoice.status!=="pending")throw new HttpError(404,"INVOICE_UNAVAILABLE","This invoice is not payable.");
  if(invoice.payerGuardianId!==actor.id)throw new HttpError(403,"NOT_PAYER","Only the designated guardian may pay this invoice.");
  const link=await db.guardianLink.findUnique({where:{guardianId_studentId:{guardianId:actor.id,studentId:invoice.studentId}}});
  if(!link?.approvedAt||link.revokedAt)throw new HttpError(403,"NOT_GUARDIAN","Guardian access is not active.");
  const key=process.env.STRIPE_SECRET_KEY,signing=process.env.STRIPE_WEBHOOK_SECRET,origin=process.env.NEXT_PUBLIC_APP_URL;
  if(!key||!signing||!origin||(process.env.NODE_ENV==="production"&&!origin.startsWith("https://")))
   throw new HttpError(503,"PAYMENT_NOT_CONFIGURED","Secure payments are not configured.");
  const reservation="creating_"+randomUUID();
  const claimed=await db.schoolInvoice.updateMany({where:{id:invoice.id,status:"pending",stripeSessionId:null},data:{stripeSessionId:reservation}});
  if(!claimed.count)throw new HttpError(409,"CHECKOUT_IN_PROGRESS","A payment session is already open. Contact the school if it has expired.");
  try{
   const stripe=new Stripe(key);
   const session=await stripe.checkout.sessions.create({
    mode:"payment",customer_email:actor.email,
    success_url:origin+"/payment-result?result=pending",
    cancel_url:origin+"/payment-result?result=cancelled",
    line_items:[{price_data:{currency:invoice.currency,unit_amount:invoice.amountMinor,product_data:{name:invoice.description}},quantity:1}],
    metadata:{invoiceId:invoice.id},
   },{idempotencyKey:"school:"+invoice.id+":"+reservation});
   await db.schoolInvoice.updateMany({where:{id:invoice.id,stripeSessionId:reservation},data:{stripeSessionId:session.id}});
   return ok({invoiceId:invoice.id,checkoutUrl:session.url,status:"pending"},201);
  }catch{
   await db.schoolInvoice.updateMany({where:{id:invoice.id,stripeSessionId:reservation},data:{stripeSessionId:null}});
   throw new HttpError(503,"CHECKOUT_FAILED","Payment checkout cannot be created.");
  }
 });
}

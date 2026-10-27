import {NextRequest} from "next/server";
import Stripe from "stripe";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("request"),sourceKind:z.enum(["donation","tuition"]),sourceId:z.string().min(8),
  reason:z.string().trim().min(10).max(1000)}),
 z.object({kind:z.literal("review"),requestId:z.string().min(8),decision:z.enum(["approve","reject"])})
]);

async function source(kind:"donation"|"tuition",id:string){
 if(kind==="donation"){
  const record=await db.donation.findUnique({where:{id},include:{campaign:{select:{title:true,organizationId:true}}}});
  if(!record)return null;
  return {organizationId:record.campaign.organizationId,description:record.campaign.title,
   amountMinor:record.amountMinor,currency:record.currency,paymentIntentId:record.paymentIntentId,status:record.status};
 }
 const record=await db.schoolInvoice.findUnique({where:{id}});
 if(!record)return null;
 return {organizationId:record.organizationId,description:record.description,
  amountMinor:record.amountMinor,currency:record.currency,paymentIntentId:record.paymentIntentId,status:record.status};
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["finance","admin"]);
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  const [requests,donations,invoices]=await Promise.all([
   db.refundRequest.findMany({where:{organizationId:org.id},take:100,orderBy:{createdAt:"desc"},
    select:{id:true,sourceKind:true,sourceId:true,reason:true,amountMinor:true,currency:true,status:true,
     requestedById:true,reviewedById:true,createdAt:true,requester:{select:{firstName:true,lastName:true}}}}),
   db.donation.findMany({where:{campaign:{organizationId:org.id},status:"paid",paymentIntentId:{not:null}},take:70,orderBy:{createdAt:"desc"},
    select:{id:true,amountMinor:true,currency:true,campaign:{select:{title:true}}}}),
   db.schoolInvoice.findMany({where:{organizationId:org.id,status:"paid",paymentIntentId:{not:null}},take:70,orderBy:{createdAt:"desc"},
    select:{id:true,amountMinor:true,currency:true,description:true}})
  ]);
  return ok({requests,eligible:[
   ...donations.map(x=>({id:x.id,sourceKind:"donation",title:x.campaign.title,amountMinor:x.amountMinor,currency:x.currency})),
   ...invoices.map(x=>({id:x.id,sourceKind:"tuition",title:x.description,amountMinor:x.amountMinor,currency:x.currency}))
  ],policy:"Only full verified payments are eligible. Two separate authorized accounts are required. A provider-confirmed refund is required to change the customer receipt."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin","finance"]);
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  if(input.kind==="request"){
   const record=await source(input.sourceKind,input.sourceId);
   if(!record||record.organizationId!==org.id||record.status!=="paid"||!record.paymentIntentId)
    throw new HttpError(404,"NOT_REFUNDABLE","Only a verified payment owned by this organization can be refunded.");
   const existing=await db.refundRequest.findUnique({where:{sourceKind_sourceId:{sourceKind:input.sourceKind,sourceId:input.sourceId}}});
   if(existing)throw new HttpError(409,"REFUND_ALREADY_REQUESTED","This charge already has a recorded refund request.");
   const created=await db.$transaction(async tx=>{
    const result=await tx.refundRequest.create({data:{organizationId:org.id,sourceKind:input.sourceKind,sourceId:input.sourceId,
     amountMinor:record.amountMinor,currency:record.currency,reason:input.reason,requestedById:user.id}});
    await tx.auditEvent.create({data:{actorId:user.id,action:"finance.refund.request",entity:"RefundRequest",entityId:result.id}});
    return result;
   });
   return ok({id:created.id,status:created.status,message:"Refund submitted for an independent reviewer."},201);
  }
  const item=await db.refundRequest.findFirst({where:{id:input.requestId,organizationId:org.id}});
  if(!item)throw new HttpError(404,"NOT_FOUND","Refund request unavailable.");
  if(item.requestedById===user.id)throw new HttpError(403,"SEPARATION_OF_DUTIES","You cannot approve or reject your own refund request.");
  if(input.decision==="reject"){
   const changed=await db.$transaction(async tx=>{
    const updated=await tx.refundRequest.updateMany({where:{id:item.id,status:"requested"},data:{status:"rejected",reviewedById:user.id,reviewedAt:new Date()}});
    if(!updated.count)throw new HttpError(409,"REFUND_NOT_PENDING","Request is no longer pending.");
    await tx.auditEvent.create({data:{actorId:user.id,action:"finance.refund.reject",entity:"RefundRequest",entityId:item.id}});
    return updated.count;
   });
   return ok({id:item.id,status:"rejected"});
  }
  if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)
   throw new HttpError(503,"PAYMENT_NOT_CONFIGURED","Refund provider is not configured.");
  const record=await source(item.sourceKind,item.sourceId);
  if(!record||record.organizationId!==org.id||record.status!=="paid"||!record.paymentIntentId||
   record.amountMinor!==item.amountMinor||record.currency!==item.currency)
   throw new HttpError(409,"PAYMENT_CHANGED","Original payment is not eligible for this refund.");
  await db.$transaction(async tx=>{
   const changed=await tx.refundRequest.updateMany({where:{id:item.id,status:{in:["requested","failed"]}},
    data:{status:"submitting",reviewedById:user.id,reviewedAt:new Date(),providerErrorCode:null}});
   if(!changed.count)throw new HttpError(409,"REFUND_NOT_PENDING","Request is being processed or already reviewed.");
   await tx.auditEvent.create({data:{actorId:user.id,action:"finance.refund.submit",entity:"RefundRequest",entityId:item.id}});
  });
  try{
   const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
   const refund=await stripe.refunds.create({payment_intent:record.paymentIntentId,amount:item.amountMinor,reason:"requested_by_customer",
    metadata:{refundRequestId:item.id}},{idempotencyKey:"masjid-refund-"+item.id});
   if(refund.status==="failed"||refund.status==="canceled"){
    await db.refundRequest.updateMany({where:{id:item.id,status:"submitting"},data:{status:"failed",stripeRefundId:refund.id,providerErrorCode:refund.status}});
    return ok({id:item.id,status:"failed",message:"Provider rejected this refund; finance must review the exception."});
   }
   await db.refundRequest.updateMany({where:{id:item.id,status:"submitting"},data:{status:"provider_pending",stripeRefundId:refund.id}});
   return ok({id:item.id,status:"provider_pending",message:"Provider accepted the refund request. The signed webhook will confirm its completion."});
  }catch(error){
   await db.refundRequest.updateMany({where:{id:item.id,status:"submitting"},data:{status:"failed",providerErrorCode:"provider_unavailable"}});
   console.error("Refund provider could not complete an authorized request",error instanceof Error?error.name:"Unknown");
   throw new HttpError(503,"REFUND_PROVIDER_UNAVAILABLE","The refund provider could not complete this request. Finance should reconcile its status before retrying.");
  }
 });
}

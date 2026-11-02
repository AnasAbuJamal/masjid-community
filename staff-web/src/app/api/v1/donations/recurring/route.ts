import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
import {recurringCheckout,recurringEnabled} from "@/lib/recurring-provider";
export const TERMS_VERSION="monthly-usd-v1";
const consent=z.object({campaignId:z.string().min(8).max(128),amountMinor:z.number().int().min(100).max(10000000),
 anonymous:z.boolean(),termsVersion:z.literal(TERMS_VERSION),confirm:z.literal(true),requestKey:z.string().regex(/^[A-Za-z0-9_-]{16,100}$/)}).strict();
const selection={id:true,amountMinor:true,currency:true,status:true,cancelRequestedAt:true,createdAt:true,campaign:{select:{id:true,title:true}}} as const;
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true,name:true,timeZone:true}});
  const query=z.object({giftId:z.string().min(8).max(128).optional(),cursor:z.string().min(8).max(128).optional()}).strict().parse(
   Object.fromEntries(req.nextUrl.searchParams));
  if([...req.nextUrl.searchParams.keys()].some(key=>req.nextUrl.searchParams.getAll(key).length!==1))throw new HttpError(422,"QUERY","Duplicate filters are not allowed.");
  const owned={donorId:user.id,campaign:{organizationId:org.id}};
  if(query.giftId){
   const gift=await db.recurringGift.findFirst({where:{id:query.giftId,...owned},select:selection});
   if(!gift)throw new HttpError(404,"NOT_FOUND","Monthly gift unavailable.");
   const cursor=query.cursor?await db.recurringInstallment.findFirst({where:{invoiceId:query.cursor,giftId:gift.id},select:{invoiceId:true}}):null;
   if(query.cursor&&!cursor)throw new HttpError(404,"NOT_FOUND","History cursor unavailable.");
   const rows=await db.recurringInstallment.findMany({where:{giftId:gift.id},orderBy:[{createdAt:"desc"},{invoiceId:"desc"}],take:21,
    ...(cursor?{cursor:{invoiceId:cursor.invoiceId},skip:1}:{}),include:{donation:{select:{status:true,amountMinor:true,currency:true,receipt:{select:{id:true}}}}}});
   return ok({organization:org,enabled:recurringEnabled(),gift,installments:rows.slice(0,20).map(row=>({invoiceId:row.invoiceId,
    createdAt:row.createdAt,status:row.donation.status,amountMinor:row.donation.amountMinor,currency:row.donation.currency,receiptId:row.donation.receipt?.id||null})),
    nextCursor:rows.length>20?rows[19].invoiceId:null});
  }
  const cursor=query.cursor?await db.recurringGift.findFirst({where:{id:query.cursor,...owned},select:{id:true}}):null;
  if(query.cursor&&!cursor)throw new HttpError(404,"NOT_FOUND","Monthly gift cursor unavailable.");
  const rows=await db.recurringGift.findMany({where:owned,orderBy:[{createdAt:"desc"},{id:"desc"}],take:21,
   ...(cursor?{cursor:{id:cursor.id},skip:1}:{}),select:selection});
  return ok({enabled:recurringEnabled(),organization:org,items:rows.slice(0,20),nextCursor:rows.length>20?rows[19].id:null});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req),input=consent.parse(await jsonBody(req));
  if(!recurringEnabled())throw new HttpError(503,"RECURRING_DISABLED","Monthly giving is not configured.");
  const org=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}});
  const campaign=await db.donationCampaign.findFirst({where:{id:input.campaignId,organizationId:org.id,published:true,currency:"usd"}});
  if(!campaign)throw new HttpError(404,"NOT_FOUND","Published USD campaign unavailable.");
  const origin=process.env.NEXT_PUBLIC_APP_URL;
  if(!origin||process.env.NODE_ENV==="production"&&!origin.startsWith("https://")&&process.env.GITHUB_ACTIONS!=="true")
   throw new HttpError(503,"ORIGIN","Secure checkout origin is not configured.");
  let gift=await db.recurringGift.findUnique({where:{donorId_requestKey:{donorId:user.id,requestKey:input.requestKey}}});
  if(!gift){
   try{gift=await db.$transaction(async tx=>{
    const created=await tx.recurringGift.create({data:{donorId:user.id,campaignId:campaign.id,amountMinor:input.amountMinor,
     currency:"usd",anonymous:input.anonymous,requestKey:input.requestKey,termsVersion:input.termsVersion,consentedAt:new Date()}});
    await tx.auditEvent.create({data:{actorId:user.id,action:"giving.recurring.consent",entity:"RecurringGift",entityId:created.id,
     detail:JSON.stringify({organizationId:org.id,termsVersion:TERMS_VERSION,interval:"month",currency:"usd",amountMinor:input.amountMinor})}});
    return created;
   });}catch(error){
    if(!(error instanceof Prisma.PrismaClientKnownRequestError)||error.code!=="P2002")throw error;
    gift=await db.recurringGift.findUnique({where:{donorId_requestKey:{donorId:user.id,requestKey:input.requestKey}}});
   }
  }
  if(!gift||gift.campaignId!==campaign.id||gift.amountMinor!==input.amountMinor||gift.anonymous!==input.anonymous||gift.termsVersion!==input.termsVersion)
   throw new HttpError(409,"RECURRING_INTENT_CHANGED","A retry must preserve the exact previously confirmed monthly terms.");
  if(gift.status!=="pending"||gift.cancelRequestedAt||gift.stripeSubscriptionId)
   throw new HttpError(409,"RECURRING_ALREADY_STARTED","Review this monthly gift before starting another checkout.");
  if(gift.checkoutUrl)return ok({giftId:gift.id,checkoutUrl:gift.checkoutUrl,status:"pending"});
  try{
   const session=await recurringCheckout(gift,user.email,campaign.title,origin);
   if(!session.url||new URL(session.url).origin!=="https://checkout.stripe.com")throw Error("Invalid checkout origin");
   await db.recurringGift.update({where:{id:gift.id},data:{stripeSessionId:session.id,checkoutUrl:session.url}});
   return ok({giftId:gift.id,checkoutUrl:session.url,status:"pending"},201);
  }catch{throw new HttpError(503,"RECURRING_CHECKOUT_PENDING","Checkout could not be verified. Retry the same request or review your monthly gifts.");}
 });
}

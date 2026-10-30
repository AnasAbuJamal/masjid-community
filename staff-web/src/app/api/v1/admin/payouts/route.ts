import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const note=z.object({payoutId:z.string().min(8),body:z.string().trim().min(15).max(500)});

// A verified Stripe payout report does not prove that the bank credited
// the account or that individual transactions, fees and disputes reconcile.
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","finance"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const payouts=await db.providerPayout.findMany({
   where:{organizationId:org.id},orderBy:[{observedAt:"desc"},{id:"desc"}],
   take:100,select:{
    id:true,providerPayoutId:true,amountMinor:true,currency:true,state:true,
    arrivalAt:true,failureCode:true,observedAt:true,updatedAt:true,
    notes:{take:10,orderBy:{createdAt:"desc"},
     select:{id:true,body:true,createdAt:true,author:{select:{firstName:true,lastName:true}}}}
   }
  });
  return ok({payouts,organization:{name:org.name},complete:payouts.length<100,
   reconciliationReady:false,
   warning:"Provider-reported payout status is NOT reconciliation. Gross charges, provider fees, refunds, adjustments, disputes and actual bank credit have not yet been independently matched. Never treat 'paid' as a reconciled bank deposit.",
   policy:"Finance and MFA-verified stewards may record a non-sensitive investigation note. Notes cannot certify or change the provider payout status."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin","finance"]);
  const input=note.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const created=await db.$transaction(async tx=>{
   const payout=await tx.providerPayout.findFirst({where:{
    id:input.payoutId,organizationId:org.id
   },select:{id:true,state:true}});
   if(!payout)throw new HttpError(404,"PAYOUT_UNAVAILABLE",
    "Provider payout unavailable in this mosque.");
   const saved=await tx.payoutReviewNote.create({data:{
    payoutId:payout.id,authorId:user.id,body:input.body
   },select:{id:true,createdAt:true}});
   await tx.auditEvent.create({data:{
    actorId:user.id,action:"finance.payout.note",entity:"ProviderPayout",
    entityId:payout.id,detail:JSON.stringify({organizationId:org.id,noteId:saved.id})
   }});
   return saved;
  });
  return ok({noteId:created.id,recordedAt:created.createdAt,
   message:"Investigation note recorded. Payout remains unreconciled."},201);
 });
}

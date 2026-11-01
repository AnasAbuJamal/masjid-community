import {NextRequest} from "next/server";
import {z} from "zod";
import {Prisma} from "@prisma/client";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
import {PAYOUT_EXCEPTION_CODES,payoutExceptionBody} from "@/lib/payout-exceptions";

// Fixed, explicitly selected categories only. Do not accept arbitrary names,
// banking information, provider references or donor narratives from clients.
const note=z.object({
 payoutId:z.string().min(8).max(128),
 reasonCode:z.enum(PAYOUT_EXCEPTION_CODES)
}).strict();

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
    // Fetch one extra as a sentinel. Showing only the first ten without
    // an incompleteness signal can mislead auditors about note history.
    notes:{take:11,orderBy:[{createdAt:"desc"},{id:"desc"}],
     select:{id:true,body:true,createdAt:true,author:{select:{firstName:true,lastName:true}}}}
   }
  });
  return ok({
   payouts:payouts.map(p=>({
    ...p,notes:p.notes.slice(0,10),notesComplete:p.notes.length<=10
   })),
   notesPageSize:10,organization:{name:org.name},complete:payouts.length<100,
   reconciliationReady:false,
   warning:"Provider-reported payout status is NOT reconciliation. Gross charges, provider fees, refunds, adjustments, disputes and actual bank credit have not yet been independently matched. Never treat 'paid' as a reconciled bank deposit.",
   policy:"Finance and MFA-verified stewards may record fixed exception categories only. Historical notes are read-only. The register shows only the latest ten notes for each payout and flags an incomplete note history; it is not a full evidence export. Exceptions never certify bank credit or change provider payout status."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin","finance"]);
  const input=note.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  let created:{id:string;createdAt:Date};
  try{created=await db.$transaction(async tx=>{
   const payout=await tx.providerPayout.findFirst({where:{
    id:input.payoutId,organizationId:org.id
   },select:{id:true,state:true}});
   if(!payout)throw new HttpError(404,"PAYOUT_UNAVAILABLE",
    "Provider payout unavailable in this mosque.");
   const canonical=payoutExceptionBody(input.reasonCode);
   // One recorded category per payout. Under Serializable isolation, even
   // concurrent submissions cannot quietly duplicate the same exception.
   if(await tx.payoutReviewNote.findFirst({where:{
    payoutId:payout.id,body:canonical
   },select:{id:true}}))throw new HttpError(409,"EXCEPTION_ALREADY_RECORDED",
    "This unresolved exception category is already recorded for the payout.");
   const saved=await tx.payoutReviewNote.create({data:{
    payoutId:payout.id,authorId:user.id,body:canonical
   },select:{id:true,createdAt:true}});
   await tx.auditEvent.create({data:{
    actorId:user.id,action:"finance.payout.note",entity:"ProviderPayout",
    entityId:payout.id,detail:JSON.stringify({organizationId:org.id,
     noteId:saved.id,reasonCode:input.reasonCode,settlementCertified:false})
   }});
   return saved;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"EXCEPTION_CHANGED",
     "Exception was recorded concurrently. Refresh the payout register.");
   throw error;
  }
  return ok({noteId:created.id,recordedAt:created.createdAt,
   reasonCode:input.reasonCode,settlementCertified:false,
   message:"Structured exception recorded. Payout remains unreconciled."},201);
 });
}

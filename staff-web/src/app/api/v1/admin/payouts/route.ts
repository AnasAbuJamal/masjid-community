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
const notePage=z.object({
 payoutId:z.string().min(8).max(128),
 cursor:z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/).optional()
}).strict();
const NOTE_PAGE_SIZE=10;
const PAYOUT_PAGE_SIZE=100;

// A verified Stripe payout report does not prove that the bank credited
// the account or that individual transactions, fees and disputes reconcile.
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","finance"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>!["payoutId","cursor","registerCursor"].includes(k))||
     ["payoutId","cursor","registerCursor"].some(k=>params.getAll(k).length>1))
   throw new HttpError(422,"BAD_QUERY","Unknown or repeated payout-history parameter.");
  if(params.has("registerCursor")&&(params.has("payoutId")||params.has("cursor")))
   throw new HttpError(422,"BAD_QUERY","Payout register and review-history cursors cannot be combined.");
  if(params.has("cursor")&&!params.has("payoutId"))
   throw new HttpError(422,"BAD_QUERY","Specify an owned payout before a note cursor.");
  if(params.has("payoutId")){
   const input=notePage.parse({
    payoutId:params.get("payoutId"),
    ...(params.has("cursor")?{cursor:params.get("cursor")}:{})
   });
   const payout=await db.providerPayout.findFirst({
    where:{id:input.payoutId,organizationId:org.id},select:{id:true}
   });
   if(!payout)throw new HttpError(404,"PAYOUT_UNAVAILABLE",
    "Payout is unavailable in this mosque.");
   const pivot=input.cursor?await db.payoutReviewNote.findFirst({
    where:{id:input.cursor,payoutId:payout.id},select:{id:true,createdAt:true}
   }):null;
   if(input.cursor&&!pivot)throw new HttpError(404,"NOTE_CURSOR_UNAVAILABLE",
    "Review-history cursor is unavailable for this payout.");
   const before:Prisma.PayoutReviewNoteWhereInput=pivot?{OR:[
    {createdAt:{lt:pivot.createdAt}},
    {createdAt:pivot.createdAt,id:{lt:pivot.id}}
   ]}:{};
   const rows=await db.payoutReviewNote.findMany({
    where:{payoutId:payout.id,...before},
    orderBy:[{createdAt:"desc"},{id:"desc"}],take:NOTE_PAGE_SIZE+1,
    select:{id:true,body:true,createdAt:true,
     author:{select:{firstName:true,lastName:true}}}
   });
   const page=rows.slice(0,NOTE_PAGE_SIZE);
   return ok({payoutId:payout.id,notes:page,notesPageSize:NOTE_PAGE_SIZE,
    complete:rows.length<=NOTE_PAGE_SIZE,
    nextCursor:rows.length>NOTE_PAGE_SIZE?page[page.length-1].id:null,
    reconciliationReady:false,
    policy:"Private, read-only payout review history; notes never certify settlement."});
  }
  const registerCursor=params.get("registerCursor");
  if(registerCursor&&!/^[A-Za-z0-9_-]{8,128}$/.test(registerCursor))
   throw new HttpError(422,"BAD_QUERY","Malformed payout register cursor.");
  if(params.has("registerCursor")&&!registerCursor)
   throw new HttpError(422,"BAD_QUERY","Empty payout register cursor.");
  const anchor=registerCursor?await db.providerPayout.findFirst({
   where:{id:registerCursor,organizationId:org.id},
   select:{id:true,observedAt:true}
  }):null;
  if(registerCursor&&!anchor)throw new HttpError(404,"PAYOUT_CURSOR_UNAVAILABLE",
   "Payout register cursor is unavailable for this mosque.");
  const registerBefore:Prisma.ProviderPayoutWhereInput=anchor?{OR:[
   {observedAt:{lt:anchor.observedAt}},
   {observedAt:anchor.observedAt,id:{lt:anchor.id}}
  ]}:{};
  const payouts=await db.providerPayout.findMany({
   where:{organizationId:org.id,...registerBefore},orderBy:[{observedAt:"desc"},{id:"desc"}],
   take:PAYOUT_PAGE_SIZE+1,select:{
    id:true,providerPayoutId:true,amountMinor:true,currency:true,state:true,
    arrivalAt:true,failureCode:true,observedAt:true,updatedAt:true,
    // Fetch one extra as a sentinel. Showing only the first ten without
    // an incompleteness signal can mislead auditors about note history.
    notes:{take:NOTE_PAGE_SIZE+1,orderBy:[{createdAt:"desc"},{id:"desc"}],
     select:{id:true,body:true,createdAt:true,author:{select:{firstName:true,lastName:true}}}}
   }
  });
  return ok({
   payouts:payouts.slice(0,PAYOUT_PAGE_SIZE).map(p=>({
    ...p,notes:p.notes.slice(0,NOTE_PAGE_SIZE),notesComplete:p.notes.length<=NOTE_PAGE_SIZE
   })),
   notesPageSize:NOTE_PAGE_SIZE,organization:{name:org.name},
   complete:payouts.length<=PAYOUT_PAGE_SIZE,
   nextRegisterCursor:payouts.length>PAYOUT_PAGE_SIZE?payouts[PAYOUT_PAGE_SIZE-1].id:null,
   reconciliationReady:false,
   warning:"Provider-reported payout status is NOT reconciliation. Gross charges, provider fees, refunds, adjustments, disputes and actual bank credit have not yet been independently matched. Never treat 'paid' as a reconciled bank deposit.",
   policy:"Finance and MFA-verified stewards may record fixed exception categories only. Historical notes are read-only. The register uses bounded payout pages and shows only the latest ten notes per payout; it is not a full evidence export. Exceptions never certify bank credit or change provider payout status."});
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

import type {Prisma} from "@prisma/client";
import type Stripe from "stripe";
import {HttpError} from "./http";

type DB=Prisma.TransactionClient;
const stateNames=["pending","in_transit","paid","failed","canceled"] as const;
type State=typeof stateNames[number];
const rank:Record<State,number>={pending:0,in_transit:1,paid:2,failed:3,canceled:3};

// A Stripe payout event is signed provider evidence of a *provider-reported*
// state. It says nothing about the associated charge/fee/adjustment lines or
// the actual bank credit; finance MUST NOT treat it as reconciled.
export async function recordProviderPayout(tx:DB,event:Stripe.Event){
 if(!["payout.created","payout.updated","payout.paid","payout.failed","payout.canceled"].includes(event.type))
  return;
 const payout=event.data.object as Stripe.Payout;
 if(typeof payout.id!=="string"||!payout.id.startsWith("po_")||
  !Number.isSafeInteger(payout.amount)||payout.amount<=0||
  payout.currency!=="usd"||
  !stateNames.includes(payout.status as State)||
  !Number.isSafeInteger(event.created)||event.created<=0)
  throw new HttpError(409,"PAYOUT_UNVERIFIED","Provider payout payload has invalid source, amount, currency or state.");
 const state=payout.status as State;
 const stateRequired:Record<string,State>={
  "payout.paid":"paid","payout.failed":"failed","payout.canceled":"canceled"
 };
 if(stateRequired[event.type]&&stateRequired[event.type]!==state)
  throw new HttpError(409,"PAYOUT_EVENT_MISMATCH","Provider event and payout state differ.");
 // The existing pilot uses one global Stripe key. Until each organization
 // has a separately verified Stripe account mapping, never assign a payout
 // to the first mosque in a multi-tenant system.
 const organizations=await tx.organization.findMany({
  orderBy:{createdAt:"asc"},take:2,select:{id:true}
 });
 if(organizations.length!==1)throw new HttpError(409,"PAYOUT_TENANT_UNCONFIGURED",
  "A provider-specific organization mapping is required before processing payouts for multiple mosques.");
 const orgId=organizations[0].id;
 const old=await tx.providerPayout.findUnique({
  where:{providerPayoutId:payout.id}
 });
 if(old&&(old.organizationId!==orgId||old.amountMinor!==payout.amount||old.currency!==payout.currency))
  throw new HttpError(409,"PAYOUT_AMOUNT_MISMATCH","Payout identity, amount or currency changed. Finance must review the exception.");
 const arrivalAt=payout.arrival_date&&Number.isSafeInteger(payout.arrival_date)?
  new Date(payout.arrival_date*1000):null;
 const failureCode=state==="failed"?
  (typeof payout.failure_code==="string"?payout.failure_code.slice(0,120):"provider_reported_failed"):null;
 if(!old){
  await tx.providerPayout.create({data:{
   organizationId:orgId,providerPayoutId:payout.id,
   amountMinor:payout.amount,currency:payout.currency,state,
   arrivalAt,failureCode,lastProviderEventId:event.id,
   lastProviderEventCreated:event.created
  }});
  return;
 }
 // Webhooks are at-least-once and may arrive out of order. A delayed
 // "payout.created" must not overwrite a newer paid/failed event.
 if(event.created<old.lastProviderEventCreated)return;
 if(event.created===old.lastProviderEventCreated&&rank[state]<=rank[old.state])return;
 if((old.state==="failed"||old.state==="canceled")&&state!==old.state)
  throw new HttpError(409,"PAYOUT_TERMINAL_CONFLICT",
   "A terminal failed/canceled payout was reported as a different state. Inspect the provider.");
 if(old.state==="paid"&&state!=="paid"&&state!=="failed")
  throw new HttpError(409,"PAYOUT_STATE_CONFLICT","Provider payout state changed unexpectedly.");
 if(rank[state]<rank[old.state]&&state!=="paid")return;
 const changed=await tx.providerPayout.updateMany({where:{
  id:old.id,organizationId:orgId,
  lastProviderEventCreated:{lte:event.created},
  state:old.state
 },data:{
  state,arrivalAt,failureCode,lastProviderEventId:event.id,
  lastProviderEventCreated:event.created
 }});
 if(!changed.count)throw new HttpError(409,"PAYOUT_CHANGED","Payout was updated concurrently; provider may safely retry.");
}

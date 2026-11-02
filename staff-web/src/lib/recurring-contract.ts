// Dependency-free provider evidence checks; unknown formats fail closed.
type RecordValue=Record<string,unknown>;
const record=(value:unknown):value is RecordValue=>typeof value==="object"&&value!==null&&!Array.isArray(value);
export type RecurringExpected={id:string;amountMinor:number;currency:string;customerId:string|null;subscriptionId:string|null};
export function monthlyAmount(value:string):number|null{
 const s=value.trim();if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(s))return null;
 const [whole,fraction=""]=s.split(".");const cents=Number(whole)*100+Number(fraction.padEnd(2,"0"));
 return Number.isSafeInteger(cents)&&cents>=100&&cents<=10000000?cents:null;
}
export function providerIdentity(value:unknown,prefix:string):string|null{
 const id=typeof value==="string"?value:record(value)?value.id:null;
 return typeof id==="string"&&id.startsWith(prefix)&&id.length>prefix.length&&id.length<=200&&/^[A-Za-z0-9_]+$/.test(id)?id:null;
}
export const recurringStates=["active","past_due","unpaid","incomplete","incomplete_expired","canceled","paused"] as const;
export function subscriptionEvidence(value:unknown,expected:RecurringExpected){
 if(!record(value)||!record(value.metadata)||!record(value.items)||!Array.isArray(value.items.data)||
  value.items.has_more!==false||value.items.data.length!==1||!record(value.items.data[0]))return null;
 const item=value.items.data[0],price=item.price;
 const subscriptionId=providerIdentity(value,"sub_"),customerId=providerIdentity(value.customer,"cus_");
 if(!subscriptionId||!customerId||value.metadata.recurringGiftId!==expected.id||
  expected.subscriptionId&&expected.subscriptionId!==subscriptionId||expected.customerId&&expected.customerId!==customerId||
  !recurringStates.includes(value.status as typeof recurringStates[number])||item.quantity!==1||!record(price)||
  price.currency!==expected.currency||price.unit_amount!==expected.amountMinor||!record(price.recurring)||
  price.recurring.interval!=="month"||price.recurring.interval_count!==1)return null;
 return {subscriptionId,customerId,status:value.status as typeof recurringStates[number]};
}
export function invoiceEvidence(value:unknown,expected:RecurringExpected,paid:boolean){
 if(!record(value)||!record(value.parent)||value.parent.type!=="subscription_details"||
  !record(value.parent.subscription_details))return null;
 const parent=value.parent.subscription_details;
 const invoiceId=providerIdentity(value,"in_"),subscriptionId=providerIdentity(parent.subscription,"sub_"),customerId=providerIdentity(value.customer,"cus_");
 if(!invoiceId||!subscriptionId||!customerId||!record(parent.metadata)||parent.metadata.recurringGiftId!==expected.id||
  !expected.subscriptionId||subscriptionId!==expected.subscriptionId||!expected.customerId||customerId!==expected.customerId||
  value.currency!==expected.currency||value.amount_due!==expected.amountMinor||value.total!==expected.amountMinor||
  !["subscription_create","subscription_cycle"].includes(String(value.billing_reason)))return null;
 if(!paid){
  if(value.status!=="open"||value.amount_paid!==0)return null;
  return {invoiceId,subscriptionId,customerId,paymentIntentId:null};
 }
 if(value.status!=="paid"||value.amount_paid!==expected.amountMinor||!record(value.payments)||
  value.payments.has_more!==false||!Array.isArray(value.payments.data)||value.payments.data.length!==1)return null;
 const payment=value.payments.data[0];
 if(!record(payment)||payment.status!=="paid"||payment.amount_paid!==expected.amountMinor||
  payment.currency!==expected.currency||!record(payment.payment)||payment.payment.type!=="payment_intent")return null;
 const paymentIntentId=providerIdentity(payment.payment.payment_intent,"pi_");
 return paymentIntentId?{invoiceId,subscriptionId,customerId,paymentIntentId}:null;
}

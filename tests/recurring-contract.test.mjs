import {test} from "node:test";
import assert from "node:assert/strict";
import {monthlyAmount,subscriptionEvidence,invoiceEvidence,providerIdentity} from "../staff-web/src/lib/recurring-contract.ts";
const expected={id:"gift_synthetic",amountMinor:2500,currency:"usd",customerId:"cus_synthetic",subscriptionId:"sub_synthetic"};
const subscription=()=>({id:"sub_synthetic",customer:"cus_synthetic",metadata:{recurringGiftId:expected.id},status:"active",items:{has_more:false,data:[{quantity:1,price:{currency:"usd",unit_amount:2500,recurring:{interval:"month",interval_count:1}}}]}});
const invoice=()=>({id:"in_synthetic",customer:"cus_synthetic",status:"paid",amount_paid:2500,amount_due:2500,total:2500,currency:"usd",billing_reason:"subscription_cycle",parent:{type:"subscription_details",subscription_details:{subscription:"sub_synthetic",metadata:{recurringGiftId:expected.id}}},payments:{has_more:false,data:[{status:"paid",amount_paid:2500,currency:"usd",payment:{type:"payment_intent",payment_intent:"pi_synthetic"}}]}});
test("monthly amounts use exact minor units and reject rounding, exponent and invalid values",()=>{
 for(const [s,cents] of [["1",100],["25.50",2550],["100000.00",10000000],[" 12.5 ",1250]])assert.equal(monthlyAmount(s),cents);
 for(const s of ["0","-1","0.999","1e3","0x20","Infinity","NaN","100000.01","","1,000","١٢","12.345"])
  assert.equal(monthlyAmount(s),null,s);
});
test("subscription mandate requires exact identity, USD amount, one monthly item and no trials",()=>{
 assert.equal(subscriptionEvidence(subscription(),expected).status,"active");
 const bad=[{...subscription(),customer:"cus_other"},{...subscription(),id:"sub_other"},{...subscription(),metadata:{}},{...subscription(),status:"trialing"}];
 for(const change of [{quantity:2},{price:{currency:"eur",unit_amount:2500,recurring:{interval:"month",interval_count:1}}},{price:{currency:"usd",unit_amount:2500,recurring:{interval:"year",interval_count:1}}},{price:{currency:"usd",unit_amount:2501,recurring:{interval:"month",interval_count:1}}}])bad.push({...subscription(),items:{data:[{...subscription().items.data[0],...change}],has_more:false}});
 bad.push({...subscription(),items:{data:subscription().items.data,has_more:true}});
 for(const value of bad)assert.equal(subscriptionEvidence(value,expected),null,JSON.stringify(value));
});
test("paid installments require a real linked payment intent, exact customer and invoice totals",()=>{
 const valid=invoiceEvidence(invoice(),expected,true);
 assert.equal(valid.paymentIntentId,"pi_synthetic");assert.equal(valid.invoiceId,"in_synthetic");
 const bad=[null,{}, {...invoice(),amount_paid:2499},{...invoice(),amount_due:2499},{...invoice(),total:2501},{...invoice(),status:"open"},{...invoice(),customer:"cus_other"},{...invoice(),payments:undefined},{...invoice(),payments:{data:[],has_more:false}},{...invoice(),billing_reason:"manual"}];
 bad.push({...invoice(),parent:{type:"subscription_details",subscription_details:{subscription:"sub_other",metadata:{recurringGiftId:expected.id}}}});
 bad.push({...invoice(),payments:{data:[{...invoice().payments.data[0],payment:{type:"payment_record",payment_record:"pr_fake"}}],has_more:false}});
 for(const value of bad)assert.equal(invoiceEvidence(value,expected,true),null,JSON.stringify(value));
});
test("failed invoices remain unreceipted and can later recover using the same stable invoice id",()=>{
 const failed={...invoice(),status:"open",amount_paid:0,payments:undefined};
 assert.equal(invoiceEvidence(failed,expected,false).paymentIntentId,null);
 assert.equal(invoiceEvidence(failed,expected,true),null);
 assert.equal(invoiceEvidence(invoice(),expected,true).invoiceId,failed.id);
});
test("provider identity parser never accepts non-provider identifiers or prototype values",()=>{
 assert.equal(providerIdentity({id:"sub_synthetic"},"sub_"),"sub_synthetic");
 for(const value of [null,{},"constructor","__proto__","sub_",{id:"pi_other"},"sub_bad\n"])
  assert.equal(providerIdentity(value,"sub_"),null);
});

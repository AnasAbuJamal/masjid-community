import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {monthlyAmount} from '../masjid-mobile/src/giving-contract.ts';
import {createScopedActionGate} from '../masjid-mobile/src/scoped-action-gate.ts';
import {givingWords} from '../masjid-mobile/src/i18n-giving.ts';
const checkout=readFileSync(new URL('../masjid-mobile/app/giving/[id].tsx',import.meta.url),'utf8');
const management=readFileSync(new URL('../masjid-mobile/app/giving/subscriptions.tsx',import.meta.url),'utf8');
test('monthly USD amounts parse exactly with inclusive limits',()=>{
 for(const [value,minor] of [['1',100],['1.0',100],['1.01',101],['25.99',2599],['100000.00',10000000]])assert.equal(monthlyAmount(value),minor);
 for(const value of ['', ' 25','25 ','.50','01','+1','-1','1e2','Infinity','NaN','1.001','0.99','100000.01','1000000','١٠','1,000'])assert.equal(monthlyAmount(value),null,value);
});
test('late checkout and cancellation receipts cannot survive account, mosque or unmount changes',()=>{
 const gate=createScopedActionGate();gate.bind('alice|mosque-a');const ticket=gate.begin();
 gate.bind('bob|mosque-b');assert.equal(gate.isCurrent(ticket),false);assert.equal(gate.finish(ticket),false);
 const current=gate.begin();assert.equal(gate.isCurrent(current),true);gate.invalidate();assert.equal(gate.isCurrent(current),false);
});
test('monthly entry requires enabled capability, terms and stable retry request key',()=>{
 assert.match(checkout,/recurring\.data\?\.enabled===true/);
 assert.match(checkout,/monthly\?monthlyAmount\(amount\)/);
 assert.match(checkout,/requestKey:intent\.current!\.requestKey/);
 assert.match(checkout,/intent\.current\?\.key!==expectedIntent/);
 assert.match(checkout,/termsVersion:"monthly-usd-v1",confirm:true/);
 assert.match(checkout,/currentIntent\.current!==expectedIntent/);
 assert.match(checkout,/gate\.current\.isCurrent\(ticket\).*currentScope\.current===expectedScope\)await Linking\.openURL/);
 assert.match(checkout,/\/giving\/subscriptions/);
});
test('management distinguishes provider cancellation and private final receipts, with cursor history',()=>{
 assert.match(management,/scopeRef\.current!==expectedScope/);
 assert.match(management,/cancellationOutcome\(gift.id,response\)/);
 assert.match(management,/hasFinalGivingReceipt\(invoice\)/);
 assert.match(management,/recurringPath\(selected.id,selected.cursor\)/);
 assert.match(management,/gatheringLocalTime\(value,null,data\?\.organization.timeZone,language\)/);
 assert.match(management,/user\?\.isVerified/);
});
test('English and Arabic terms explicitly disclose monthly amount, renewals and separate two-person refunds',()=>{
 for(const language of ['en','ar']){
  assert.ok(givingWords['giving.terms'][language].includes('{amount}'));
  assert.ok(givingWords['giving.cancelTerms'][language]);
 }
 assert.match(givingWords['giving.terms'].en,/every month until cancellation/);
 assert.match(givingWords['giving.terms'].en,/charges already initiated may finish/);
 assert.match(givingWords['giving.terms'].en,/one staff member to propose and another to approve/);
});

test('initial list and detail omit empty cursors while later pages preserve encoded cursors',async()=>{
 const {recurringPath}=await import('../masjid-mobile/src/giving-contract.ts');
 assert.equal(recurringPath(null,''),'donations/recurring');
 assert.equal(recurringPath('gift/one',''),'donations/recurring?giftId=gift%2Fone');
 assert.equal(recurringPath('gift/one','abc+12345'),'donations/recurring?giftId=gift%2Fone&cursor=abc%2B12345');
});
test('only coherent matching cancellation receipts claim provider cancellation',async()=>{
 const {cancellationOutcome}=await import('../masjid-mobile/src/giving-contract.ts');
 assert.equal(cancellationOutcome('g',{giftId:'g',status:'cancelled',cancelled:true,pending:false}),'cancelled');
 assert.equal(cancellationOutcome('g',{giftId:'g',status:'active',cancelled:false,pending:true}),'pending');
 for(const receipt of [
  {giftId:'other',status:'cancelled',cancelled:true,pending:false},
  {giftId:'g',status:'active',cancelled:true,pending:false},
  {giftId:'g',status:'cancelled',cancelled:true,pending:true},
  {giftId:'g',status:'active',cancelled:false,pending:false},
  {giftId:'g',status:'cancelled',cancelled:false,pending:true}
 ])assert.equal(cancellationOutcome('g',receipt),null);
});
test('unknown gift statuses have a neutral label and paid/refunded receipts can be opened',async()=>{
 const {giftStatusKey,hasFinalGivingReceipt}=await import('../masjid-mobile/src/giving-contract.ts');
 assert.equal(giftStatusKey('active'),'giving.status.active');
 assert.equal(giftStatusKey('future_provider_status'),'giving.status.unknown');
 assert.equal(giftStatusKey('toString'),'giving.status.unknown');
 for(const status of ['paid','refunded'])assert.equal(hasFinalGivingReceipt({status,receiptId:'receipt-one'}),true);
 for(const status of ['pending','failed','unknown'])assert.equal(hasFinalGivingReceipt({status,receiptId:'receipt-one'}),false);
 assert.equal(hasFinalGivingReceipt({status:'paid',receiptId:''}),false);
 assert.match(management,/router\.push\(\{pathname:"\/receipt\/\[id\]",params:\{id:invoice\.receiptId!/);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("payout investigations accept fixed, non-personal exception classifications only",()=>{
 const route=read("staff-web/src/app/api/v1/admin/payouts/route.ts");
 const fixed=read("staff-web/src/lib/payout-exceptions.ts");
 const ui=read("staff-web/src/app/admin/payouts/page.tsx");
 for(const category of ["bank_credit_unverified","provider_fee_breakdown_missing",
  "refund_or_dispute_unmatched","provider_transfer_failed",
  "bank_statement_evidence_missing","clearing_ledger_unmatched"]){
  assert.ok(fixed.includes('"'+category+'"'),category);
 }
 for(const token of ["z.enum(PAYOUT_EXCEPTION_CODES)",".strict()",
  "body:canonical","settlementCertified:false",
  "Prisma.TransactionIsolationLevel.Serializable",
  "EXCEPTION_ALREADY_RECORDED","payoutExceptionBody(input.reasonCode)"]){
  assert.ok(route.includes(token),token);
 }
 assert.ok(!route.includes("body:input.body"));
 assert.ok(!route.includes("body:z.string()"));
 assert.ok(ui.includes("PAYOUT_EXCEPTION_REASONS.map"));
 assert.ok(ui.includes("Record unresolved exception"));
 assert.ok(!ui.includes("<textarea"));
 assert.ok(route.includes("reconciliationReady:false"));
 assert.ok(fixed.includes("does not certify payout settlement"));
});
test("signed-payout integration tests reject free text, duplicates and PII-bearing extra fields",()=>{
 const src=read("staff-web/scripts/test-payout-register.mjs");
 for(const token of ["oldFreeText","bankAccount:\"do_not_store\"",
  "made_up_bank_confirmation","reasonCode","different.status,201",
  "settlementCertified===false","noteBody"]){
  assert.ok(src.includes(token),"Missing regression "+token);
 }
});

test("finance register explicitly flags truncated note history and concurrent submissions",()=>{
 const api=read("staff-web/src/app/api/v1/admin/payouts/route.ts");
 const ui=read("staff-web/src/app/admin/payouts/page.tsx");
 const smoke=read("staff-web/scripts/test-payout-register.mjs");
 for(const token of [
  'notes:{take:NOTE_PAGE_SIZE+1,orderBy:[{createdAt:"desc"},{id:"desc"}]',
  'notes:p.notes.slice(0,NOTE_PAGE_SIZE)',
  'notesComplete:p.notes.length<=NOTE_PAGE_SIZE','notesPageSize:NOTE_PAGE_SIZE'
 ])assert.ok(api.includes(token),"Missing honest history boundary: "+token);
 for(const token of ["!p.notesComplete","data.notesPageSize",
  "This review history is incomplete","loadOlder(p)"])
  assert.ok(ui.includes(token),"Missing incomplete-history UI: "+token);
 for(const token of ['const parallel=await Promise.all([','[201,409]',
  'historyPayout.notesComplete,false','auditAfter.length,3'])
  assert.ok(smoke.includes(token),"Missing concurrency/legacy history integration test: "+token);
});
test("private note pages bind cursor to an exact owned payout",()=>{
 const api=read("staff-web/src/app/api/v1/admin/payouts/route.ts");
 const ui=read("staff-web/src/app/admin/payouts/page.tsx");
 const smoke=read("staff-web/scripts/test-payout-register.mjs");
 for(const s of ['const notePage=z.object({',
  'id:input.payoutId,organizationId:org.id',
  'id:input.cursor,payoutId:payout.id',
  'NOTE_CURSOR_UNAVAILABLE','createdAt:{lt:pivot.createdAt}',
  'createdAt:pivot.createdAt,id:{lt:pivot.id}',
  'nextCursor:rows.length>NOTE_PAGE_SIZE?',
  'reconciliationReady:false'])
  assert.ok(api.includes(s),"Missing private cursor guard: "+s);
 for(const s of ['const [older,setOlder]','async function loadOlder(p:Payout)',
  'older[p.id]?.notes','older[p.id]?.complete'])
  assert.ok(ui.includes(s),"Missing on-demand finance history: "+s);
 for(const s of ['const firstPage=','const secondPage=',
  'new Set(fullHistory.map(n=>n.id)).size','foreignNote.id'])
  assert.ok(smoke.includes(s),"Missing cursor integration test: "+s);
});
test("F-031 finance register exposes bounded mosque-owned older payout pages",()=>{
 const api=read("staff-web/src/app/api/v1/admin/payouts/route.ts");
 const ui=read("staff-web/src/app/admin/payouts/page.tsx");
 for(const token of ["PAYOUT_PAGE_SIZE=100","PAYOUT_CURSOR_UNAVAILABLE",
  "id:registerCursor,organizationId:org.id","observedAt:{lt:anchor.observedAt}",
  "observedAt:anchor.observedAt,id:{lt:anchor.id}",
  "take:PAYOUT_PAGE_SIZE+1","payouts.slice(0,PAYOUT_PAGE_SIZE)",
  "nextRegisterCursor:payouts.length>PAYOUT_PAGE_SIZE?",
  'params.has("registerCursor")&&(params.has("payoutId")||params.has("cursor"))'])
  assert.ok(api.includes(token),"Missing scoped register pagination: "+token);
 for(const token of ["async function loadMorePayouts()","!data.complete",
  "Load next 100 older payouts","page.payouts.filter(p=>"])
  assert.ok(ui.includes(token),"Missing incomplete payout register control: "+token);
});

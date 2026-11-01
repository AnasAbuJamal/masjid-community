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

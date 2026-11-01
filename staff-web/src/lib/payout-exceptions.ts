// F-031: A *classification of an unresolved exception*, not a settlement
// determination. Public UI and server must share the same immutable mapping;
// accepting arbitrary bodies here would put donor/bank data into staff notes.
export const PAYOUT_EXCEPTION_REASONS=[
 {code:"bank_credit_unverified",label:"Actual bank credit is not independently verified"},
 {code:"provider_fee_breakdown_missing",label:"Processor fees and balance transactions are not independently matched"},
 {code:"refund_or_dispute_unmatched",label:"Refunds, disputes or adjustments require independent matching"},
 {code:"provider_transfer_failed",label:"Provider reports transfer failure or return; investigate bank outcome"},
 {code:"bank_statement_evidence_missing",label:"Independent bank statement evidence is unavailable"},
 {code:"clearing_ledger_unmatched",label:"Accounting clearing entries are not independently reconciled"}
] as const;
export const PAYOUT_EXCEPTION_CODES=PAYOUT_EXCEPTION_REASONS.map(x=>x.code) as [
 typeof PAYOUT_EXCEPTION_REASONS[number]["code"],
 ...typeof PAYOUT_EXCEPTION_REASONS[number]["code"][]
];
export type PayoutExceptionCode=typeof PAYOUT_EXCEPTION_CODES[number];
export function payoutExceptionBody(code:PayoutExceptionCode){
 const found=PAYOUT_EXCEPTION_REASONS.find(x=>x.code===code);
 if(!found)throw new Error("Unrecognized payout exception classification");
 return "Unresolved exception: "+found.label+". This note does not certify payout settlement.";
}

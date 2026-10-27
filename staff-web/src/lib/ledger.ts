import type {Prisma} from "@prisma/client";
import {HttpError} from "./http";
type DB=Prisma.TransactionClient;
type Kind="donation"|"tuition";
type Source={organizationId:string;sourceType:Kind;sourceId:string;amountMinor:number;currency:string;paymentIntentId:string|null};
export async function postVerifiedPayment(tx:DB,source:Source){
 const {organizationId,sourceType,sourceId,amountMinor,currency}=source;
 if(!organizationId||!Number.isSafeInteger(amountMinor)||amountMinor<=0||!["usd"].includes(currency))
  throw new HttpError(409,"INVALID_POSTING","Payment posting has invalid organization, amount or currency.");
 const incomeCode=sourceType==="donation"?"4000":"4100";
 const clearing=await tx.ledgerAccount.upsert({where:{organizationId_code_currency:{organizationId,code:"1100",currency}},
  update:{},create:{organizationId,code:"1100",name:"Payment provider clearing",currency}});
 const income=await tx.ledgerAccount.upsert({where:{organizationId_code_currency:{organizationId,code:incomeCode,currency}},
  update:{},create:{organizationId,code:incomeCode,name:sourceType==="donation"?"Donation revenue":"Tuition revenue",currency}});
 await tx.journalEntry.create({data:{organizationId,sourceType:sourceType+"_paid",sourceId,
  lines:{create:[{accountId:clearing.id,debitMinor:amountMinor,creditMinor:0},{accountId:income.id,debitMinor:0,creditMinor:amountMinor}]}}});
 return tx.paymentReceipt.create({data:{receiptNumber:"MC-"+sourceType.toUpperCase()+"-"+sourceId,
  sourceType,sourceId,amountMinor,currency,...(sourceType==="donation"?{donationId:sourceId}:{invoiceId:sourceId})}});
}
export async function reverseVerifiedPayment(tx:DB,source:Source){
 const {organizationId,sourceType,sourceId,amountMinor,currency}=source;
 const old=await tx.paymentReceipt.findUnique({where:{sourceType_sourceId:{sourceType,sourceId}}});
 if(!old||old.reversedAt)throw new HttpError(409,"RECEIPT_NOT_PAID","Refund does not match an unreversed verified receipt.");
 if(old.amountMinor!==amountMinor||old.currency!==currency)
  throw new HttpError(409,"REFUND_AMOUNT_MISMATCH","Full-refund amount does not match original payment.");
 const incomeCode=sourceType==="donation"?"4000":"4100";
 const [clearing,income]=await Promise.all([
  tx.ledgerAccount.findUniqueOrThrow({where:{organizationId_code_currency:{organizationId,code:"1100",currency}}}),
  tx.ledgerAccount.findUniqueOrThrow({where:{organizationId_code_currency:{organizationId,code:incomeCode,currency}}})
 ]);
 await tx.journalEntry.create({data:{organizationId,sourceType:sourceType+"_refund",sourceId,
  lines:{create:[{accountId:income.id,debitMinor:amountMinor,creditMinor:0},{accountId:clearing.id,debitMinor:0,creditMinor:amountMinor}]}}});
 await tx.paymentReceipt.update({where:{id:old.id},data:{reversedAt:new Date()}});
}

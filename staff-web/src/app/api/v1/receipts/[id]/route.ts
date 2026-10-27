import {NextRequest} from "next/server";
import {requireVerified} from "@/lib/auth";
import {db} from "@/lib/db";
import {handled,HttpError,ok} from "@/lib/http";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 return handled(async()=>{
  const user=await requireVerified(req);
  const {id}=await params;
  const receipt=await db.paymentReceipt.findUnique({where:{id},
   select:{id:true,receiptNumber:true,issuedAt:true,amountMinor:true,currency:true,sourceType:true,reversedAt:true,
    donation:{select:{donorId:true,campaign:{select:{title:true}}}},
    invoice:{select:{payerGuardianId:true,studentId:true,description:true}}}});
  if(!receipt)throw new HttpError(404,"NOT_FOUND","Receipt not found.");
  if(receipt.donation?.donorId!==user.id&&receipt.invoice?.payerGuardianId!==user.id)
   throw new HttpError(404,"NOT_FOUND","Receipt not found.");
  if(receipt.invoice){
   const link=await db.guardianLink.findUnique({where:{guardianId_studentId:{guardianId:user.id,studentId:receipt.invoice.studentId}}});
   if(!link?.approvedAt||link.revokedAt)throw new HttpError(403,"GUARDIAN_INACTIVE","Contact the school about access to this receipt.");
  }
  return ok({id:receipt.id,receiptNumber:receipt.receiptNumber,issuedAt:receipt.issuedAt,
   amountMinor:receipt.amountMinor,currency:receipt.currency,sourceType:receipt.sourceType,
   status:receipt.reversedAt?"refunded":"paid",description:receipt.donation?.campaign.title||receipt.invoice?.description});
 });
}

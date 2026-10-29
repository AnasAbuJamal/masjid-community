import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const actor=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const links=await db.guardianLink.findMany({where:{guardianId:actor.id,approvedAt:{not:null},revokedAt:null},select:{studentId:true}});
  const studentIds=links.map(x=>x.studentId);
  const invoices=studentIds.length?await db.schoolInvoice.findMany({
   where:{organizationId:org.id,studentId:{in:studentIds},payerGuardianId:actor.id},
   select:{id:true,studentId:true,description:true,amountMinor:true,currency:true,status:true,dueAt:true,paidAt:true,
    student:{select:{firstName:true,lastName:true}},receipt:{select:{id:true,receiptNumber:true,issuedAt:true,reversedAt:true}}},
   orderBy:{createdAt:"desc"},take:100
  }):[];
  return ok({invoices});
 });
}

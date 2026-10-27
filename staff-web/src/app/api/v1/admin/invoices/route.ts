import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {audit,requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const issue=z.object({studentId:z.string().min(8),payerGuardianId:z.string().min(8),
 description:z.string().trim().min(4).max(200),amountMinor:z.number().int().min(100).max(10000000),
 dueAt:z.iso.datetime()});
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","finance"]);
  const invoices=await db.schoolInvoice.findMany({take:100,orderBy:{createdAt:"desc"},
   select:{id:true,description:true,amountMinor:true,currency:true,status:true,dueAt:true,createdAt:true,payerGuardianId:true,
     student:{select:{id:true,firstName:true,lastName:true,studentNumber:true}}}});
  return ok({invoices,scope:"Latest 100 invoices; internal records, not bank balances."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const v=issue.parse(await jsonBody(req));
  const link=await db.guardianLink.findUnique({where:{guardianId_studentId:{guardianId:v.payerGuardianId,studentId:v.studentId}}});
  if(!link?.approvedAt||link.revokedAt)throw new HttpError(403,"GUARDIAN_NOT_LINKED","Choose an approved, active guardian for this student.");
  if(new Date(v.dueAt)<=new Date())throw new HttpError(422,"DUE_DATE","Due date must be in the future.");
  const item=await db.schoolInvoice.create({data:{
   studentId:v.studentId,payerGuardianId:v.payerGuardianId,description:v.description,
   amountMinor:v.amountMinor,currency:"usd",dueAt:new Date(v.dueAt)
  }});
  await audit(admin.id,"invoice.issue","SchoolInvoice",item.id);
  return ok({id:item.id,status:item.status},201);
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const {id}=z.object({id:z.string().min(8)}).parse(await jsonBody(req));
  const result=await db.schoolInvoice.updateMany({where:{id,status:"pending"},data:{status:"void"}});
  if(!result.count)throw new HttpError(409,"NOT_VOIDABLE","Only pending invoices may be voided.");
  await audit(admin.id,"invoice.void","SchoolInvoice",id);
  return ok({id,status:"void"});
 });
}

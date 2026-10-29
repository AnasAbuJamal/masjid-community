import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {audit,requireVerified} from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const issue=z.object({studentId:z.string().min(8),payerGuardianId:z.string().min(8),
 description:z.string().trim().min(4).max(200),amountMinor:z.number().int().min(100).max(10000000),
 dueAt:z.iso.datetime()});
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","finance"]);
  const org=await db.organization.findFirst();
  const invoices=await db.schoolInvoice.findMany({where:{organizationId:org?.id||"no_organization"},take:100,orderBy:{createdAt:"desc"},
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
  if(new Date(v.dueAt)<=new Date())throw new HttpError(422,"DUE_DATE","Due date must be in the future.");
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  const [link,student]=await Promise.all([
    db.guardianLink.findFirst({where:{guardianId:v.payerGuardianId,studentId:v.studentId,approvedAt:{not:null},revokedAt:null,
      guardian:{status:"active",verifiedAt:{not:null},memberships:{some:{organizationId:org.id,status:"active"}}}}}),
    db.student.findFirst({where:{id:v.studentId,...schoolStudentScope(org.id),
      enrollments:{some:{status:"active",classSection:{program:{organizationId:org.id}}}}}})
  ]);
  if(!student)throw new HttpError(403,"WRONG_ORGANIZATION","Student is not actively enrolled in this organization's school.");
  if(!link)throw new HttpError(403,"GUARDIAN_NOT_LINKED","Choose an approved, active guardian of this organization.");
  const item=await db.schoolInvoice.create({data:{
   organizationId:org.id,studentId:v.studentId,payerGuardianId:v.payerGuardianId,description:v.description,
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
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization is not configured.");
  const result=await db.schoolInvoice.updateMany({where:{id,organizationId:org.id,status:"pending"},data:{status:"void"}});
  if(!result.count)throw new HttpError(409,"NOT_VOIDABLE","Only pending invoices may be voided.");
  await audit(admin.id,"invoice.void","SchoolInvoice",id);
  return ok({id,status:"void"});
 });
}

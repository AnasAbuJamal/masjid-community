import { NextRequest } from "next/server";
import { requireVerified } from "@/lib/auth";
import { db } from "@/lib/db";
import { handled, HttpError, ok } from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","finance"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const paid=await db.donation.findMany({where:{status:"paid",campaign:{organizationId:org.id}},take:500,orderBy:{createdAt:"desc"},
   select:{id:true,amountMinor:true,currency:true,createdAt:true,anonymous:true,campaign:{select:{title:true}}}});
  const totals=paid.reduce<Record<string,number>>((acc,row)=>{acc[row.currency]=(acc[row.currency]||0)+row.amountMinor;return acc;},{});
  return ok({payments:paid,loaded:paid.length,totalsMinor:totals,complete:false,
   caution:"This lists up to 500 verified payment records. It is not a reconciled accounting statement or bank balance."});
 });
}

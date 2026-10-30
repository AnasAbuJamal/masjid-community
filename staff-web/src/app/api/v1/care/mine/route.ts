import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const requests=await db.careRequest.findMany({where:{
   requesterId:user.id,organizationId:org.id
  },orderBy:{createdAt:"desc"},take:50,
  select:{reference:true,status:true,createdAt:true,closedAt:true}});
  return ok({requests,policy:"Private references and statuses only. Confidential request text never appears in ordinary account activity."});
 });
}

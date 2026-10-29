import {NextRequest} from "next/server";
import {requireVerified} from "@/lib/auth";
import {db} from "@/lib/db";
import {handled,HttpError,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const shifts=await db.volunteerShift.findMany({where:{userId:user.id,opportunity:{organizationId:org.id}},take:100,orderBy:{startAt:"desc"},
   select:{id:true,startAt:true,endAt:true,checkedInAt:true,status:true,opportunity:{select:{title:true}}}});
  return ok({shifts});
 });
}

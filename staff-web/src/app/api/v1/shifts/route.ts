import {NextRequest} from "next/server";
import {requireVerified} from "@/lib/auth";
import {db} from "@/lib/db";
import {handled,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const shifts=await db.volunteerShift.findMany({where:{userId:user.id},take:100,orderBy:{startAt:"desc"},
   select:{id:true,startAt:true,endAt:true,checkedInAt:true,status:true,opportunity:{select:{title:true}}}});
  return ok({shifts});
 });
}

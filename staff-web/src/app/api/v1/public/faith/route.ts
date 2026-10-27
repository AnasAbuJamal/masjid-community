import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {handled,ok,localDate} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const org=await db.organization.findFirst();
  if(!org)return ok({organization:null,notices:[],policy:"Dates are displayed only after mosque confirmation."});
  const before=localDate(new Date(Date.now()-14*86400000),org.timeZone);
  const notices=await db.faithNotice.findMany({where:{organizationId:org.id,status:"published",approvedById:{not:null},localDate:{gte:before},publishedAt:{lte:new Date()}},
   take:40,orderBy:{localDate:"asc"},select:{id:true,kind:true,localDate:true,title:true,body:true,publishedAt:true,revision:true}});
  return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},notices,
   policy:"Ramadan, Eid and moon-sighting dates are mosque-confirmed announcements, not automatic astronomical predictions."});
 });
}

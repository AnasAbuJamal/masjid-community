import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import { handled, ok } from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req,["teacher","admin"]);
  const classes=await db.classSection.findMany({
   where:user.role==="admin"?{}:{teachers:{some:{teacherId:user.id}}},
   take:100,
   select:{id:true,name:true,schedule:true,
     enrollments:{where:{status:"active"},select:{student:{select:{id:true,firstName:true,lastName:true}}}},
     sessions:{take:20,orderBy:{startsAt:"desc"},select:{id:true,startsAt:true,attendance:{select:{studentId:true,status:true}}}},
   }
  });
  return ok({classes});
 });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import { handled, ok } from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req,["teacher","admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)return ok({classes:[]});
  const classes=await db.classSection.findMany({
   where:{program:{organizationId:org.id},...(user.role==="admin"?{}:{teachers:{some:{teacherId:user.id}}})},
   take:100,
   select:{id:true,name:true,schedule:true,
     enrollments:{where:{status:"active",student:schoolStudentScope(org.id)},select:{student:{select:{id:true,firstName:true,lastName:true}}}},
     sessions:{take:20,orderBy:{startsAt:"desc"},select:{id:true,startsAt:true,attendance:{where:{student:schoolStudentScope(org.id)},select:{studentId:true,status:true,revision:true,markedAt:true,correctedAt:true}}}},
   }
  });
  return ok({classes});
 });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import { handled, ok } from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const [guardianLinks,self,teaching]=await Promise.all([
    db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null},select:{student:{select:{
      id:true,firstName:true,lastName:true,enrollments:{where:{status:"active"},select:{classSection:{select:{id:true,name:true,schedule:true}},classId:true}},
      attendance:{take:15,select:{id:true,status:true,session:{select:{startsAt:true,classSection:{select:{name:true}}}}}},
    }}}}),
    db.student.findUnique({where:{userId:user.id},select:{id:true,firstName:true,lastName:true,enrollments:{select:{classSection:{select:{id:true,name:true,schedule:true}}}}}}),
    db.teacherAssignment.findMany({where:{teacherId:user.id},select:{classSection:{select:{id:true,name:true,schedule:true,enrollments:{select:{student:{select:{id:true,firstName:true,lastName:true}}}}}}}})
  ]);
  return ok({children:guardianLinks.map(x=>x.student),student:self,teaching:teaching.map(x=>x.classSection)});
 });
}

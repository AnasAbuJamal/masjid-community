import { NextRequest } from "next/server";
import {schoolStudentScope} from "@/lib/school-scope";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import { handled, HttpError, ok } from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const studentScope=schoolStudentScope(org.id);
  const [guardianLinks,self,teaching]=await Promise.all([
    db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null,student:studentScope},select:{student:{select:{
      id:true,firstName:true,lastName:true,
      enrollments:{where:{status:"active",classSection:{program:{organizationId:org.id}}},select:{classSection:{select:{id:true,name:true,schedule:true}},classId:true}},
      waitlist:{where:{status:"waiting",classSection:{program:{organizationId:org.id}}},
       orderBy:[{requestedAt:"asc"},{id:"asc"}],take:30,
       select:{id:true,status:true,requestedAt:true,
        classSection:{select:{id:true,name:true,schedule:true}}}},
      attendance:{where:{session:{classSection:{program:{organizationId:org.id}}}},take:15,orderBy:{session:{startsAt:"desc"}},select:{id:true,status:true,session:{select:{startsAt:true,classSection:{select:{name:true}}}}}},
    }}}}),
    db.student.findFirst({where:{userId:user.id,...studentScope},select:{id:true,firstName:true,lastName:true,
     enrollments:{where:{status:"active",classSection:{program:{organizationId:org.id}}},select:{classSection:{select:{id:true,name:true,schedule:true}}}}}}),
    db.teacherAssignment.findMany({where:{teacherId:user.id,classSection:{program:{organizationId:org.id}}},select:{classSection:{select:{id:true,name:true,schedule:true,
     enrollments:{where:{status:"active",student:studentScope},select:{student:{select:{id:true,firstName:true,lastName:true}}}}}}}})
  ]);
  return ok({children:guardianLinks.map(x=>x.student),student:self,teaching:teaching.map(x=>x.classSection)});
 });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handled, HttpError, ok } from "@/lib/http";
import { requireVerified } from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [donations,rsvps,notifications,children,classes,bookings,volunteerApplications,jobApplications]=await Promise.all([
    db.donation.findMany({where:{donorId:user.id},orderBy:{createdAt:"desc"},take:30,select:{id:true,amountMinor:true,currency:true,status:true,createdAt:true,campaign:{select:{title:true}},receipt:{select:{id:true,receiptNumber:true,issuedAt:true,reversedAt:true}}}}),
    db.eventRSVP.findMany({where:{userId:user.id},include:{event:{select:{id:true,title:true,startAt:true}}},take:30}),
    db.notification.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:30}),
    db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null,
      student:schoolStudentScope(org.id)},
      select:{student:{select:{id:true,firstName:true,lastName:true,
       enrollments:{where:{status:"active",classSection:{program:{organizationId:org.id}}},
        select:{classSection:{select:{name:true}}}}}}}}),
    db.teacherAssignment.findMany({where:{teacherId:user.id,classSection:{program:{organizationId:org.id}}},select:{classSection:{select:{id:true,name:true,schedule:true}}}}),
    db.rentalBooking.findMany({where:{userId:user.id},take:25,orderBy:{startAt:"desc"},select:{id:true,status:true,startAt:true,endAt:true,resource:{select:{title:true}}}}),
    db.volunteerApplication.findMany({where:{userId:user.id},take:25,select:{id:true,status:true,opportunity:{select:{title:true}}}}),
    db.jobApplication.findMany({where:{userId:user.id},take:25,select:{id:true,status:true,job:{select:{title:true}}}})
  ]);
  return ok({user:{id:user.id,name:user.firstName+" "+user.lastName,email:user.email,role:user.role,verified:!!user.verifiedAt},donations,rsvps,notifications,children,classes,bookings,volunteerApplications,jobApplications});
 });
}

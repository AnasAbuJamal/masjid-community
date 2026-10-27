import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handled, ok } from "@/lib/http";
import { requireVerified } from "@/lib/auth";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const [donations,rsvps,notifications,children,classes,bookings,volunteerApplications,jobApplications]=await Promise.all([
    db.donation.findMany({where:{donorId:user.id},orderBy:{createdAt:"desc"},take:30,select:{id:true,amountMinor:true,currency:true,status:true,createdAt:true,campaign:{select:{title:true}},receipt:{select:{id:true,receiptNumber:true,issuedAt:true,reversedAt:true}}}}),
    db.eventRSVP.findMany({where:{userId:user.id},include:{event:{select:{id:true,title:true,startAt:true}}},take:30}),
    db.notification.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:30}),
    db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null},select:{student:{select:{id:true,firstName:true,lastName:true,enrollments:{include:{classSection:{select:{name:true}}}}}}}}),
    db.teacherAssignment.findMany({where:{teacherId:user.id},select:{classSection:{select:{id:true,name:true,schedule:true}}}}),
    db.rentalBooking.findMany({where:{userId:user.id},take:25,orderBy:{startAt:"desc"},select:{id:true,status:true,startAt:true,endAt:true,resource:{select:{title:true}}}}),
    db.volunteerApplication.findMany({where:{userId:user.id},take:25,select:{id:true,status:true,opportunity:{select:{title:true}}}}),
    db.jobApplication.findMany({where:{userId:user.id},take:25,select:{id:true,job:{select:{title:true}}}})
  ]);
  return ok({user:{id:user.id,name:user.firstName+" "+user.lastName,email:user.email,role:user.role,verified:!!user.verifiedAt},donations,rsvps,notifications,children,classes,bookings,volunteerApplications,jobApplications});
 });
}

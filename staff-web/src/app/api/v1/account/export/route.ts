import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const [rsvps,donations,jobApplications,volunteering,bookings,proposals]=await Promise.all([
   db.eventRSVP.findMany({where:{userId:user.id},take:200,select:{createdAt:true,event:{select:{title:true,startAt:true}}}}),
   db.donation.findMany({where:{donorId:user.id},take:200,select:{amountMinor:true,currency:true,status:true,createdAt:true,campaign:{select:{title:true}}}}),
   db.jobApplication.findMany({where:{userId:user.id},take:200,select:{job:{select:{title:true}},coverLetter:true}}),
   db.volunteerApplication.findMany({where:{userId:user.id},take:200,select:{status:true,opportunity:{select:{title:true}}}}),
   db.rentalBooking.findMany({where:{userId:user.id},take:200,select:{status:true,startAt:true,endAt:true,resource:{select:{title:true}}}}),
   db.proposal.findMany({where:{submittedById:user.id},take:200,select:{title:true,description:true,status:true}})
  ]);
  return ok({exportedAt:new Date().toISOString(),scope:"Account-owner export, limited to 200 records per category. Student/guardian exports require an additional safeguarded process.",
   account:{email:user.email,firstName:user.firstName,lastName:user.lastName},
   eventRegistrations:rsvps,donations,jobApplications,volunteerApplications:volunteering,rentalBookings:bookings,proposals});
 });
}

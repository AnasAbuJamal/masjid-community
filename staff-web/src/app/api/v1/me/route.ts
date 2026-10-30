import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handled, HttpError, ok } from "@/lib/http";
import { requireMemberContext } from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org}=await requireMemberContext(req);
  const now=new Date();
  const [donations,rsvps,notifications,children,classes,bookings,volunteerApplications,jobApplications,
   nextGatherings,nextShifts]=await Promise.all([
    db.donation.findMany({where:{donorId:user.id,campaign:{organizationId:org.id}},orderBy:{createdAt:"desc"},take:30,select:{id:true,amountMinor:true,currency:true,status:true,createdAt:true,campaign:{select:{title:true}},receipt:{select:{id:true,receiptNumber:true,issuedAt:true,reversedAt:true}}}}),
    db.eventRSVP.findMany({where:{userId:user.id,event:{organizationId:org.id}},include:{event:{select:{id:true,title:true,startAt:true}}},take:30}),
    db.notification.findMany({where:{userId:user.id,organizationId:org.id},orderBy:{createdAt:"desc"},take:30}),
    db.guardianLink.findMany({where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null,
      student:schoolStudentScope(org.id)},
      select:{student:{select:{id:true,firstName:true,lastName:true,
       enrollments:{where:{status:"active",classSection:{program:{organizationId:org.id}}},
        select:{classSection:{select:{name:true}}}}}}}}),
    db.teacherAssignment.findMany({where:{teacherId:user.id,classSection:{program:{organizationId:org.id}}},select:{classSection:{select:{id:true,name:true,schedule:true}}}}),
    db.rentalBooking.findMany({where:{userId:user.id,resource:{organizationId:org.id}},take:25,orderBy:{startAt:"desc"},select:{id:true,status:true,startAt:true,endAt:true,resource:{select:{title:true}}}}),
    db.volunteerApplication.findMany({where:{userId:user.id,opportunity:{organizationId:org.id}},take:25,select:{id:true,status:true,opportunity:{select:{title:true}}}}),
    db.jobApplication.findMany({where:{userId:user.id,job:{organizationId:org.id}},take:25,select:{id:true,status:true,job:{select:{title:true}}}}),
    // Upcoming commitments are own-identity, tenant-bound, verified published
    // gatherings or scheduled service shifts. A waitlist is never confirmed.
    db.eventRSVP.findMany({where:{userId:user.id,
     event:{organizationId:org.id,status:"published",startAt:{gte:now}}},
     orderBy:[{event:{startAt:"asc"}},{id:"asc"}],take:12,
     select:{id:true,status:true,checkedInAt:true,event:{select:{
      id:true,title:true,startAt:true
     }}}}),
    db.volunteerShift.findMany({where:{userId:user.id,status:"scheduled",
     startAt:{gte:now},opportunity:{organizationId:org.id}},
     orderBy:[{startAt:"asc"},{id:"asc"}],take:12,
     select:{id:true,startAt:true,status:true,opportunity:{select:{title:true}}}})
  ]);
  const upcoming=[
   ...nextGatherings.map(r=>({id:r.id,kind:"gathering" as const,title:r.event.title,
    eventId:r.event.id,startAt:r.event.startAt,status:r.status==="waitlisted"?"waitlisted":
     r.checkedInAt?"checked_in":r.status==="confirmed"?"confirmed":r.status})),
   ...nextShifts.map(s=>({id:s.id,kind:"service_shift" as const,title:s.opportunity.title,
    startAt:s.startAt,status:s.status}))
  ].sort((a,b)=>a.startAt.getTime()-b.startAt.getTime()||a.id.localeCompare(b.id)).slice(0,12);
  return ok({organization:org,user:{id:user.id,name:user.firstName+" "+user.lastName,email:user.email,role:user.role,verified:!!user.verifiedAt},upcoming,donations,rsvps,notifications,children,classes,bookings,volunteerApplications,jobApplications});
 });
}

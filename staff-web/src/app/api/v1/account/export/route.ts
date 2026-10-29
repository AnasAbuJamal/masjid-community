import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";

// This endpoint exports ONLY records held by the active mosque. The shared
// identity (name/email) belongs to the account holder, not to a tenant.
// A complete multi-organization data request requires separately authorized
// export for each organization, not a one-click cross-tenant data join.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [rsvps,donations,jobApplications,volunteering,bookings,proposals]=await Promise.all([
   db.eventRSVP.findMany({where:{userId:user.id,event:{organizationId:org.id}},
    take:200,orderBy:{createdAt:"desc"},
    select:{createdAt:true,status:true,checkedInAt:true,event:{select:{title:true,startAt:true}}}}),
   db.donation.findMany({where:{donorId:user.id,campaign:{organizationId:org.id}},
    take:200,orderBy:{createdAt:"desc"},
    select:{amountMinor:true,currency:true,status:true,createdAt:true,campaign:{select:{title:true}}}}),
   db.jobApplication.findMany({where:{userId:user.id,job:{organizationId:org.id}},
    take:200,orderBy:{createdAt:"desc"},
    select:{job:{select:{title:true}},coverLetter:true}}),
   db.volunteerApplication.findMany({where:{userId:user.id,opportunity:{organizationId:org.id}},
    take:200,orderBy:{createdAt:"desc"},
    select:{status:true,opportunity:{select:{title:true}}}}),
   db.rentalBooking.findMany({where:{userId:user.id,resource:{organizationId:org.id}},
    take:200,orderBy:{startAt:"desc"},
    select:{status:true,startAt:true,endAt:true,resource:{select:{title:true}}}}),
   db.proposal.findMany({where:{submittedById:user.id,organizationId:org.id},
    take:200,orderBy:{createdAt:"desc"},
    select:{title:true,description:true,status:true}})
  ]);
  return ok({
   exportedAt:new Date().toISOString(),
   organization:{id:org.id,name:org.name},
   scope:"Current mosque only; at most 200 records per category. This is NOT a complete multi-organization, student, guardian, or finance-provider data export. Request a separately safeguarded review for missing records.",
   account:{email:user.email,firstName:user.firstName,lastName:user.lastName},
   eventRegistrations:rsvps,donations,jobApplications,
   volunteerApplications:volunteering,rentalBookings:bookings,proposals
  });
 });
}

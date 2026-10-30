import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified,checkLoginThrottle,checkPassword,recordFailedLogin,clearLoginThrottle,sessionFrom,tokenHash} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

// This endpoint exports ONLY records held by the active mosque. The shared
// identity (name/email) belongs to the account holder, not to a tenant.
// A complete multi-organization data request requires separately authorized
// export for each organization, not a one-click cross-tenant data join.
const exportRequest=z.object({password:z.string().min(1).max(128),confirm:z.literal(true)});

// Fail closed: private exports may not be retrieved via GET, from prefetch,
// an old browser tab or an authenticated bearer token without reauthentication.
export async function GET(){
 return handled(async()=>{throw new HttpError(405,"EXPORT_REAUTH_REQUIRED","A private export requires explicit consent and recent account reauthentication.");});
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const input=exportRequest.parse(await jsonBody(req));
  await checkLoginThrottle(user.email);
  try{await checkPassword(user.email,input.password);}
  catch(error){await recordFailedLogin(user.email);throw error;}
  await clearLoginThrottle(user.email);
  if(user.mfaEnabled){
   const current=await db.authSession.findFirst({where:{
    userId:user.id,tokenHash:tokenHash(sessionFrom(req)),revokedAt:null,
    expiresAt:{gt:new Date()},mfaVerifiedAt:{gt:new Date(Date.now()-10*60000)}
   },select:{id:true}});
   if(!current)throw new HttpError(403,"EXPORT_MFA_STEP_UP",
    "Verify your authenticator again before exporting private records.");
  }
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  // Count completed exports by this actor, without retaining any export content.
  const recent=await db.auditEvent.count({where:{actorId:user.id,action:"account.export.read",
   occurredAt:{gt:new Date(Date.now()-3600000)}}});
  if(recent>=3)throw new HttpError(429,"EXPORT_RATE_LIMIT","Too many private exports. Try again later.");
  const [rsvps,donations,jobApplications,volunteering,bookings,proposals,circles,careReferences]=await Promise.all([
   db.eventRSVP.findMany({where:{userId:user.id,event:{organizationId:org.id}},
    take:201,orderBy:{createdAt:"desc"},
    select:{createdAt:true,status:true,checkedInAt:true,event:{select:{title:true,startAt:true}}}}),
   db.donation.findMany({where:{donorId:user.id,campaign:{organizationId:org.id}},
    take:201,orderBy:{createdAt:"desc"},
    select:{amountMinor:true,currency:true,status:true,createdAt:true,campaign:{select:{title:true}}}}),
   db.jobApplication.findMany({where:{userId:user.id,job:{organizationId:org.id}},
    take:201,orderBy:{id:"desc"},
    select:{job:{select:{title:true}},coverLetter:true}}),
   db.volunteerApplication.findMany({where:{userId:user.id,opportunity:{organizationId:org.id}},
    take:201,orderBy:{id:"desc"},
    select:{status:true,opportunity:{select:{title:true}}}}),
   db.rentalBooking.findMany({where:{userId:user.id,resource:{organizationId:org.id}},
    take:201,orderBy:{startAt:"desc"},
    select:{status:true,startAt:true,endAt:true,resource:{select:{title:true}}}}),
   db.proposal.findMany({where:{submittedById:user.id,organizationId:org.id},
    take:201,orderBy:{id:"desc"},
    select:{title:true,description:true,status:true}}),
   db.circleMember.findMany({where:{userId:user.id,circle:{organizationId:org.id}},
    take:201,orderBy:{requestedAt:"desc"},
    select:{status:true,requestedAt:true,reviewedAt:true,circle:{select:{title:true}}}}),
   db.careRequest.findMany({where:{organizationId:org.id,requesterId:user.id},
    take:201,orderBy:{createdAt:"desc"},select:{reference:true,status:true,createdAt:true,closedAt:true}})
  ]);
  const lists={eventRegistrations:rsvps,donations,jobApplications,
   volunteerApplications:volunteering,rentalBookings:bookings,proposals,
   circleMemberships:circles,careRequestReferences:careReferences};
  const limited=Object.fromEntries(Object.entries(lists).map(([key,items])=>[key,items.slice(0,200)]));
  const truncatedCategories=Object.entries(lists).filter(([,items])=>items.length>200).map(([key])=>key);
  await db.auditEvent.create({data:{actorId:user.id,action:"account.export.read",
   entity:"Organization",entityId:org.id,
   detail:JSON.stringify({organizationId:org.id,categories:Object.keys(lists),truncatedCategories})}});
  return ok({
   exportedAt:new Date().toISOString(),
   organization:{id:org.id,name:org.name},
   scope:"Current mosque only. Up to 200 records per category; incomplete categories are explicitly flagged. School/child records, detailed confidential-care narratives, other organizations and payment-provider data require separate safeguarded handling.",
   truncatedCategories,complete:truncatedCategories.length===0,
   exclusions:["student and guardianship records","care narratives","finance-provider account data","other organizations"],
   account:{email:user.email,firstName:user.firstName,lastName:user.lastName},
   ...limited
  });
 });
}

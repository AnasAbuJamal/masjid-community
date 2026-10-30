import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireVerified, audit } from "@/lib/auth";
import { assertSameOrigin, handled, HttpError, jsonBody, ok } from "@/lib/http";
import {GATHERING_CATEGORIES,GATHERING_AUDIENCES,GATHERING_ACCESSIBILITY} from "@/lib/gathering-filters";

const name=z.string().trim().min(3).max(150);
const description=z.string().trim().min(10).max(4000);
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("announcement"),title:name,body:description,urgent:z.boolean().default(false),published:z.boolean().default(false)}),
 z.object({kind:z.literal("event"),title:name,description,location:z.string().trim().min(3).max(200),startAt:z.iso.datetime(),endAt:z.iso.datetime(),
  venueId:z.string().min(8).max(128).optional(),
  category:z.enum(GATHERING_CATEGORIES).optional(),audience:z.enum(GATHERING_AUDIENCES).optional(),
  accessibilityFeatures:z.array(z.enum(GATHERING_ACCESSIBILITY)).max(3)
   .refine(x=>x.length===new Set(x).size,"Each accommodation must be unique.").default([]),
  accessibilityNotes:z.string().trim().min(5).max(500).optional(),
  rsvpDeadlineAt:z.iso.datetime().optional(),cancellationDeadlineAt:z.iso.datetime().optional(),
  cancellationTerms:z.string().trim().min(10).max(1000).optional(),
  capacity:z.number().int().positive().optional(),waitlistEnabled:z.boolean().default(false),published:z.boolean().default(false)}),
 z.object({kind:z.literal("program"),title:name,description,published:z.boolean().default(false)}),
 z.object({kind:z.literal("campaign"),title:name,purpose:description,goalMinor:z.number().int().positive().optional(),published:z.boolean().default(false)}),
 z.object({kind:z.literal("volunteer"),title:name,description,startsAt:z.iso.datetime(),capacity:z.number().int().positive(),published:z.boolean().default(false)}),
 z.object({kind:z.literal("job"),title:name,description,company:z.string().trim().min(2).max(150),published:z.boolean().default(false)}),
 z.object({kind:z.literal("proposal"),title:name,description,published:z.boolean().default(false)}),
 z.object({kind:z.literal("rental"),title:name,description,published:z.boolean().default(false)}),
 z.object({kind:z.literal("article"),title:name,body:description,published:z.boolean().default(false)}),
 z.object({kind:z.literal("construction"),title:name,description,goalMinor:z.number().int().positive().optional(),published:z.boolean().default(false)}),
 z.object({kind:z.literal("milestone"),projectId:z.string().min(8),title:name,description,
  completedAt:z.iso.datetime().optional(),published:z.boolean().default(false)}),
 z.object({kind:z.literal("volunteer-decision"),applicationId:z.string().min(8),decision:z.enum(["approved","declined"])}),
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true,name:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  // Every overview count, child row and staff application is tenant-scoped.
  // Never query global totals before resolving the administrator's mosque.
  const [counts,venues,prayers,announcements,events,applications,construction]=await Promise.all([
    Promise.all([
      db.user.count({where:{memberships:{some:{organizationId:org.id,status:"active"}}}}),
      db.event.count({where:{organizationId:org.id}}),
      db.announcement.count({where:{organizationId:org.id}}),
      db.schoolProgram.count({where:{organizationId:org.id}}),
      db.donation.count({where:{campaign:{organizationId:org.id}}})
    ]),
    db.venue.findMany({where:{organizationId:org.id},take:10,select:{id:true,name:true,timeZone:true}}),
    db.prayerDay.findMany({where:{venue:{organizationId:org.id}},take:12,orderBy:{localDate:"desc"}}),
    db.announcement.findMany({where:{organizationId:org.id},take:12,orderBy:{createdAt:"desc"}}),
    db.event.findMany({where:{organizationId:org.id},take:12,orderBy:{startAt:"desc"}}),
    db.volunteerApplication.findMany({where:{opportunity:{organizationId:org.id}},take:15,
      include:{opportunity:{select:{title:true}},user:{select:{firstName:true,lastName:true}}}}),
    db.constructionProject.findMany({where:{organizationId:org.id},take:100,
      orderBy:{createdAt:"desc"},select:{id:true,title:true,status:true}})
  ]);
  return ok({organization:org&&{id:org.id,name:org.name},counts:{users:counts[0],events:counts[1],announcements:counts[2],programs:counts[3],donations:counts[4]},venues,prayers,announcements,events,applications,construction,role:user.role});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin"]);
  const body=await jsonBody(req);
  if(body&&typeof body==="object"&&!Array.isArray(body)&&("kind" in body)&&body.kind==="prayer")
   throw new HttpError(409,"PRAYER_REVIEW_REQUIRED","Use the prayer review workflow. Direct schedule publication is disabled.");
  const input=schema.parse(body);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  let result:{id:string};
  if(input.kind==="announcement"){
    result=await db.announcement.create({data:{organizationId:org.id,title:input.title,body:input.body,kind:input.urgent?"urgent":"general",status:input.published?"published":"draft",publishedAt:input.published?new Date():null}});
  }else if(input.kind==="event"){
    if(input.venueId&&!await db.venue.findFirst({where:{
      id:input.venueId,organizationId:org.id},select:{id:true}}))
     throw new HttpError(404,"VENUE_NOT_FOUND","The selected venue belongs to another mosque or is unavailable.");
    const startAt=new Date(input.startAt),endAt=new Date(input.endAt);
    if(endAt<=startAt)throw new HttpError(422,"INVALID_TIME","End date must be after start date.");
    if((input.rsvpDeadlineAt&&new Date(input.rsvpDeadlineAt)>startAt)||
       (input.cancellationDeadlineAt&&new Date(input.cancellationDeadlineAt)>startAt))
      throw new HttpError(422,"INVALID_DEADLINE","RSVP and cancellation cutoffs must not be later than the gathering start.");
    result=await db.event.create({data:{organizationId:org.id,title:input.title,description:input.description,
      location:input.location,startAt,endAt,capacity:input.capacity,
      venueId:input.venueId||null,category:input.category||null,
      audience:input.audience||null,accessibilityFeatures:input.accessibilityFeatures,
      accessibilityNotes:input.accessibilityNotes||null,
      rsvpDeadlineAt:input.rsvpDeadlineAt?new Date(input.rsvpDeadlineAt):null,
      cancellationDeadlineAt:input.cancellationDeadlineAt?new Date(input.cancellationDeadlineAt):null,
      cancellationTerms:input.cancellationTerms||null,
      waitlistEnabled:input.waitlistEnabled,status:input.published?"published":"draft"}});
  }else if(input.kind==="program"){
    result=await db.schoolProgram.create({data:{organizationId:org.id,title:input.title,description:input.description,published:input.published}});
  }else if(input.kind==="campaign"){
    result=await db.donationCampaign.create({data:{organizationId:org.id,title:input.title,purpose:input.purpose,goalMinor:input.goalMinor,published:input.published}});
  }else if(input.kind==="volunteer"){
    result=await db.volunteerOpportunity.create({data:{organizationId:org.id,title:input.title,description:input.description,startsAt:new Date(input.startsAt),capacity:input.capacity,published:input.published}});
  }else if(input.kind==="job"){
    result=await db.jobPosting.create({data:{organizationId:org.id,title:input.title,description:input.description,company:input.company,status:input.published?"published":"draft"}});
  }else if(input.kind==="proposal"){
    result=await db.proposal.create({data:{organizationId:org.id,title:input.title,description:input.description,status:input.published?"published":"draft"}});
  }else if(input.kind==="article"){
    result=await db.communityArticle.create({data:{organizationId:org.id,title:input.title,body:input.body,
      status:input.published?"published":"draft",publishedAt:input.published?new Date():null}});
  }else if(input.kind==="construction"){
    result=await db.constructionProject.create({data:{organizationId:org.id,title:input.title,description:input.description,
      goalMinor:input.goalMinor,status:input.published?"published":"draft",publishedAt:input.published?new Date():null}});
  }else if(input.kind==="milestone"){
    const project=await db.constructionProject.findFirst({where:{id:input.projectId,organizationId:org.id}});
    if(!project)throw new HttpError(404,"PROJECT_MISSING","Construction project not found.");
    result=await db.constructionMilestone.create({data:{projectId:project.id,title:input.title,description:input.description,
      completedAt:input.completedAt?new Date(input.completedAt):null,
      status:input.published?"published":"draft",publishedAt:input.published?new Date():null}});
  }else if(input.kind==="rental"){
    result=await db.rentalResource.create({data:{organizationId:org.id,title:input.title,description:input.description,published:input.published}});
  }else{
    const app=await db.volunteerApplication.findFirst({where:{
      id:input.applicationId,opportunity:{organizationId:org.id}
    },include:{opportunity:true}});
    if(!app)throw new HttpError(404,"NOT_FOUND","Application unavailable.");
    if(app.status!=="submitted")throw new HttpError(409,"ALREADY_DECIDED","Application has already been decided.");
    if(input.decision==="approved"){
      result=await db.$transaction(async tx=>{
        const claimed=await tx.volunteerOpportunity.updateMany({where:{id:app.opportunityId,organizationId:org.id,filled:{lt:app.opportunity.capacity}},data:{filled:{increment:1}}});
        if(!claimed.count)throw new HttpError(409,"FULL","No volunteer spaces remain.");
        const changed=await tx.volunteerApplication.updateMany({where:{
          id:app.id,status:"submitted",opportunity:{organizationId:org.id}
        },data:{status:"approved"}});
        if(!changed.count)throw new HttpError(409,"ALREADY_DECIDED","Application has already changed.");
        return {id:app.id};
      },{isolationLevel:"Serializable"});
    }else{
      const updated=await db.volunteerApplication.updateMany({where:{
        id:app.id,status:"submitted",opportunity:{organizationId:org.id}
      },data:{status:"declined"}});
      if(!updated.count)throw new HttpError(409,"ALREADY_DECIDED","Application has already changed.");
      result={id:app.id};
    }
  }
  await audit(user.id,"admin."+input.kind,"record",result.id);
  return ok({id:result.id,saved:true},201);
 });
}

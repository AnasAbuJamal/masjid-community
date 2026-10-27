import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireVerified, audit } from "@/lib/auth";
import { assertSameOrigin, handled, HttpError, jsonBody, ok } from "@/lib/http";

const clock=z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/,"Time must be HH:mm.");
const name=z.string().trim().min(3).max(150);
const description=z.string().trim().min(10).max(4000);
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("prayer"),venueId:z.string().min(8),localDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fajr:clock,sunrise:clock,dhuhr:clock,asr:clock,maghrib:clock,isha:clock,
  fajrIqamah:clock.optional(),dhuhrIqamah:clock.optional(),asrIqamah:clock.optional(),maghribIqamah:clock.optional(),ishaIqamah:clock.optional(),
  published:z.boolean().default(false)}),
 z.object({kind:z.literal("announcement"),title:name,body:description,urgent:z.boolean().default(false),published:z.boolean().default(false)}),
 z.object({kind:z.literal("event"),title:name,description,location:z.string().trim().min(3).max(200),startAt:z.iso.datetime(),endAt:z.iso.datetime(),capacity:z.number().int().positive().optional(),published:z.boolean().default(false)}),
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
  const user=await requireVerified(req,["admin","staff"]);
  const [org,counts,venues,prayers,announcements,events,applications,construction]=await Promise.all([
    db.organization.findFirst(),
    Promise.all([db.user.count(),db.event.count(),db.announcement.count(),db.schoolProgram.count(),db.donation.count()]),
    db.venue.findMany({take:10,select:{id:true,name:true,timeZone:true}}),
    db.prayerDay.findMany({take:12,orderBy:{localDate:"desc"}}),
    db.announcement.findMany({take:12,orderBy:{createdAt:"desc"}}),
    db.event.findMany({take:12,orderBy:{startAt:"desc"}}),
    db.volunteerApplication.findMany({take:15,include:{opportunity:{select:{title:true}},user:{select:{firstName:true,lastName:true}}}}),
    db.constructionProject.findMany({take:100,orderBy:{createdAt:"desc"},select:{id:true,title:true,status:true}})
  ]);
  return ok({organization:org&&{id:org.id,name:org.name},counts:{users:counts[0],events:counts[1],announcements:counts[2],programs:counts[3],donations:counts[4]},venues,prayers,announcements,events,applications,construction,role:user.role});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin"]);
  const input=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  let result:{id:string};
  if(input.kind==="prayer"){
    const venue=await db.venue.findFirst({where:{id:input.venueId,organizationId:org.id}});
    if(!venue)throw new HttpError(404,"NOT_FOUND","Venue unavailable.");
    const {kind,venueId,localDate,published,...times}=input;
    result=await db.prayerDay.upsert({where:{venueId_localDate:{venueId,localDate}},update:{...times,published,publishedAt:published?new Date():null,revision:{increment:1}},create:{venueId,localDate,...times,published,publishedAt:published?new Date():null}});
  }else if(input.kind==="announcement"){
    result=await db.announcement.create({data:{organizationId:org.id,title:input.title,body:input.body,kind:input.urgent?"urgent":"general",status:input.published?"published":"draft",publishedAt:input.published?new Date():null}});
  }else if(input.kind==="event"){
    if(new Date(input.endAt)<=new Date(input.startAt))throw new HttpError(422,"INVALID_TIME","End date must be after start date.");
    result=await db.event.create({data:{organizationId:org.id,title:input.title,description:input.description,location:input.location,startAt:new Date(input.startAt),endAt:new Date(input.endAt),capacity:input.capacity,status:input.published?"published":"draft"}});
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
    const app=await db.volunteerApplication.findUnique({where:{id:input.applicationId},include:{opportunity:true}});
    if(!app)throw new HttpError(404,"NOT_FOUND","Application unavailable.");
    if(app.status!=="submitted")throw new HttpError(409,"ALREADY_DECIDED","Application has already been decided.");
    if(input.decision==="approved"){
      result=await db.$transaction(async tx=>{
        const claimed=await tx.volunteerOpportunity.updateMany({where:{id:app.opportunityId,filled:{lt:app.opportunity.capacity}},data:{filled:{increment:1}}});
        if(!claimed.count)throw new HttpError(409,"FULL","No volunteer spaces remain.");
        const changed=await tx.volunteerApplication.updateMany({where:{id:app.id,status:"submitted"},data:{status:"approved"}});
        if(!changed.count)throw new HttpError(409,"ALREADY_DECIDED","Application has already changed.");
        return {id:app.id};
      },{isolationLevel:"Serializable"});
    }else{
      result=await db.volunteerApplication.update({where:{id:app.id},data:{status:"declined"}});
    }
  }
  await audit(user.id,"admin."+input.kind,"record",result.id);
  return ok({id:result.id,saved:true},201);
 });
}

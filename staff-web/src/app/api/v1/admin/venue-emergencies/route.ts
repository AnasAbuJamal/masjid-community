import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireCapability} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const venueId=z.string().min(8).max(128);
const revision=z.number().int().min(0);
const publish=z.object({
 action:z.literal("publish"),venueId,expectedRevision:revision,
 kind:z.enum(["closure","access_change","safety","other"]),
 title:z.string().trim().min(8).max(150),
 body:z.string().trim().min(15).max(1500),
 instructions:z.string().trim().min(10).max(500),
 expiresAt:z.iso.datetime()
}).strict();
const clear=z.object({
 action:z.literal("clear"),venueId,expectedRevision:revision
}).strict();
const command=z.discriminatedUnion("action",[publish,clear]);

// Read access is delegated only to MFA-gated worship_publish staff at the
// original pilot mosque. A second mosque grants no global staff authority.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const staff=await requireCapability(req,"worship_publish");
  if(!staff.mfaVerified)throw new HttpError(403,"MFA_REQUIRED","Complete MFA before viewing emergency notices.");
  const org=await db.organization.findFirst({
   orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}
  });
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Community is unavailable.");
  const venues=await db.venue.findMany({
   where:{organizationId:org.id},orderBy:{name:"asc"},take:100,
   select:{id:true,name:true,timeZone:true,
    emergencyNotice:{select:{id:true,venueId:true,kind:true,title:true,
     body:true,instructions:true,status:true,revision:true,
     expiresAt:true,publishedAt:true,updatedAt:true}}}
  });
  return ok({venues,policy:"Only a verified active worship publisher can revise or clear time-limited venue emergency notices. Published notices are not push notifications."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireCapability(req,"worship_publish");
  if(!actor.mfaVerified)throw new HttpError(403,"MFA_REQUIRED","Complete MFA before publishing emergencies.");
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({
   orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}
  });
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Community is unavailable.");
  const now=new Date();
  if(input.action==="publish"){
   const expiresAt=new Date(input.expiresAt);
   const lifetime=expiresAt.getTime()-now.getTime();
   if(lifetime<15*60_000||lifetime>7*86400_000)
    throw new HttpError(422,"INVALID_EXPIRY","Published emergency notices must expire in 15 minutes to 7 days.");
  }
  try{
   const result=await db.$transaction(async tx=>{
    const venue=await tx.venue.findFirst({
     where:{id:input.venueId,organizationId:org.id},select:{id:true}
    });
    if(!venue)throw new HttpError(404,"VENUE_NOT_FOUND","Venue unavailable.");
    const existing=await tx.venueEmergencyNotice.findUnique({
     where:{venueId:venue.id}
    });
    if(input.expectedRevision!==(existing?.revision||0))
     throw new HttpError(409,"STALE_REVISION","The notice has changed. Reload before editing.");
    let id:string,version:number,status:"published"|"archived";
    if(input.action==="clear"){
     if(!existing||existing.status!=="published")
      throw new HttpError(409,"NOT_PUBLISHED","There is no published notice to clear.");
     const changed=await tx.venueEmergencyNotice.updateMany({
      where:{venueId:venue.id,revision:input.expectedRevision,status:"published"},
      data:{status:"archived",publishedAt:null,revision:{increment:1}}
     });
     if(!changed.count)throw new HttpError(409,"STALE_REVISION","Reload this notice before clearing.");
     id=existing.id;version=existing.revision+1;status="archived";
    }else if(existing){
     const changed=await tx.venueEmergencyNotice.updateMany({
      where:{venueId:venue.id,revision:input.expectedRevision},
      data:{kind:input.kind,title:input.title,body:input.body,
       instructions:input.instructions,expiresAt:new Date(input.expiresAt),
       publishedAt:now,status:"published",publishedById:actor.id,
       revision:{increment:1}}
     });
     if(!changed.count)throw new HttpError(409,"STALE_REVISION","Reload this notice before editing.");
     id=existing.id;version=existing.revision+1;status="published";
    }else{
     if(input.expectedRevision!==0)
      throw new HttpError(409,"STALE_REVISION","The notice has changed.");
     const created=await tx.venueEmergencyNotice.create({data:{
      venueId:venue.id,kind:input.kind,title:input.title,body:input.body,
      instructions:input.instructions,expiresAt:new Date(input.expiresAt),
      publishedAt:now,status:"published",publishedById:actor.id
     }});
     id=created.id;version=created.revision;status="published";
    }
    await tx.auditEvent.create({data:{
     actorId:actor.id,action:status==="published"?"venue.emergency.publish":"venue.emergency.clear",
     entity:"VenueEmergencyNotice",entityId:id,
     detail:JSON.stringify({venueId:venue.id,revision:version,
      ...(input.action==="publish"?{kind:input.kind,expiresAt:input.expiresAt}:{})})
    }});
    return {id,venueId:venue.id,status,revision:version};
   },{isolationLevel:"Serializable"});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&
      ["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"STALE_REVISION","The notice changed while publishing. Reload and retry.");
   throw error;
  }
 });
}

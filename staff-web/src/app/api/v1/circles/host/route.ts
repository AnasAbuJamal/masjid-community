import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
import {notifyUser} from "@/lib/notifications";

const decision=z.object({action:z.literal("decide"),circleId:z.string().min(8),
 memberId:z.string().min(8),decision:z.enum(["approved","declined"]),
 reason:z.string().trim().min(10).max(280)});
const publish=z.object({action:z.literal("publish-update"),circleId:z.string().min(8),
 body:z.string().trim().min(10).max(2000)});
const command=z.discriminatedUnion("action",[decision.strict(),publish.strict()]);
const ROSTER_PAGE_SIZE=25;

export async function GET(req:NextRequest){
 return handled(async()=>{
  const actor=await requireVerified(req);
  if(actor.role==="student")throw new HttpError(403,"HOST_REQUIRED","Approved adult circle host required.");
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const params=req.nextUrl.searchParams;
  const keys=["circleId","cursor","mode"];
  if([...params.keys()].some(key=>!keys.includes(key))||
     keys.some(key=>params.getAll(key).length>1))
   throw new HttpError(422,"BAD_QUERY","Unsupported or repeated circle roster query.");
  const circleId=params.get("circleId"),mode=params.get("mode");
  if(mode!==null&&mode!=="access")
   throw new HttpError(422,"BAD_QUERY","Unsupported circle host operation.");
  if((!circleId&&(params.has("cursor")||mode!==null))||
     (mode!==null&&params.has("cursor")))
   throw new HttpError(422,"BAD_QUERY","Circle and access probe cannot be combined with a page cursor.");
  const rawCursor=params.get("cursor");
  if(rawCursor!==null&&!rawCursor)
   throw new HttpError(422,"BAD_CURSOR","Nonempty circle roster cursor required.");
  const cursor=rawCursor?z.string().regex(/^[A-Za-z0-9_-]{8,128}$/).parse(rawCursor):null;
  const activeHost={hostId:actor.id,status:"published" as const,organizationId:org.id,
   host:{status:"active" as const,verifiedAt:{not:null},memberships:{some:{organizationId:org.id,status:"active" as const}}}};
  if(!circleId){
   const circles=await db.circle.findMany({where:activeHost,
    orderBy:{createdAt:"desc"},take:100,
    select:{id:true,title:true,cadence:true,_count:{select:{members:true}}}});
   return ok({circles});
  }
  const validId=z.string().min(8).max(128).parse(circleId);
  const circle=await db.circle.findFirst({where:{...activeHost,id:validId},
   select:{id:true,title:true,summary:true,cadence:true,guidelines:true}});
  if(!circle)throw new HttpError(404,"HOST_SCOPE","Assigned circle unavailable.");
  // Revalidate cached private host screens without selecting any member names.
  // A failed authorization never yields even the existence of an RSVP/member.
  if(mode==="access")return ok({authorized:true,circleId:validId,
   note:"Current assigned-host permission only; no member data returned."});
  // Resolve all continuation anchors against the SAME published circle,
  // eligible member and current assigned host. The host permission check
  // above must precede every cursor lookup or private name selection.
  const eligible:Prisma.CircleMemberWhereInput={
   circleId:circle.id,status:{in:["requested","approved"]},
   member:{status:"active",verifiedAt:{not:null},role:{not:"student"},
    memberships:{some:{organizationId:org.id,status:"active"}}}
  };
  const pivot=cursor?await db.circleMember.findFirst({
   where:{AND:[eligible,{id:cursor}]},select:{id:true,requestedAt:true}
  }):null;
  if(cursor&&!pivot)throw new HttpError(404,"CIRCLE_CURSOR_UNAVAILABLE",
   "This private circle page changed. Refresh the assigned circle.");
  const where:Prisma.CircleMemberWhereInput=pivot?{AND:[eligible,{OR:[
   {requestedAt:{gt:pivot.requestedAt}},
   {requestedAt:pivot.requestedAt,id:{gt:pivot.id}}
  ]}]}:eligible;
  const rows=await db.circleMember.findMany({
   where,orderBy:[{requestedAt:"asc"},{id:"asc"}],
   take:ROSTER_PAGE_SIZE+1,
   select:{id:true,status:true,requestedAt:true,
    member:{select:{firstName:true,lastName:true}}}
  });
  const hasMore=rows.length>ROSTER_PAGE_SIZE;
  const members=hasMore?rows.slice(0,ROSTER_PAGE_SIZE):rows;
  const updates=await db.circleUpdate.findMany({where:{circleId:circle.id},
   orderBy:{publishedAt:"desc"},take:40,
   select:{id:true,body:true,publishedAt:true,revision:true}});
  return ok({circle,members,updates,pageSize:ROSTER_PAGE_SIZE,hasMore,
   nextCursor:hasMore?members[members.length-1].id:null,rosterComplete:!hasMore,
   policy:"Private active eligible member list in bounded pages of 25, for the assigned host only. Do not export, photograph or disclose. Request and decision remain separate; each decision requires review."});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const actor=await requireVerified(req);
  if(actor.role==="student")throw new HttpError(403,"HOST_REQUIRED","Approved adult circle host required.");
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try{
   const result=await db.$transaction(async tx=>{
    const circle=await tx.circle.findFirst({where:{
     id:input.circleId,hostId:actor.id,organizationId:org.id,status:"published",
     host:{status:"active",verifiedAt:{not:null},role:{not:"student"},
      memberships:{some:{organizationId:org.id,status:"active"}}}
    },select:{id:true}});
    if(!circle)throw new HttpError(404,"HOST_SCOPE","Assigned circle unavailable.");
    if(input.action==="publish-update"){
     const item=await tx.circleUpdate.create({data:{
      circleId:circle.id,authorId:actor.id,body:input.body
     }});
     await tx.auditEvent.create({data:{actorId:actor.id,action:"circle.update.publish",
      entity:"CircleUpdate",entityId:item.id,
      detail:JSON.stringify({circleId:circle.id,organizationId:org.id,revision:1})}});
     return {id:item.id,status:"published"};
    }
    const membership=await tx.circleMember.findFirst({where:{
     id:input.memberId,circleId:circle.id,status:"requested",
     member:{status:"active",verifiedAt:{not:null},role:{not:"student"},
      memberships:{some:{organizationId:org.id,status:"active"}}}
    },select:{id:true,userId:true}});
    if(!membership)throw new HttpError(409,"REQUEST_UNAVAILABLE","Pending request unavailable or applicant no longer eligible.");
    const updated=await tx.circleMember.updateMany({where:{
     id:membership.id,circleId:circle.id,status:"requested"
    },data:{
     status:input.decision,reviewedAt:new Date(),reviewedById:actor.id,
     decisionReason:input.reason
    }});
    if(!updated.count)throw new HttpError(409,"REQUEST_CHANGED","Request already reviewed. Refresh.");
    await tx.auditEvent.create({data:{actorId:actor.id,action:"circle.join."+input.decision,
     entity:"CircleMember",entityId:membership.id,
     detail:JSON.stringify({circleId:circle.id,organizationId:org.id,reason:input.reason})}});
    // Keep email/push generic: circle identities and membership decisions are
    // never disclosed via an external notification's subject/body.
    await notifyUser(tx,org.id,membership.userId,"Your community request has been reviewed",
     "Check your account for the status of your community request.");
    return {id:membership.id,status:input.decision};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")
    throw new HttpError(409,"REQUEST_CHANGED","Circle request changed. Refresh.");
   throw error;
  }
 });
}

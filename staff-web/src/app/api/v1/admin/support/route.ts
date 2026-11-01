import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {appendIntegrityAudit} from "@/lib/integrity-audit";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

// Explicitly approved technical-support metadata ONLY. No arbitrary text,
// account impersonation, child data, payment details or care cases.
const categories=["login_access","public_content","event_registration",
 "school_access","payments_metadata","technical_fault"] as const;
const noteCodes=["investigation_started","reproduced","unable_to_reproduce",
 "escalated_to_owner","fix_in_progress","resolution_verified"] as const;
const opaque=z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/);
const trace=z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/);
const listing=z.object({
 cursor:opaque.optional(),caseId:opaque.optional(),noteCursor:opaque.optional()
}).strict();
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("create"),traceId:trace,category:z.enum(categories)}).strict(),
 z.object({kind:z.literal("note"),caseId:opaque,code:z.enum(noteCodes)}).strict(),
 z.object({kind:z.literal("status"),caseId:opaque,
  status:z.enum(["investigating","resolved"])}).strict()
]);
const PAGE_SIZE=50;
type Cursor={id:string;createdAt:Date};
function before(anchor:Cursor):Prisma.SupportCaseWhereInput{
 return {OR:[{createdAt:{lt:anchor.createdAt}},
  {createdAt:anchor.createdAt,id:{lt:anchor.id}}]};
}
function notesBefore(anchor:Cursor):Prisma.SupportCaseNoteWhereInput{
 return {OR:[{createdAt:{lt:anchor.createdAt}},
  {createdAt:anchor.createdAt,id:{lt:anchor.id}}]};
}
async function requireSupport(req:NextRequest){
 // Intentionally NO inherited global administrator shortcut; only
 // independently invited, MFA-enrolled, time-limited staff get this scope.
 const user=await requireVerified(req,["staff"]);
 if(!user.mfaEnabled||!user.mfaVerified)
  throw new HttpError(403,"SUPPORT_MFA_REQUIRED",
   "Complete an enrolled authenticator before using the support desk.");
 const org=await db.organization.findFirst({
  orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true,name:true}});
 if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
 const grant=await db.roleGrant.findFirst({
  where:{capability:"support_manage",revokedAt:null,
   membership:{organizationId:org.id,userId:user.id,status:"active"},
   expiresAt:{gt:new Date()}},
  select:{id:true,expiresAt:true}
 });
 if(!grant||!grant.expiresAt)
  throw new HttpError(403,"SUPPORT_GRANT_REQUIRED",
   "Operational support requires a current seven-day mosque grant.");
 return {user,org,grant};
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org,grant}=await requireSupport(req);
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>!["cursor","caseId","noteCursor"].includes(k))||
   ["cursor","caseId","noteCursor"].some(k=>params.getAll(k).length>1))
   throw new HttpError(422,"BAD_QUERY","Unknown or repeated support history parameter.");
  const parsed=listing.parse(Object.fromEntries(params));
  if((parsed.cursor&&parsed.caseId)||(!parsed.caseId&&parsed.noteCursor))
   throw new HttpError(422,"BAD_QUERY","Incompatible support history cursors.");
  const result=await db.$transaction(async tx=>{
   if(parsed.caseId){
    const item=await tx.supportCase.findFirst({
     where:{id:parsed.caseId,organizationId:org.id},
     select:{id:true,traceId:true,category:true,status:true,createdAt:true,
      updatedAt:true,resolvedAt:true}
    });
    if(!item)throw new HttpError(404,"SUPPORT_CASE_UNAVAILABLE","Support record unavailable.");
    const pivot=parsed.noteCursor?await tx.supportCaseNote.findFirst({
     where:{id:parsed.noteCursor,caseId:item.id},
     select:{id:true,createdAt:true}
    }):null;
    if(parsed.noteCursor&&!pivot)
     throw new HttpError(404,"SUPPORT_CURSOR_UNAVAILABLE","Support history cursor unavailable.");
    const rows=await tx.supportCaseNote.findMany({
     where:{caseId:item.id,...(pivot?notesBefore(pivot):{})},
     orderBy:[{createdAt:"desc"},{id:"desc"}],take:PAGE_SIZE+1,
     select:{id:true,code:true,createdAt:true}
    });
    const notes=rows.slice(0,PAGE_SIZE);
    await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
     action:"support.case.read",entity:"SupportCase",entityId:item.id,
     evidence:{scope:"organization",capability:"support_manage"}});
    return {mode:"case",item,notes,complete:rows.length<=PAGE_SIZE,
     nextCursor:rows.length>PAGE_SIZE?notes.at(-1)!.id:null,
     pageSize:PAGE_SIZE};
   }
   const pivot=parsed.cursor?await tx.supportCase.findFirst({
    where:{id:parsed.cursor,organizationId:org.id},
    select:{id:true,createdAt:true}
   }):null;
   if(parsed.cursor&&!pivot)
    throw new HttpError(404,"SUPPORT_CURSOR_UNAVAILABLE","Support history cursor unavailable.");
   const rows=await tx.supportCase.findMany({
    where:{organizationId:org.id,...(pivot?before(pivot):{})},
    orderBy:[{createdAt:"desc"},{id:"desc"}],take:PAGE_SIZE+1,
    select:{id:true,traceId:true,category:true,status:true,
     createdAt:true,updatedAt:true,resolvedAt:true}
   });
   const items=rows.slice(0,PAGE_SIZE);
   await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
    action:"support.case.list",entity:"SupportCase",entityId:org.id,
    evidence:{scope:"organization",capability:"support_manage"}});
   return {mode:"list",items,complete:rows.length<=PAGE_SIZE,
    nextCursor:rows.length>PAGE_SIZE?items.at(-1)!.id:null,
    pageSize:PAGE_SIZE};
  },{isolationLevel:"Serializable"});
  return ok({...result,grantExpiresAt:grant.expiresAt,
   policy:"MFA-verified time-limited support grant. Structured metadata only; access is sealed-audited. This tool cannot impersonate members, retrieve private records or change financial state."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {user,org}=await requireSupport(req);
  const value=command.parse(await jsonBody(req));
  let result;
  try{
   result=await db.$transaction(async tx=>{
    if(value.kind==="create"){
     const item=await tx.supportCase.create({
      data:{organizationId:org.id,createdById:user.id,
       traceId:value.traceId,category:value.category},
      select:{id:true,status:true}
     });
     await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
      action:"support.case.create",entity:"SupportCase",entityId:item.id,
      evidence:{scope:"organization",capability:"support_manage",to:"open"}});
     return {caseId:item.id,status:item.status};
    }
    const item=await tx.supportCase.findFirst({where:{
     id:value.caseId,organizationId:org.id
    },select:{id:true,status:true}});
    if(!item)throw new HttpError(404,"SUPPORT_CASE_UNAVAILABLE","Support record unavailable.");
    if(item.status==="resolved")
     throw new HttpError(409,"SUPPORT_CASE_CLOSED","Resolved support records cannot be changed.");
    if(value.kind==="note"){
     const note=await tx.supportCaseNote.create({data:{
      caseId:item.id,authorId:user.id,code:value.code},
      select:{id:true,code:true}
     });
     await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
      action:"support.note.record",entity:"SupportCase",entityId:item.id,
      evidence:{scope:"organization",capability:"support_manage",to:value.code}});
     return {caseId:item.id,noteId:note.id,code:note.code,status:item.status};
    }
    if(value.status==="investigating"&&item.status!=="open")
     throw new HttpError(409,"SUPPORT_STATUS_CONFLICT","Only open cases can enter investigation.");
    if(value.status==="resolved"&&item.status!=="investigating")
     throw new HttpError(409,"SUPPORT_STATUS_CONFLICT","Investigate before resolving.");
    if(value.status==="resolved"){
     const evidence=await tx.supportCaseNote.findFirst({where:{
      caseId:item.id,code:"resolution_verified"},select:{id:true}
     });
     if(!evidence)throw new HttpError(409,"SUPPORT_RESOLUTION_EVIDENCE",
      "A verified resolution note is required before closing.");
    }
    const updated=await tx.supportCase.updateMany({where:{
     id:item.id,organizationId:org.id,status:item.status
    },data:{status:value.status,resolvedAt:value.status==="resolved"?new Date():null}});
    if(updated.count!==1)
     throw new HttpError(409,"SUPPORT_STATUS_CONFLICT","Support case was updated by another reviewer.");
    await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
     action:"support.case.status",entity:"SupportCase",entityId:item.id,
     evidence:{scope:"organization",capability:"support_manage",
      from:item.status,to:value.status}});
    return {caseId:item.id,status:value.status};
   },{isolationLevel:"Serializable"});
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")
    throw new HttpError(409,"SUPPORT_TRACE_DUPLICATE",
     "This opaque trace already has a support record for this mosque.");
   throw error;
  }
  return ok(result);
 });
}

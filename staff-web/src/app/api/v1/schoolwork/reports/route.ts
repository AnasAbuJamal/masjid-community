import {NextRequest} from "next/server";
import type {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import {mayViewGuardianRecords} from "@/lib/school-role-policy";
import {handled,HttpError,ok} from "@/lib/http";

const PAGE_SIZE=25;
const cursorSchema=z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/);

// Family report archive: read-only, published-only, exact active child/class
// enrollment pair. A valid student ID alone NEVER authorizes another class.
// No reviewer drafts, historical revoked guardians or other mosque content.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  if(user.role==="teacher"||user.role==="admin")
   throw new HttpError(403,"FAMILY_RECORD_SCOPE",
    "Use your approved school administration workspace for staff reports.");
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>k!=="cursor")||params.getAll("cursor").length>1)
   throw new HttpError(422,"BAD_QUERY","Only one supported family report cursor is permitted.");
  const cursor=params.has("cursor")?cursorSchema.parse(params.get("cursor")):null;
  const org=await db.organization.findFirst({
   orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","School organization unavailable.");
  const [own,links]=await Promise.all([
   db.student.findFirst({where:{userId:user.id,...schoolStudentScope(org.id)},
    select:{id:true}}),
   mayViewGuardianRecords(user.role)?db.guardianLink.findMany({
    where:{guardianId:user.id,approvedAt:{not:null},revokedAt:null,
     student:schoolStudentScope(org.id)},
    select:{studentId:true}
   }):Promise.resolve([])
  ]);
  const ids=[...new Set([...(own?[own.id]:[]),...links.map(x=>x.studentId)])];
  if(!ids.length){
   if(cursor)throw new HttpError(404,"FAMILY_REPORT_CURSOR_UNAVAILABLE",
    "Private report cursor unavailable.");
   return ok({mode:"family-reports",items:[],nextCursor:null,complete:true,pageSize:PAGE_SIZE});
  }
  const enrollments=await db.enrollment.findMany({
   where:{studentId:{in:ids},status:"active",
    classSection:{program:{organizationId:org.id}}},
   select:{studentId:true,classId:true}
  });
  const pairs=enrollments.map(e=>({studentId:e.studentId,classId:e.classId}));
  if(!pairs.length){
   if(cursor)throw new HttpError(404,"FAMILY_REPORT_CURSOR_UNAVAILABLE",
    "Private report cursor unavailable.");
   return ok({mode:"family-reports",items:[],nextCursor:null,complete:true,pageSize:PAGE_SIZE});
  }
  const owned:Prisma.StudentReportWhereInput={
   status:"published",student:schoolStudentScope(org.id),
   classSection:{program:{organizationId:org.id}},
   OR:pairs.map(p=>({studentId:p.studentId,classId:p.classId}))
  };
  const pivot=cursor?await db.studentReport.findFirst({
   where:{...owned,id:cursor},
   select:{id:true,publishedAt:true}
  }):null;
  if(cursor&&!pivot)throw new HttpError(404,"FAMILY_REPORT_CURSOR_UNAVAILABLE",
   "Private report cursor unavailable.");
  // PublishedAt can be NULL for older rows; nulls are explicitly last.
  // Cursor comparison must cover all rows, including matching timestamps.
  const before:Prisma.StudentReportWhereInput=!pivot?{}:pivot.publishedAt?{
   OR:[{publishedAt:{lt:pivot.publishedAt}},
    {publishedAt:pivot.publishedAt,id:{lt:pivot.id}},
    {publishedAt:null}]
  }:{publishedAt:null,id:{lt:pivot.id}};
  const rows=await db.studentReport.findMany({
   // Never spread two OR objects: that would replace ownership OR with
   // cursor OR and expose another child's published report.
   where:{AND:[owned,before]},take:PAGE_SIZE+1,
   orderBy:[{publishedAt:{sort:"desc",nulls:"last"}},{id:"desc"}],
   select:{id:true,studentId:true,summary:true,publishedAt:true,
    classSection:{select:{name:true}},
    student:{select:{firstName:true,lastName:true}}}
  });
  const items=rows.slice(0,PAGE_SIZE);
  return ok({mode:"family-reports",items,pageSize:PAGE_SIZE,
   complete:rows.length<=PAGE_SIZE,
   nextCursor:rows.length>PAGE_SIZE?items[items.length-1].id:null,
   policy:"Private published progress reports for exact current child/class enrollment only. Withdrawn publications and revoked guardian links remain unavailable."});
 });
}

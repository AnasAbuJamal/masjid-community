import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import {handled,HttpError,ok} from "@/lib/http";

export const dynamic="force-dynamic";
const PAGE_SIZE=50;
const query=z.object({
 status:z.enum(["draft","published"]),
 cursor:z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/).optional()
}).strict();

/** A separately authorized, private review archive. Neither child reports nor
 * cursors may be listed by teachers, guardians, guests or another mosque.
 * Page continuity is best-effort under concurrent review: no frozen snapshot.
 */
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req,["admin"]);
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>!["status","cursor"].includes(k))||
     ["status","cursor"].some(k=>params.getAll(k).length>1))
   throw new HttpError(422,"BAD_QUERY","Unknown or repeated report-history parameter.");
  const {status,cursor}=query.parse({
   status:params.get("status"),
   ...(params.has("cursor")?{cursor:params.get("cursor")}:{})
  });
  const org=await db.organization.findFirst({
   orderBy:{createdAt:"asc"},select:{id:true}
  });
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const owned:Prisma.StudentReportWhereInput={
   status,
   classSection:{program:{organizationId:org.id}},
   student:schoolStudentScope(org.id)
  };
  const pivot=cursor?await db.studentReport.findFirst({
   where:{...owned,id:cursor},
   select:{id:true,createdAt:true,publishedAt:true}
  }):null;
  if(cursor&&!pivot)throw new HttpError(404,"REPORT_CURSOR_UNAVAILABLE",
   "This private review cursor is unavailable.");

  const before:Prisma.StudentReportWhereInput=!pivot?{}:status==="draft"?{
   OR:[{createdAt:{gt:pivot.createdAt}},
       {createdAt:pivot.createdAt,id:{gt:pivot.id}}]
  }:pivot.publishedAt?{
   OR:[{publishedAt:{lt:pivot.publishedAt}},
       {publishedAt:pivot.publishedAt,id:{lt:pivot.id}},
       {publishedAt:null}]
  }:{publishedAt:null,id:{lt:pivot.id}};
  const orderBy:Prisma.StudentReportOrderByWithRelationInput[]=
   status==="draft"?[{createdAt:"asc"},{id:"asc"}]:
   [{publishedAt:{sort:"desc",nulls:"last"}},{id:"desc"}];
  const rows=await db.studentReport.findMany({
   where:{...owned,...before},orderBy,take:PAGE_SIZE+1,
   select:{
    id:true,teacherId:true,summary:true,createdAt:true,publishedAt:true,
    classSection:{select:{id:true,name:true}},
    student:{select:{firstName:true,lastName:true}},
    teacher:{select:{firstName:true,lastName:true}}
   }
  });
  const page=rows.slice(0,PAGE_SIZE);
  return ok({
   status,pageSize:PAGE_SIZE,
   items:page.map(x=>({...x,selfAuthored:x.teacherId===user.id})),
   complete:rows.length<=PAGE_SIZE,
   nextCursor:rows.length>PAGE_SIZE?page[page.length-1].id:null,
   policy:"MFA-cleared administrator only. Read-only child record review history; no report is published or retracted by reading this list."
  });
 });
}

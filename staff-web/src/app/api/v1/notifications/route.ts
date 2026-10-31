import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {requireMemberContext} from "@/lib/auth";
import {db} from "@/lib/db";
import {handled,HttpError,ok} from "@/lib/http";

const PAGE_SIZE=25;

// Return only the member's notification fields, never their full private
// dashboard. The session-selected mosque owns both every row and its cursor.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org}=await requireMemberContext(req);
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>k!=="cursor")||params.getAll("cursor").length>1)
   throw new HttpError(422,"BAD_QUERY","Only one inbox cursor is allowed.");
  const cursor=params.get("cursor");
  if(cursor!==null&&!/^[A-Za-z0-9_-]{8,128}$/.test(cursor))
   throw new HttpError(422,"BAD_CURSOR","Invalid inbox cursor.");
  const owner:Prisma.NotificationWhereInput={userId:user.id,organizationId:org.id};
  const pivot=cursor?await db.notification.findFirst({
   where:{...owner,id:cursor},select:{id:true,createdAt:true}
  }):null;
  if(cursor&&!pivot)throw new HttpError(404,"CURSOR_UNAVAILABLE",
   "This inbox page is unavailable. Refresh the inbox.");
  const where:Prisma.NotificationWhereInput=pivot?{AND:[owner,{OR:[
   {createdAt:{lt:pivot.createdAt}},
   {createdAt:pivot.createdAt,id:{lt:pivot.id}}
  ]}]}:owner;
  const found=await db.notification.findMany({
   where,orderBy:[{createdAt:"desc"},{id:"desc"}],take:PAGE_SIZE+1,
   select:{id:true,title:true,body:true,createdAt:true,readAt:true}
  });
  const hasMore=found.length>PAGE_SIZE;
  const items=hasMore?found.slice(0,PAGE_SIZE):found;
  return ok({organization:{id:org.id,name:org.name},items,pageSize:PAGE_SIZE,
   hasMore,nextCursor:hasMore?items[items.length-1].id:null});
 });
}

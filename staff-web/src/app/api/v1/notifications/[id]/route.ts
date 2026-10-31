import {NextRequest} from "next/server";
import {requireMemberContext} from "@/lib/auth";
import {db} from "@/lib/db";
import {assertSameOrigin,handled,HttpError,ok} from "@/lib/http";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 return handled(async()=>{
  assertSameOrigin(req);
  const {user,org}=await requireMemberContext(req);
  const {id}=await params;
  // Do not mutate foreign-mosque or historical unscoped notifications by ID,
  // even when the recipient's shared identity matches this authenticated user.
  const owner={id,userId:user.id,organizationId:org.id};
  // Preserve the first read timestamp across retries and double taps.
  const changed=await db.notification.updateMany({where:{
   ...owner,readAt:null
  },data:{readAt:new Date()}});
  if(!changed.count){
   const existing=await db.notification.findFirst({where:owner,select:{id:true}});
   if(!existing)throw new HttpError(404,"NOT_FOUND","Notification unavailable.");
  }
  return ok({id,read:true});
 });
}

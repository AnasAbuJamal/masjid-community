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
  const result=await db.notification.updateMany({where:{
   id,userId:user.id,organizationId:org.id
  },data:{readAt:new Date()}});
  if(!result.count)throw new HttpError(404,"NOT_FOUND","Notification unavailable.");
  return ok({id,read:true});
 });
}

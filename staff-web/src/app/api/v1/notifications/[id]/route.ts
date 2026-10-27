import {NextRequest} from "next/server";
import {requireActor} from "@/lib/auth";
import {db} from "@/lib/db";
import {assertSameOrigin,handled,HttpError,ok} from "@/lib/http";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireActor(req);
  const {id}=await params;
  const result=await db.notification.updateMany({where:{id,userId:user.id},data:{readAt:new Date()}});
  if(!result.count)throw new HttpError(404,"NOT_FOUND","Notification unavailable.");
  return ok({id,read:true});
 });
}

import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireActor} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,ok} from "@/lib/http";
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireActor(req);
  const {id}=await params;
  const updated=await db.authSession.updateMany({where:{id,userId:user.id,revokedAt:null},data:{revokedAt:new Date()}});
  if(!updated.count)throw new HttpError(404,"NOT_FOUND","Session not found or already revoked.");
  return ok({revoked:true,id});
 });
}

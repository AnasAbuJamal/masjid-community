import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req,["staff"]);
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const grants=await db.roleGrant.findMany({where:{
   membership:{organizationId:org.id,userId:user.id,status:"active"},revokedAt:null,
   OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]
  },select:{capability:true,expiresAt:true}});
  return ok({name:user.firstName+" "+user.lastName,organization:org.name,capabilities:grants});
 });
}

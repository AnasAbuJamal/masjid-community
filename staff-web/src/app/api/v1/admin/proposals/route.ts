import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin","staff"]);
  const org=await db.organization.findFirst();
  const items=org?await db.proposal.findMany({where:{organizationId:org.id},take:100,orderBy:{id:"desc"},
   select:{id:true,title:true,description:true,status:true,submitter:{select:{firstName:true,lastName:true}}}}):[];
  return ok({items,canModerate:(await requireVerified(req)).role==="admin"});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin"]);
  const {id,status}=z.object({id:z.string().min(8),status:z.enum(["published","archived"])}).parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const updated=await db.proposal.updateMany({where:{id,organizationId:org.id,status:"draft"},data:{status}});
  if(!updated.count)throw new HttpError(409,"NOT_PENDING","Only pending draft proposals can be reviewed.");
  await db.auditEvent.create({data:{actorId:user.id,action:"proposal."+status,entity:"Proposal",entityId:id}});
  return ok({id,status});
 });
}

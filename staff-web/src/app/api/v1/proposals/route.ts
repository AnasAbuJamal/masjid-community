import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const payload=z.object({title:z.string().trim().min(5).max(160),description:z.string().trim().min(30).max(5000)});
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req);
  const items=await db.proposal.findMany({where:{submittedById:user.id},orderBy:{id:"desc"},take:50,
   select:{id:true,title:true,description:true,status:true}});
  return ok({items});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req);
  const input=payload.parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const recent=await db.proposal.findFirst({where:{submittedById:user.id,title:input.title,status:"draft"}});
  if(recent)throw new HttpError(409,"DUPLICATE","You already submitted this proposal for review.");
  const item=await db.proposal.create({data:{organizationId:org.id,submittedById:user.id,
   title:input.title,description:input.description,status:"draft"}});
  return ok({id:item.id,status:item.status,message:"Proposal submitted for moderator review."},201);
 });
}

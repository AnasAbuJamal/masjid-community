import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const form=z.object({name:z.string().trim().min(2).max(100),email:z.email().max(254),
 subject:z.string().trim().min(3).max(160),message:z.string().trim().min(15).max(4000),
 website:z.string().optional()});
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const input=form.parse(await jsonBody(req));
  if(input.website)return ok({received:true}); // Honeypot: ignore bot submissions
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","The mosque contact form is not ready.");
  const email=input.email.trim().toLowerCase();
  const recent=await db.contactSubmission.findFirst({where:{organizationId:org.id,email,createdAt:{gt:new Date(Date.now()-10*60_000)}}});
  if(recent)throw new HttpError(429,"PLEASE_WAIT","A request was recently submitted from this email. Try again later.");
  await db.contactSubmission.create({data:{organizationId:org.id,name:input.name,email,subject:input.subject,message:input.message}});
  return ok({received:true,message:"Your request has been recorded. Staff will review it."},201);
 });
}

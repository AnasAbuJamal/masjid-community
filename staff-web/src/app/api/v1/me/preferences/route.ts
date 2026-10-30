import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {optionalDeliveryPurposes} from "@/lib/delivery-policy";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const hour=z.number().int().min(0).max(23).nullable();
const change=z.object({
 purpose:z.enum(optionalDeliveryPurposes),
 enabled:z.boolean(),
 quietStartHour:hour,
 quietEndHour:hour
}).refine(v=>
 (v.quietStartHour===null&&v.quietEndHour===null)||
 (v.quietStartHour!==null&&v.quietEndHour!==null&&v.quietStartHour!==v.quietEndHour),
 {message:"Select both different local quiet-hour boundaries, or turn quiet hours off."}
);
async function context(req:NextRequest){
 const user=await requireVerified(req);
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},
  select:{id:true,name:true,timeZone:true}});
 if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
 return {user,org};
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org}=await context(req);
  const saved=await db.organizationDeliveryPreference.findMany({where:{
   organizationId:org.id,userId:user.id,channel:"email",
   purpose:{in:[...optionalDeliveryPurposes]}
  },select:{purpose:true,enabled:true,quietStartHour:true,quietEndHour:true,updatedAt:true,consentedAt:true}});
  return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},
   serviceEmail:{required:true,description:"Operational decisions, confirmations and safety-critical account updates. Not a newsletter."},
   optional:optionalDeliveryPurposes.map(purpose=>{
    const row=saved.find(p=>p.purpose===purpose);
    return {purpose,channel:"email",enabled:row?.enabled||false,
     quietStartHour:row?.quietStartHour??null,quietEndHour:row?.quietEndHour??null,
     consentedAt:row?.consentedAt||null,updatedAt:row?.updatedAt||null};
   }),
   policy:"Optional email is opt-in per mosque and purpose. Old global switches do not grant consent. A quiet-hours window applies to optional email only, using this mosque's timezone. A preference does not guarantee a live email service."});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {user,org}=await context(req);
  const values=change.parse(await jsonBody(req));
  const now=new Date();
  const updated=await db.$transaction(async tx=>{
   const existing=await tx.organizationDeliveryPreference.findUnique({where:{
    organizationId_userId_purpose_channel:{
     organizationId:org.id,userId:user.id,purpose:values.purpose,channel:"email"
    }
   },select:{id:true,enabled:true,quietStartHour:true,quietEndHour:true}});
   const row=await tx.organizationDeliveryPreference.upsert({where:{
    organizationId_userId_purpose_channel:{
     organizationId:org.id,userId:user.id,purpose:values.purpose,channel:"email"
    }
   },create:{
    organizationId:org.id,userId:user.id,purpose:values.purpose,channel:"email",
    enabled:values.enabled,consentedAt:values.enabled?now:null,
    quietStartHour:values.quietStartHour,quietEndHour:values.quietEndHour
   },update:{
    enabled:values.enabled,
    // Consent withdrawal must never retain a previously usable opt-in.
    consentedAt:values.enabled?
     (existing?.enabled?undefined:now):null,
    quietStartHour:values.quietStartHour,quietEndHour:values.quietEndHour
   },select:{purpose:true,enabled:true,quietStartHour:true,quietEndHour:true,updatedAt:true}});
   await tx.auditEvent.create({data:{
    actorId:user.id,action:"delivery.preference.change",
    entity:"OrganizationDeliveryPreference",entityId:org.id,
    detail:JSON.stringify({organizationId:org.id,purpose:values.purpose,
     channel:"email",from:existing?.enabled||false,to:values.enabled,
     quietHoursChanged:existing?.quietStartHour!==values.quietStartHour||
      existing?.quietEndHour!==values.quietEndHour})
   }});
   return row;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return ok({saved:true,preference:updated,organizationId:org.id});
 });
}

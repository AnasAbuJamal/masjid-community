import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
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
// The complete optional email choice form must commit both purposes together.
// Reject unknown categories, duplicate purposes, extra keys or partial batches.
const batchChange=z.object({preferences:z.tuple([change,change])}).strict()
 .refine(v=>v.preferences[0].purpose!==v.preferences[1].purpose,
  {message:"A batch must contain two distinct optional email purposes."});
const requestChange=z.union([change,batchChange]);

async function context(req:NextRequest){
 const {user,org}=await requireMemberContext(req);
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
  const input=requestChange.parse(await jsonBody(req));
  const changes="preferences" in input?input.preferences:[input];
  const now=new Date();
  let updated:Array<{purpose:string;enabled:boolean;quietStartHour:number|null;
   quietEndHour:number|null;updatedAt:Date}>;
  try{
   updated=await db.$transaction(async tx=>{
    const rows=[];
    for(const values of changes){
     const key={organizationId:org.id,userId:user.id,purpose:values.purpose,
      channel:"email" as const};
     const existing=await tx.organizationDeliveryPreference.findUnique({where:{
      organizationId_userId_purpose_channel:key
     },select:{id:true,enabled:true,quietStartHour:true,quietEndHour:true,consentedAt:true}});
     const row=await tx.organizationDeliveryPreference.upsert({where:{
      organizationId_userId_purpose_channel:key
     },create:{
      ...key,enabled:values.enabled,consentedAt:values.enabled?now:null,
      quietStartHour:values.quietStartHour,quietEndHour:values.quietEndHour
     },update:{
      enabled:values.enabled,
      // Consent withdrawal must never retain a previously usable opt-in.
      consentedAt:values.enabled?
       (existing?.enabled&&existing.consentedAt?undefined:now):null,
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
     rows.push(row);
    }
    return rows;
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&
      ["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"PREFERENCES_CHANGED",
     "Email choices changed in another session. Refresh and review before retrying.");
   throw error;
  }
  return ok("preferences" in input?
   {saved:true,preferences:updated,organizationId:org.id}:
   {saved:true,preference:updated[0],organizationId:org.id});
 });
}

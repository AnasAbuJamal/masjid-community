import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";

export async function GET(req:NextRequest){
 return handled(async()=>{
  const member=await requireVerified(req);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const memberships=await db.circleMember.findMany({
   where:{userId:member.id,circle:{organizationId:org.id,status:"published"}},
   orderBy:[{requestedAt:"desc"},{id:"asc"}],take:100,
   select:{id:true,status:true,requestedAt:true,reviewedAt:true,
    circle:{select:{id:true,title:true,summary:true,cadence:true}}}
  });
  const approvedIds=memberships.filter(m=>m.status==="approved").map(m=>m.circle.id);
  const updates=approvedIds.length?await db.circleUpdate.findMany({
   where:{circleId:{in:approvedIds},circle:{
    organizationId:org.id,status:"published",
    members:{some:{userId:member.id,status:"approved"}}
   }},
   orderBy:[{publishedAt:"desc"},{id:"desc"}],take:100,
   select:{id:true,circleId:true,body:true,publishedAt:true,revision:true}
  }):[];
  return ok({memberships,updates,
   privacy:"Updates visible only while membership is approved. No other members or contact details are included."});
 });
}

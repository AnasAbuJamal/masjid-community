import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireActor,sessionFrom,tokenHash} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

// Only established, verified active memberships are selectable. Do not
// conflate global User.role with a role for a different organization.
const select=z.object({organizationId:z.string().min(8).max(128)}).strict();
async function principal(req:NextRequest){
 const user=await requireActor(req);
 if(!user.verifiedAt)throw new HttpError(403,"EMAIL_NOT_VERIFIED","Verify your email first.");
 const home=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}],
  select:{id:true,name:true}});
 if(!home)throw new HttpError(503,"NOT_CONFIGURED","No community is configured.");
 return {user,home};
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,home}=await principal(req);
  const session=await db.authSession.findUnique({where:{tokenHash:tokenHash(sessionFrom(req))},
   select:{userId:true,selectedOrganizationId:true,revokedAt:true,expiresAt:true}});
  if(!session||session.userId!==user.id||session.revokedAt||session.expiresAt<=new Date())
   throw new HttpError(401,"UNAUTHENTICATED","Please sign in.");
  const memberships=await db.organizationMembership.findMany({where:{
   userId:user.id,status:"active"
  },select:{organization:{select:{id:true,name:true,slug:true,timeZone:true}}},
   orderBy:{joinedAt:"asc"},take:100});
  const selectedId=session.selectedOrganizationId||home.id;
  const choices=memberships.map(m=>({
   ...m.organization,
   selectable:m.organization.id===home.id||user.role==="member",
   memberWorkspace:m.organization.id===home.id?"pilot":"inbox_and_preferences_only"
  }));
  return ok({selectedOrganizationId:selectedId,
   selectedActive:choices.some(x=>x.id===selectedId),
   organizations:choices,
   policy:"Mosque choices belong to this one session. A second mosque currently supports only its member dashboard, private notifications and optional email preferences; all other private workflows stay locked. No privileged global role transfers to another mosque."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {user,home}=await principal(req);
  const {organizationId}=select.parse(await jsonBody(req));
  if(organizationId!==home.id&&user.role!=="member")
   throw new HttpError(403,"TENANT_ROLE_ISOLATION",
    "Privileged identity and role isolation must be reviewed before switching away from the pilot mosque.");
  const result=await db.$transaction(async tx=>{
   const membership=await tx.organizationMembership.findUnique({where:{
    organizationId_userId:{organizationId,userId:user.id}
   },select:{status:true,organization:{select:{id:true,name:true,slug:true,timeZone:true}}}});
   if(membership?.status!=="active")throw new HttpError(404,"MEMBERSHIP_UNAVAILABLE",
    "This mosque is not an active, verified membership of this account.");
   const changed=await tx.authSession.updateMany({where:{
    tokenHash:tokenHash(sessionFrom(req)),userId:user.id,
    revokedAt:null,expiresAt:{gt:new Date()}
   },data:{selectedOrganizationId:organizationId===home.id?null:organizationId}});
   if(!changed.count)throw new HttpError(401,"UNAUTHENTICATED","Session expired or revoked.");
   await tx.auditEvent.create({data:{
    actorId:user.id,action:"membership.context.select",entity:"Organization",
    entityId:organizationId,
    detail:JSON.stringify({selectedOrganizationId:organizationId,mode:organizationId===home.id?"pilot":"limited_member"})
   }});
   return membership.organization;
  });
  return ok({selectedOrganizationId:result.id,organization:result,
   limited:result.id!==home.id,
   policy:result.id===home.id?"Primary community workspace.":"Limited member context. Only /me, /me/preferences and notification read actions support this mosque. Unsupported private actions are blocked."});
 });
}

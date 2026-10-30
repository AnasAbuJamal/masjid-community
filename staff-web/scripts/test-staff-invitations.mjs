// Staff invitations: verified identity, two-stage consent, authenticator and
// scoped single-use grants. Disposable masjid_ci PostgreSQL / synthetic users.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash,randomBytes} from "node:crypto";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("/masjid_ci")||
 process.env.SILA_INVITE_CI_CAPTURE!=="test-only")
 throw Error("Invitation tests require the isolated invitation-capture CI database.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
const userIds=[],sessionIds=[],invitationIds=[],emails=[];
let foreignOrgId=null;
async function makeUser(label,{verified=true,mfa=true,joinHome=true,role="member"}={}){
 const user=await db.user.create({data:{
  email:"invite-"+label+"-"+Date.now()+"@example.test",passwordHash:basePassword,
  firstName:"Synthetic",lastName:label,role,
  verifiedAt:verified?new Date():null,
  mfaEnabledAt:mfa?new Date():null,
  ...(joinHome?{memberships:{create:{organizationId:org.id}}}:{})
 }});
 userIds.push(user.id);emails.push(user.email);
 return user;
}
async function session(user,mfa=true){
 const token=randomBytes(32).toString("base64url");
 const saved=await db.authSession.create({data:{
  userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:mfa?new Date():null
 }});
 sessionIds.push(saved.id);
 return token;
}
let org,basePassword;
try{
 org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 basePassword=member.passwordHash;
 const adminToken=await session(admin,true);
 const adminWithoutMfa=await session(admin,false);
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(memberLogin.status,200);
 const memberToken=memberLogin.data.token;
 const primary=await makeUser("primary");
 const primaryWithoutMfa=await session(primary,false);
 const primaryWithMfa=await session(primary,true);
 const pendingInput={action:"issue",email:primary.email,
  capabilities:["community_moderate","volunteers_manage"],expiresHours:24};
 assert.equal((await request("admin/invitations","POST",pendingInput)).status,401,
  "guest cannot issue new staff privileges");
 assert.equal((await request("admin/invitations","POST",pendingInput,memberToken)).status,403,
  "ordinary member cannot issue privileges");
 assert.equal((await request("admin/invitations","POST",pendingInput,adminWithoutMfa)).status,403,
  "no staff invitation issue before administrator session MFA");
 const bypass=await request("admin/team","POST",{
  kind:"role",userId:primary.id,role:"staff"
 },adminToken);
 assert.equal(bypass.status,409,"old role editor cannot bypass invited acceptance");
 assert.equal(bypass.error.code,"INVITATION_REQUIRED");
 const careDenied=await request("admin/invitations","POST",{
  ...pendingInput,capabilities:["care_manage"]
 },adminToken);
 assert.equal(careDenied.status,422,"sensitive care privileges cannot be invited");
 const issued=await request("admin/invitations","POST",pendingInput,adminToken);
 assert.equal(issued.status,201,JSON.stringify(issued));
 assert.equal(issued.data.delivery,"synthetic-ci-capture");
 assert.match(issued.data.ciOnlyToken,/^[a-f0-9]{64}$/);
 invitationIds.push(issued.data.id);
 const token=issued.data.ciOnlyToken;
 const saved=await db.staffInvitation.findUniqueOrThrow({where:{id:issued.data.id}});
 assert.equal(saved.organizationId,org.id);
 assert.equal(saved.invitedEmail,primary.email);
 assert.equal(saved.tokenHash,createHash("sha256").update(token).digest("hex"));
 assert.ok(!JSON.stringify(saved).includes(token),"no raw invitation secrets in database");
 assert.equal((await db.user.findUniqueOrThrow({where:{id:primary.id}})).role,"member",
  "issuance alone never promotes an identity");
 const listing=await request("admin/invitations","GET",undefined,adminToken);
 assert.equal(listing.status,200);
 assert.ok(listing.data.items.some(i=>i.id===saved.id));
 assert.ok(!JSON.stringify(listing.data).includes(token),"administrative ledger cannot reread raw secrets");
 assert.equal((await request("admin/invitations","GET",undefined,memberToken)).status,403);
 assert.equal((await request("invitations","POST",{action:"preview",token})).status,401);
 assert.equal((await request("invitations","POST",{action:"preview",token},memberToken)).status,404,
  "possessing a link under a different identity cannot reveal its scope");
 assert.equal((await request("invitations","POST",{action:"accept",token},memberToken)).status,404,
  "a stolen link cannot be used by a different email");
 const preview=await request("invitations","POST",{action:"preview",token},primaryWithoutMfa);
 assert.equal(preview.status,200);
 assert.equal(preview.data.organization.name,org.name);
 assert.deepEqual(preview.data.capabilities.sort(),pendingInput.capabilities.sort());
 assert.equal(preview.data.mfaEnabled,true);
 assert.equal(preview.data.mfaVerified,false);
 const staleToken=await session(primary,true);
 await db.authSession.updateMany({where:{
  tokenHash:createHash("sha256").update(staleToken).digest("hex")
 },data:{mfaVerifiedAt:new Date(Date.now()-12*60000)}});
 const stalePreview=await request("invitations","POST",{action:"preview",token},staleToken);
 assert.equal(stalePreview.status,200);
 assert.equal(stalePreview.data.mfaVerified,false,
  "a stale authenticator check cannot authorize new privileges");
 const staleAccept=await request("invitations","POST",{action:"accept",token},staleToken);
 assert.equal(staleAccept.status,403);
 assert.equal(staleAccept.error.code,"INVITE_MFA_REQUIRED");
 const premature=await request("invitations","POST",{action:"accept",token},primaryWithoutMfa);
 assert.equal(premature.status,403,"even authenticator-enrolled accounts must verify the current session");
 assert.equal(premature.error.code,"INVITE_MFA_REQUIRED");
 assert.equal(await db.roleGrant.count({where:{membership:{userId:primary.id}}}),0,
  "no capabilities before explicit verified acceptance");
 const accepted=await request("invitations","POST",{action:"accept",token},primaryWithMfa);
 assert.equal(accepted.status,200,JSON.stringify(accepted));
 assert.equal(accepted.data.role,"staff");
 assert.equal(accepted.data.sessionRevoked,true);
 assert.deepEqual(accepted.data.capabilities.sort(),pendingInput.capabilities.sort());
 assert.ok(new Date(accepted.data.grantExpiresAt)>new Date());
 assert.equal((await db.user.findUniqueOrThrow({where:{id:primary.id}})).role,"staff");
 const grants=await db.roleGrant.findMany({where:{
  membership:{userId:primary.id,organizationId:org.id},revokedAt:null
 }});
 assert.equal(grants.length,2);
 assert.ok(grants.every(g=>g.expiresAt&&g.expiresAt<=new Date(Date.now()+15*86400000)));
 assert.equal((await request("staff/capabilities","GET",undefined,primaryWithMfa)).status,401,
  "invitation acceptance revokes all existing recipient sessions");
 assert.equal((await request("invitations","POST",{action:"accept",token},primaryWithMfa)).status,401,
  "revoked session cannot replay a staff invitation");
 const newLogin=await request("auth/login","POST",{email:primary.email,password});
 assert.equal(newLogin.status,200);
 assert.equal(newLogin.data.user.role,"staff");
 assert.equal(newLogin.data.user.mfaRequired,true);
 const noMfaStaff=await request("staff/capabilities","GET",undefined,newLogin.data.token);
 assert.equal(noMfaStaff.status,403);
 assert.equal(noMfaStaff.error.code,"MFA_REQUIRED",
  "new invited staff need MFA in every new session");
 const newVerified=await session(primary,true);
 const staffCapabilities=await request("staff/capabilities","GET",undefined,newVerified);
 assert.equal(staffCapabilities.status,200);
 assert.deepEqual(staffCapabilities.data.capabilities.map(x=>x.capability).sort(),
  ["community_moderate","volunteers_manage"].sort());
 assert.equal((await request("invitations","POST",{action:"accept",token},newVerified)).status,404,
  "accepted token can never be replayed");

 const concurrency=await makeUser("concurrency");
 const concurrentToken=await session(concurrency,true);
 const queued=await request("admin/invitations","POST",{
  action:"issue",email:concurrency.email,capabilities:["facilities_manage"],expiresHours:2
 },adminToken);
 assert.equal(queued.status,201);
 invitationIds.push(queued.data.id);
 const raced=await Promise.all(Array.from({length:2},()=>request("invitations","POST",{
  action:"accept",token:queued.data.ciOnlyToken
 },concurrentToken)));
 assert.equal(raced.filter(x=>x.status===200).length,1,
  "only one concurrent accept can promote/grant an identity");
 assert.ok(raced.every(x=>[200,404,409,401].includes(x.status)));
 assert.equal(await db.roleGrant.count({where:{membership:{userId:concurrency.id}}}),1,
  "concurrency cannot duplicate grants");

 const revived=await makeUser("reissue");
 const old=await request("admin/invitations","POST",{
  action:"issue",email:revived.email,capabilities:["community_moderate"],expiresHours:24
 },adminToken);
 assert.equal(old.status,201);
 invitationIds.push(old.data.id);
 const fresh=await request("admin/invitations","POST",{
  action:"issue",email:revived.email,capabilities:["volunteers_manage"],expiresHours:24
 },adminToken);
 assert.equal(fresh.status,201);
 invitationIds.push(fresh.data.id);
 assert.equal((await db.staffInvitation.findUniqueOrThrow({where:{id:old.data.id}})).revokedAt instanceof Date,true,
  "resending a link revokes every older pending link for this person and mosque");
 const revivedToken=await session(revived,true);
 assert.equal((await request("invitations","POST",{
  action:"preview",token:old.data.ciOnlyToken
 },revivedToken)).status,404);
 const revoked=await request("admin/invitations","POST",{
  action:"revoke",id:fresh.data.id
 },adminToken);
 assert.equal(revoked.status,200);
 assert.equal((await request("invitations","POST",{
  action:"accept",token:fresh.data.ciOnlyToken
 },revivedToken)).status,404,
  "steward revocation invalidates the exact invitee's link");
 assert.equal((await db.user.findUniqueOrThrow({where:{id:revived.id}})).role,"member");
 const oldExpiry=await makeUser("expired");
 const expiredToken=randomBytes(32).toString("hex");
 const expired=await db.staffInvitation.create({data:{
  organizationId:org.id,invitedEmail:oldExpiry.email,
  tokenHash:createHash("sha256").update(expiredToken).digest("hex"),
  capabilities:["worship_publish"],issuedById:admin.id,
  expiresAt:new Date(Date.now()-60000)
 }});
 invitationIds.push(expired.id);
 const expiredActor=await session(oldExpiry,true);
 assert.equal((await request("invitations","POST",{
  action:"accept",token:expiredToken
 },expiredActor)).status,404,"expired invitations cannot grant authority");

 const unverified=await makeUser("unverified",{verified:false});
 const unverifiedIssued=await request("admin/invitations","POST",{
  action:"issue",email:unverified.email,capabilities:["community_moderate"],expiresHours:8
 },adminToken);
 assert.equal(unverifiedIssued.status,201);
 invitationIds.push(unverifiedIssued.data.id);
 const noEmailVerification=await session(unverified,true);
 assert.equal((await request("invitations","POST",{
  action:"accept",token:unverifiedIssued.data.ciOnlyToken
 },noEmailVerification)).status,403,"unverified email cannot accept staff privileges");
 const missingAuthenticator=await makeUser("no-mfa",{mfa:false});
 const noMfaInvite=await request("admin/invitations","POST",{
  action:"issue",email:missingAuthenticator.email,capabilities:["community_moderate"],expiresHours:8
 },adminToken);
 assert.equal(noMfaInvite.status,201);
 invitationIds.push(noMfaInvite.data.id);
 const impossibleMfa=await session(missingAuthenticator,true);
 const beforeEnroll=await request("invitations","POST",{
  action:"accept",token:noMfaInvite.data.ciOnlyToken
 },impossibleMfa);
 assert.equal(beforeEnroll.status,403,"a fake session flag cannot replace enrollment of real MFA");
 assert.equal(beforeEnroll.error.code,"INVITE_MFA_REQUIRED");

 foreignOrgId=(await db.organization.create({data:{
  slug:"invite-cross-org-"+Date.now(),name:"Different mosque staff"
 }})).id;
 const foreign=await makeUser("foreign",{joinHome:true});
 await db.organizationMembership.create({data:{
  organizationId:foreignOrgId,userId:foreign.id
 }});
 const rejectedIssue=await request("admin/invitations","POST",{
  action:"issue",email:foreign.email,capabilities:["community_moderate"],expiresHours:24
 },adminToken);
 assert.equal(rejectedIssue.status,409,
  "global account role cannot be changed while an identity belongs to a second mosque");
 assert.equal(rejectedIssue.error.code,"INVITATION_ELIGIBILITY");
 const foreignToken=randomBytes(32).toString("hex");
 const forgedLocal=await db.staffInvitation.create({data:{
  organizationId:org.id,invitedEmail:foreign.email,
  tokenHash:createHash("sha256").update(foreignToken).digest("hex"),
  capabilities:["community_moderate"],issuedById:admin.id,
  expiresAt:new Date(Date.now()+3600000)
 }});
 invitationIds.push(forgedLocal.id);
 const foreignSession=await session(foreign,true);
 const cross=await request("invitations","POST",{
  action:"accept",token:foreignToken
 },foreignSession);
 assert.equal(cross.status,409);
 assert.equal(cross.error.code,"MULTI_ORG_REVIEW");
 assert.equal((await db.user.findUniqueOrThrow({where:{id:foreign.id}})).role,"member");
 assert.equal((await db.staffInvitation.findUniqueOrThrow({where:{id:forgedLocal.id}})).acceptedAt,null,
  "cross-org denial does not consume invitation or grant privileges");
 const externalToken=randomBytes(32).toString("hex");
 const foreignIssued=await db.staffInvitation.create({data:{
  organizationId:foreignOrgId,invitedEmail:foreign.email,
  tokenHash:createHash("sha256").update(externalToken).digest("hex"),
  capabilities:["community_moderate"],issuedById:admin.id,
  expiresAt:new Date(Date.now()+3600000)
 }});
 invitationIds.push(foreignIssued.id);
 assert.equal((await request("invitations","POST",{
  action:"preview",token:externalToken
 },foreignSession)).status,404,"a foreign-mosque token cannot select a different tenant");

 const logs=await db.auditEvent.findMany({where:{
  entity:"StaffInvitation",entityId:issued.data.id
 }});
 assert.ok(logs.some(x=>x.action==="staff.invitation.issue"&&x.actorId===admin.id));
 assert.ok(logs.some(x=>x.action==="staff.invitation.accept"&&x.actorId===primary.id));
 assert.ok(!JSON.stringify(logs).includes(token),"audit data never stores raw invitation secret");
 console.log("Verified secure one-time steward invitation, member MFA, replay/race, revoked/expired links, no care permission and multi-org denial.");
}finally{
 if(invitationIds.length)await db.staffInvitation.deleteMany({where:{id:{in:invitationIds}}});
 if(sessionIds.length)await db.authSession.deleteMany({where:{id:{in:sessionIds}}});
 if(userIds.length){
  await db.authSession.deleteMany({where:{userId:{in:userIds}}});
  await db.auditEvent.deleteMany({where:{actorId:{in:userIds}}});
  await db.roleGrant.deleteMany({where:{membership:{userId:{in:userIds}}}});
  await db.organizationMembership.deleteMany({where:{userId:{in:userIds}}});
  await db.user.deleteMany({where:{id:{in:userIds}}});
 }
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

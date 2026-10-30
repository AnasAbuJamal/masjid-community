// F-044: scoped read-only auditor authority. Disposable PostgreSQL and
// localhost synthetic HTTP only; never operate against real identities.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 process.env.GITHUB_ACTIONS!=="true"||
 process.env.DATABASE_URL!=="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci")
 throw Error("Auditor tests require disposable localhost masjid_ci.");
const {adminEmail,memberEmail,password}=JSON.parse(
 readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
const sessions=[],users=[];
let foreignOrgId=null,foreignMembershipId=null;
async function call(path,method="GET",body,token,headers={}){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{authorization:"Bearer "+token}:{}),
  ...(body?{"content-type":"application/json"}:{}),...headers
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
async function session(user,mfa){
 const token=randomBytes(32).toString("base64url");
 const saved=await db.authSession.create({data:{
  userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:mfa?new Date():null
 }});
 sessions.push(saved.id);return token;
}
try{
 const org=await db.organization.findFirstOrThrow({orderBy:{createdAt:"asc"}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const adminToken=await session(admin,true);
 const reviewer=await db.user.create({data:{
  email:"ci-auditor-"+randomUUID()+"@example.test",
  firstName:"Independent",lastName:"Reviewer",role:"staff",status:"active",
  verifiedAt:new Date(),mfaEnabledAt:new Date(),passwordHash:member.passwordHash,
  memberships:{create:{organizationId:org.id}}
 }});
 users.push(reviewer.id);
 const unverifiedMfa=await session(reviewer,false);
 const memberToken=await session(member,false);
 const noGrant=await session(reviewer,true);
 const route="admin/integrity-audit";
 assert.equal((await call(route)).status,401);
 assert.equal((await call(route,"GET",undefined,memberToken)).status,403);
 assert.equal((await call(route,"GET",undefined,noGrant)).error.code,"AUDIT_REVIEW_REQUIRED");
 assert.equal((await call(route,"GET",undefined,unverifiedMfa)).error.code,"MFA_REQUIRED");
 assert.equal((await call("admin/team","GET",undefined,noGrant)).status,403);
 const invalid=await call("admin/team","POST",{
  kind:"grant",userId:reviewer.id,capability:"audit_review"
 },adminToken);
 assert.equal(invalid.status,422,"auditor grant must expire");
 const tooLong=await call("admin/team","POST",{
  kind:"grant",userId:reviewer.id,capability:"audit_review",
  expiresAt:new Date(Date.now()+31*86400000).toISOString()
 },adminToken);
 assert.equal(tooLong.status,422,"auditor grant cannot exceed 30 days");
 const granted=await call("admin/team","POST",{
  kind:"grant",userId:reviewer.id,capability:"audit_review",
  expiresAt:new Date(Date.now()+86400000).toISOString()
 },adminToken);
 assert.equal(granted.status,200,JSON.stringify(granted));
 // Grant revokes all old sessions. A new MFA-confirmed session is required.
 assert.equal((await call(route,"GET",undefined,noGrant)).status,401);
 const authorized=await session(reviewer,true);
 const reviewed=await call(route,"GET",undefined,authorized);
 assert.equal(reviewed.status,200,JSON.stringify(reviewed));
 assert.equal(reviewed.data.organization.name,org.name);
 assert.equal(reviewed.data.verification.state,"verified");
 assert.ok(!JSON.stringify(reviewed.data).includes(member.email));
 assert.ok(reviewed.data.records.every(x=>!Object.hasOwn(x,"entityId")));
 assert.equal((await call("admin/team","GET",undefined,authorized)).status,403,
  "auditor cannot modify or enumerate staff");
 assert.equal((await call("admin/finance","GET",undefined,authorized)).status,403,
  "auditor cannot view finance");
 assert.equal((await call("admin/privacy","GET",undefined,authorized)).status,403,
  "auditor cannot view privacy review");
 const foreign=await db.organization.create({data:{
  slug:"ci-auditor-foreign-"+randomUUID(),name:"Foreign private mosque"
 }});
 foreignOrgId=foreign.id;
 foreignMembershipId=(await db.organizationMembership.create({data:{
  organizationId:foreign.id,userId:reviewer.id
 }})).id;
 const forged=await call(route+"?organizationId="+foreign.id,
  "GET",undefined,authorized,{"x-organization-id":foreign.id});
 assert.equal(forged.status,200);
 assert.equal(forged.data.organization.name,org.name);
 assert.ok(!JSON.stringify(forged.data).includes(foreign.name));
 const context=await call("organizations/context","POST",{organizationId:foreign.id},authorized);
 assert.equal(context.status,403,"privileged identity cannot select foreign mosque");
 const revoke=await call("admin/team","POST",{
  kind:"revoke",userId:reviewer.id,capability:"audit_review"
 },adminToken);
 assert.equal(revoke.status,200);
 const afterRevoke=await session(reviewer,true);
 assert.equal((await call(route,"GET",undefined,afterRevoke)).error.code,"AUDIT_REVIEW_REQUIRED");
 const regrant=await call("admin/team","POST",{
  kind:"grant",userId:reviewer.id,capability:"audit_review",
  expiresAt:new Date(Date.now()+86400000).toISOString()
 },adminToken);
 assert.equal(regrant.status,200);
 const expired=await db.roleGrant.updateMany({where:{
  membership:{organizationId:org.id,userId:reviewer.id},capability:"audit_review"
 },data:{expiresAt:new Date(Date.now()-1000)}});
 assert.equal(expired.count,1);
 const afterExpiry=await session(reviewer,true);
 assert.equal((await call(route,"GET",undefined,afterExpiry)).error.code,"AUDIT_REVIEW_REQUIRED");
 // A database grant without an enrolled authenticator is not enough.
 await db.user.update({where:{id:reviewer.id},data:{mfaEnabledAt:null}});
 const unenrolled=await session(reviewer,false);
 assert.equal((await call(route,"GET",undefined,unenrolled)).error.code,"AUDITOR_MFA_REQUIRED");
 await db.user.update({where:{id:reviewer.id},data:{mfaEnabledAt:new Date()}});
 const suspended=await call("admin/team","POST",{
  kind:"membership",userId:reviewer.id,status:"suspended"
 },adminToken);
 assert.equal(suspended.status,200);
 const afterSuspend=await session(reviewer,true);
 assert.equal((await call(route,"GET",undefined,afterSuspend)).status,403);
 console.log("Verified bounded auditor grant, fresh MFA, read-only isolation, tenant denial, expiry, revocation and suspension.");
}finally{
 if(sessions.length)await db.authSession.deleteMany({where:{id:{in:sessions}}});
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 if(users.length){
  await db.authSession.deleteMany({where:{userId:{in:users}}});
  await db.auditEvent.deleteMany({where:{actorId:{in:users}}});
  await db.roleGrant.deleteMany({where:{membership:{userId:{in:users}}}});
  await db.organizationMembership.deleteMany({where:{userId:{in:users}}});
  await db.user.deleteMany({where:{id:{in:users}}});
 }
 await db.$disconnect();
}

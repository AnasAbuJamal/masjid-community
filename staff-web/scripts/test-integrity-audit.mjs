// F-044 synthetic integrity-audit regression: multi-user authorization,
// per-tenant scope, concurrent high-risk changes, HMAC validation and DB-level
// tamper resistance. Runs ONLY in ephemeral GitHub Actions PostgreSQL CI.
import assert from "node:assert/strict";
import {createHash,createHmac,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 process.env.GITHUB_ACTIONS!=="true"||
 !process.env.DATABASE_URL?.endsWith("/masjid_ci")||
 !/^[0-9a-f]{64}$/i.test(process.env.SILA_AUDIT_HMAC_KEY||""))
 throw Error("Sealed audit tests require isolated CI and synthetic HMAC key.");
const {adminEmail,memberEmail,password}=JSON.parse(
 readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
const fakeUsers=[],fakeSessions=[],fakeGrants=[];
let foreignId=null,foreignMembershipId=null;
async function req(path,method="GET",body,token,headers={}){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{authorization:"Bearer "+token}:{}),
  ...(body?{"content-type":"application/json"}:{}),...headers
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
async function session(user,mfa){
 const token=randomBytes(32).toString("base64url");
 const saved=await db.authSession.create({data:{
  userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:mfa?new Date():null
 }});
 fakeSessions.push(saved.id);return token;
}
function canonical(value){
 if(value===null||typeof value!=="object")return JSON.stringify(value)??"null";
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 return "{"+Object.keys(value).sort().map(k=>
  JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
}
function recalculated(v){
 const payload={
  version:1,id:v.id,organizationId:v.organizationId,actorId:v.actorId,
  sequence:v.sequence,occurredAt:v.occurredAt.toISOString(),
  requestId:v.requestId,action:v.action,entity:v.entity,
  entityId:v.entityId,outcome:v.outcome,
  evidence:v.evidence,previousHash:v.previousHash
 };
 return createHmac("sha256",Buffer.from(process.env.SILA_AUDIT_HMAC_KEY,"hex"))
  .update(canonical(payload),"utf8").digest("hex");
}
try{
 const org=await db.organization.findFirstOrThrow({orderBy:{createdAt:"asc"}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const memberLogin=await req("auth/login","POST",{email:memberEmail,password});
 assert.equal(memberLogin.status,200);
 const memberToken=memberLogin.data.token;
 const adminToken=await session(admin,true);
 const noMfa=await session(admin,false);
 assert.equal((await req("admin/integrity-audit")).status,401);
 assert.equal((await req("admin/integrity-audit","GET",undefined,memberToken)).status,403);
 const notVerified=await req("admin/integrity-audit","GET",undefined,noMfa);
 assert.equal(notVerified.status,403);
 assert.equal(notVerified.error.code,"MFA_REQUIRED");
 const before=await req("admin/integrity-audit","GET",undefined,adminToken);
 assert.equal(before.status,200,JSON.stringify(before));
 assert.equal(before.data.verification.state,"verified");
 assert.ok(before.data.verification.checked>=1,
  "prior staff invitation issue/accept actions must create real protected history");
 const first=await db.integrityAuditEvent.findFirst({
  where:{organizationId:org.id},orderBy:{sequence:"asc"}
 });
 assert.ok(first);
 assert.equal(first.sequence,1);
 assert.equal(first.previousHash,"0".repeat(64));
 assert.equal(first.recordHash,recalculated(first),
  "independent Node HMAC calculation must verify Postgres JSONB canonicalization");
 assert.ok(!JSON.stringify(before.data).includes(memberEmail),
  "sealed audit viewer must not expose member contact addresses");
 const targetIds=[];
 for(let i=0;i<4;i++){
  const user=await db.user.create({data:{
   email:"integrity-audit-"+i+"-"+randomUUID()+"@example.test",
   firstName:"Audit",lastName:"Subject",role:"staff",status:"active",
   verifiedAt:new Date(),mfaEnabledAt:new Date(),passwordHash:member.passwordHash,
   memberships:{create:{organizationId:org.id}}
  }});
  targetIds.push(user.id);fakeUsers.push(user.id);
 }
 const observedTrace="ci_audit_trace_"+randomUUID().replaceAll("-","").slice(0,18);
 const calls=await Promise.all(targetIds.map((userId,i)=>req("admin/team","POST",{
  kind:"grant",userId,
  capability:["community_moderate","facilities_manage","volunteers_manage","worship_publish"][i],
  expiresAt:new Date(Date.now()+86400000).toISOString()
 },adminToken,{"x-request-id":i===0?observedTrace:"invalid trace id with spaces!"})));
 assert.ok(calls.every(x=>x.status===200),JSON.stringify(calls));
 const revoke=await req("admin/team","POST",{
  kind:"revoke",userId:targetIds[0],capability:"community_moderate"
 },adminToken);
 assert.equal(revoke.status,200);
 const revokeAgain=await req("admin/team","POST",{
  kind:"revoke",userId:targetIds[0],capability:"community_moderate"
 },adminToken);
 assert.equal(revokeAgain.status,404,"invalid repeat grants must not append success event");
 const suspended=await req("admin/team","POST",{
  kind:"membership",userId:targetIds[1],status:"suspended"
 },adminToken);
 assert.equal(suspended.status,200);
 const promoteBypass=await req("admin/team","POST",{
  kind:"role",userId:targetIds[2],role:"staff"
 },adminToken);
 assert.equal(promoteBypass.status,200,
  "keeping the already-approved staff role is an auditable state operation");
 const after=await req("admin/integrity-audit","GET",undefined,adminToken);
 assert.equal(after.status,200,JSON.stringify(after));
 assert.equal(after.data.verification.state,"verified");
 assert.equal(after.data.verification.checked,before.data.verification.checked+7,
  "four grants, a revocation, a suspension and an existing-role review each append exactly once");
 assert.ok(after.data.records.some(x=>x.requestId===observedTrace),
  "bounded trace ID links request and protected audit history");
 const recent=await db.integrityAuditEvent.findMany({where:{
  organizationId:org.id,sequence:{gt:before.data.verification.checked}
 },orderBy:{sequence:"asc"}});
 assert.equal(recent.length,7);
 assert.ok(recent.every(x=>x.actorId===admin.id));
 assert.equal(recent[0].requestId,observedTrace);
 assert.ok(recent.slice(1,4).every(x=>/^[0-9a-f-]{36}$/i.test(x.requestId)),
  "untrusted or malformed request IDs must be replaced by server-generated identifiers");
 let last=before.data.verification.lastHash;
 let sequence=before.data.verification.checked;
 for(const row of recent){
  assert.equal(row.sequence,++sequence);
  assert.equal(row.previousHash,last);
  assert.equal(row.recordHash,recalculated(row));
  assert.equal(row.outcome,"allowed");
  last=row.recordHash;
 }
 assert.equal(last,after.data.verification.lastHash);
 assert.ok(recent.some(x=>x.action==="team.membership.suspended"));
 assert.ok(recent.some(x=>x.action==="team.capability.revoke"));
 assert.ok(recent.some(x=>x.evidence.capability==="worship_publish"));
 assert.ok(!JSON.stringify(recent).includes(member.email));
 assert.ok(!JSON.stringify(after.data).includes(member.id));
 assert.ok(after.data.records.every(x=>!Object.hasOwn(x,"entityId")),
  "general administrator viewer exposes no full subject IDs");
 const one=recent[0];
 await assert.rejects(
  db.integrityAuditEvent.update({where:{id:one.id},data:{action:"tampered"}}),
  "ordinary application DB credentials cannot rewrite sealed history");
 await assert.rejects(
  db.integrityAuditEvent.delete({where:{id:one.id}}),
  "ordinary application DB credentials cannot erase a sealed event");
 await assert.rejects(
  db.$executeRawUnsafe('TRUNCATE TABLE "IntegrityAuditEvent"'),
  "even accidental TRUNCATE is blocked by the DB trigger");
 const still=await req("admin/integrity-audit","GET",undefined,adminToken);
 assert.equal(still.status,200);
 assert.equal(still.data.verification.state,"verified");
 assert.equal(still.data.verification.checked,after.data.verification.checked);
 // The browser must not be able to set a foreign tenant via a query param or
 // arbitrary X-Organization-Id header. Current pilot always uses checked
 // active home membership; proper tenant switching is a later feature.
 const foreign=await db.organization.create({data:{
  slug:"audit-foreign-"+randomUUID(),name:"Other restricted mosque"
 }});
 foreignId=foreign.id;
 foreignMembershipId=(await db.organizationMembership.create({data:{
  organizationId:foreign.id,userId:admin.id
 }})).id;
 const forged=await req("admin/integrity-audit?organizationId="+foreign.id,
  "GET",undefined,adminToken,{"x-organization-id":foreign.id});
 assert.equal(forged.status,200);
 assert.equal(forged.data.verification.checked,after.data.verification.checked,
  "forged client tenant selection must not switch the audit chain");
 assert.equal(forged.data.organization.name,org.name);
 assert.ok(!JSON.stringify(forged.data).includes(foreign.name));
 console.log("Verified 7 concurrent and serial sealed actions, HMAC recomputation, immutable SQL triggers, MFA and foreign-tenant denial.");
}finally{
 if(fakeSessions.length)await db.authSession.deleteMany({where:{id:{in:fakeSessions}}});
 if(fakeUsers.length){
  await db.authSession.deleteMany({where:{userId:{in:fakeUsers}}});
  // Changing a synthetic staff role legitimately queues a service notice.
  // Clean the disposable recipient's outbox before deleting the identity;
  // the protected HMAC ledger itself must remain append-only.
  await db.outboxEvent.deleteMany({where:{userId:{in:fakeUsers}}});
  await db.notification.deleteMany({where:{userId:{in:fakeUsers}}});
  await db.auditEvent.deleteMany({where:{actorId:{in:fakeUsers}}});
  await db.roleGrant.deleteMany({where:{membership:{userId:{in:fakeUsers}}}});
  await db.organizationMembership.deleteMany({where:{userId:{in:fakeUsers}}});
  await db.user.deleteMany({where:{id:{in:fakeUsers}}});
 }
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(foreignId)await db.organization.deleteMany({where:{id:foreignId}});
 // The sealed event history is deliberately NOT deleted after tests. It is
 // retained only in the disposable CI DB, proving permanent append-only state.
 await db.$disconnect();
}

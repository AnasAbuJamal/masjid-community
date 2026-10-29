// Privacy requests and steward queue are tenant-scoped; the account belongs
// to the person while request disposition belongs only to the specified mosque.
// Synthetic fixtures only. Never run against live data.
import assert from "node:assert/strict";
import {randomBytes,createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Privacy tests require isolated masjid_ci PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
let foreignOrg=null,adminSession=null,localId=null,foreignId=null;
try {
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const login=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(login.status,200);
 const memberToken=login.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  mfaVerifiedAt:new Date(),expiresAt:new Date(Date.now()+3600000)
 }});
 const legacy=await db.deletionRequest.findFirst({where:{userId:member.id,organizationId:null}});
 assert.ok(legacy,"existing CI fixture has an unscoped historic request");
 foreignOrg=await db.organization.create({data:{
  slug:"privacy-scope-ci-"+Date.now(),name:"Unrelated private mosque"
 }});
 await db.organizationMembership.create({data:{organizationId:foreignOrg.id,userId:member.id}});
 const foreign=await db.deletionRequest.create({data:{
  organizationId:foreignOrg.id,userId:member.id,
  reason:"Foreign confidential request. Do not show to first mosque."
 }});
 foreignId=foreign.id;
 const guest=await request("account/deletion-request","POST",{confirm:true});
 assert.equal(guest.status,401,"guest cannot create a privacy request");
 const guestAdmin=await request("admin/privacy");
 assert.equal(guestAdmin.status,401,"guest cannot read privacy desk");
 const memberAdmin=await request("admin/privacy","GET",undefined,memberToken);
 assert.equal(memberAdmin.status,403,"ordinary member cannot read privacy desk");
 const missingConfirm=await request("account/deletion-request","POST",{
  confirm:false,reason:"Please review organization-held records"
 },memberToken);
 assert.equal(missingConfirm.status,422,"request requires explicit confirmation");
 const created=await request("account/deletion-request","POST",{
  confirm:true,reason:"Review records held by my current mosque"
 },memberToken);
 assert.equal(created.status,201,"historic unscoped request must not block a new mosque request");
 localId=created.data.id;
 assert.notEqual(localId,legacy.id);
 assert.notEqual(localId,foreignId);
 const persisted=await db.deletionRequest.findUniqueOrThrow({where:{id:localId}});
 assert.equal(persisted.organizationId,org.id,"request belongs to active mosque");
 assert.equal(persisted.userId,member.id);
 assert.equal(persisted.status,"pending");
 const duplicate=await request("account/deletion-request","POST",{
  confirm:true,reason:"A second request should not be created"
 },memberToken);
 assert.equal(duplicate.status,200,"pending request is idempotent in same mosque");
 assert.equal(duplicate.data.id,localId);
 const account=await request("account","GET",undefined,memberToken);
 assert.equal(account.status,200);
 assert.equal(account.data.deletion.id,localId,"own settings show mosque-scoped request");
 assert.notEqual(account.data.deletion.id,foreignId);
 const desk=await request("admin/privacy","GET",undefined,adminToken);
 assert.equal(desk.status,200);
 assert.ok(desk.data.requests.some(x=>x.id===localId),"local request shown to steward");
 assert.ok(!desk.data.requests.some(x=>x.id===foreignId),"other mosque request never exposed");
 assert.ok(!desk.data.requests.some(x=>x.id===legacy.id),"legacy unowned request not silently assigned");
 assert.ok(!JSON.stringify(desk.data).includes("Foreign confidential request"),
  "foreign reason must not be disclosed");
 const crossDecision=await request("admin/privacy","PATCH",{
  id:foreignId,status:"rejected"
 },adminToken);
 assert.equal(crossDecision.status,409,"steward cannot decide foreign request by guessed ID");
 assert.equal((await db.deletionRequest.findUniqueOrThrow({where:{id:foreignId}})).status,"pending");
 const legacyDecision=await request("admin/privacy","PATCH",{
  id:legacy.id,status:"rejected"
 },adminToken);
 assert.equal(legacyDecision.status,409,"unscoped legacy requests must be manually reviewed");
 assert.equal((await db.deletionRequest.findUniqueOrThrow({where:{id:legacy.id}})).status,"pending");
 const reviewed=await request("admin/privacy","PATCH",{
  id:localId,status:"in_review"
 },adminToken);
 assert.equal(reviewed.status,200,"steward may begin reviewing their own mosque's request");
 assert.equal((await db.deletionRequest.findUniqueOrThrow({where:{id:localId}})).status,"in_review");
 const replay=await request("admin/privacy","PATCH",{
  id:localId,status:"rejected"
 },adminToken);
 assert.equal(replay.status,409,"cannot silently override a started review");
 const stillPending=await request("account/deletion-request","POST",{
  confirm:true
 },memberToken);
 assert.equal(stillPending.status,200,"under-review request remains idempotent");
 assert.equal(stillPending.data.id,localId);
 const audit=await db.auditEvent.findMany({where:{
  entity:"DeletionRequest",entityId:localId
 }});
 assert.ok(audit.some(x=>x.action==="account.deletion.request"));
 assert.ok(audit.some(x=>x.action==="privacy.deletion.in_review"&&x.detail?.includes(org.id)),
  "scoped review action is auditable");
 assert.equal(await db.deletionRequest.count({where:{id:foreignId,status:"pending"}}),1);
 assert.equal(await db.user.count({where:{id:member.id}}),1,"review does not delete account");
 console.log("Verified mosque-scoped privacy requests, steward decisions, legacy hold, idempotence and non-deletion.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 if(localId)await db.deletionRequest.deleteMany({where:{id:localId}});
 if(foreignId)await db.deletionRequest.deleteMany({where:{id:foreignId}});
 if(foreignOrg){
  await db.organizationMembership.deleteMany({where:{organizationId:foreignOrg.id}});
  await db.organization.deleteMany({where:{id:foreignOrg.id}});
 }
 await db.$disconnect();
}

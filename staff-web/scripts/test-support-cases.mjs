// F-050: all records and staff credentials below are synthetic and are
// created only in GitHub Actions' disposable PostgreSQL masjid_ci service.
import assert from "node:assert/strict";
import {randomBytes,randomUUID,createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
const DATABASE="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci";
if(process.env.GITHUB_ACTIONS!=="true"||process.env.VERCEL||
 process.env.NODE_ENV==="production"||process.env.DATABASE_URL!==DATABASE||
 !/^[0-9a-f]{64}$/i.test(process.env.SILA_AUDIT_HMAC_KEY||""))
 throw Error("Refusing private support tests outside disposable CI.");
const {adminEmail,memberEmail,password}=JSON.parse(
 readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),base="http://127.0.0.1:3000/api/v1/";
const caseIds=[],sessionIds=[];
let staffId=null,foreignId=null,foreignCaseId=null,grantId=null,org;
async function request(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{authorization:"Bearer "+token}:{}),
  ...(body?{"content-type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
async function makeSession(user,mfa=true){
 const token=randomBytes(32).toString("base64url");
 const stored=await db.authSession.create({data:{
  userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),
  mfaVerifiedAt:mfa?new Date():null
 }});
 sessionIds.push(stored.id);return token;
}
async function fetchAll(token,filter){
 const rows=[];
 let cursor=null;
 for(let i=0;i<8;i++){
  const path="admin/support"+(cursor?"?"+filter+"="+encodeURIComponent(cursor):"");
  const result=await request(path,"GET",undefined,token);
  assert.equal(result.status,200,JSON.stringify(result.error));
  assert.ok((result.data.items||result.data.notes).length<=50);
  rows.push(...(result.data.items||result.data.notes));
  if(result.data.complete){
   assert.equal(result.data.nextCursor,null);
   assert.equal(new Set(rows.map(x=>x.id)).size,rows.length,
    "no repeated support records when traversing all private pages");
   return rows;
  }
  assert.ok(result.data.nextCursor);
  cursor=result.data.nextCursor;
 }
 throw Error("Support history failed to finish");
}
try{
 org=await db.organization.findFirstOrThrow({orderBy:{createdAt:"asc"}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(memberLogin.status,200);
 const memberToken=memberLogin.data.token;
 const adminToken=await makeSession(admin);
 const staff=await db.user.create({data:{
  email:"support-"+randomUUID()+"@example.test",
  passwordHash:member.passwordHash,firstName:"Synthetic",lastName:"Support",
  role:"staff",status:"active",verifiedAt:new Date(),mfaEnabledAt:new Date(),
  memberships:{create:{organizationId:org.id}}
 }});
 staffId=staff.id;
 const noMfa=await makeSession(staff,false);
 const beforeGrant=await makeSession(staff,true);
 assert.equal((await request("admin/support")).status,401);
 assert.equal((await request("admin/support","GET",undefined,memberToken)).status,403);
 assert.equal((await request("admin/support","GET",undefined,adminToken)).status,403,
  "admins manage grants but cannot silently view sensitive support workspace");
 assert.equal((await request("admin/support","GET",undefined,noMfa)).status,403);
 assert.equal((await request("admin/support","GET",undefined,beforeGrant)).status,403);
 const noExpiry=await request("admin/team","POST",{
  kind:"grant",userId:staff.id,capability:"support_manage"
 },adminToken);
 assert.equal(noExpiry.status,422);
 const tooLong=await request("admin/team","POST",{
  kind:"grant",userId:staff.id,capability:"support_manage",
  expiresAt:new Date(Date.now()+9*86400000).toISOString()
 },adminToken);
 assert.equal(tooLong.status,422);
 const grant=await request("admin/team","POST",{
  kind:"grant",userId:staff.id,capability:"support_manage",
  expiresAt:new Date(Date.now()+6*86400000).toISOString()
 },adminToken);
 assert.equal(grant.status,200,JSON.stringify(grant));
 grantId=grant.data.id;
 assert.equal((await request("admin/support","GET",undefined,beforeGrant)).status,401,
  "grant must invalidate prior staff sessions");
 const token=await makeSession(staff);
 const initial=await request("admin/support","GET",undefined,token);
 assert.equal(initial.status,200);
 assert.equal(initial.data.mode,"list");
 assert.ok(initial.data.complete);
 assert.equal(initial.data.pageSize,50);
 assert.equal(initial.data.policy.includes("impersonate"),true);
 for(const invalid of ["admin/support?other=secret","admin/support?cursor=a",
  "admin/support?cursor=one_cursor&cursor=other_cursor",
  "admin/support?noteCursor="+randomUUID(),
  "admin/support?cursor="+randomUUID()+"&caseId="+randomUUID()]){
  assert.equal((await request(invalid,"GET",undefined,token)).status,422,invalid);
 }
 const traceId="support_test_"+randomUUID().replaceAll("-","");
 const created=await request("admin/support","POST",{
  kind:"create",traceId,category:"technical_fault"
 },token);
 assert.equal(created.status,200,JSON.stringify(created));
 const caseId=created.data.caseId;caseIds.push(caseId);
 assert.equal(created.data.status,"open");
 assert.equal((await request("admin/support","POST",{
  kind:"create",traceId,category:"technical_fault"
 },token)).status,409,"duplicate trace must fail rather than fork support history");
 assert.equal((await request("admin/support","POST",{
  kind:"create",traceId:"not@email.example",category:"technical_fault"
 },token)).status,422);
 assert.equal((await request("admin/support","POST",{
  kind:"create",traceId:"safe_ref_12345678",category:"medical_care"
 },token)).status,422);
 assert.equal((await request("admin/support","POST",{
  kind:"note",caseId,code:"investigation_started",
  body:"Private student details must never enter support notes"
 },token)).status,422);
 assert.equal((await request("admin/support","POST",{
  kind:"status",caseId,status:"resolved"
 },token)).status,409,"cannot close before investigation or evidence");
 assert.equal((await request("admin/support","POST",{
  kind:"status",caseId,status:"investigating"
 },token)).status,200);
 assert.equal((await request("admin/support","POST",{
  kind:"status",caseId,status:"resolved"
 },token)).status,409,"verified-resolution note required");
 const n1=await request("admin/support","POST",{
  kind:"note",caseId,code:"investigation_started"
 },token);
 assert.equal(n1.status,200);
 assert.equal((await request("admin/support","POST",{
  kind:"note",caseId,code:"arbitrary_private_note"
 },token)).status,422);
 const n2=await request("admin/support","POST",{
  kind:"note",caseId,code:"resolution_verified"
 },token);
 assert.equal(n2.status,200);
 const resolved=await request("admin/support","POST",{
  kind:"status",caseId,status:"resolved"
 },token);
 assert.equal(resolved.status,200);
 assert.equal(resolved.data.status,"resolved");
 const stored=await db.supportCase.findUniqueOrThrow({where:{id:caseId}});
 assert.ok(stored.resolvedAt);
 assert.equal((await request("admin/support","POST",{
  kind:"note",caseId,code:"investigation_started"
 },token)).status,409,"closed support case notes are immutable");
 assert.equal((await request("admin/support","POST",{
  kind:"status",caseId,status:"investigating"
 },token)).status,409,"resolved support cases cannot reopen without approved workflow");
 // Rebuild a large synthetic history with identical timestamps and
 // unrelated mosque cases. Direct inserts are isolated CI fixture creation.
 const fixed=new Date("2026-10-20T12:00:00.000Z");
 const synthetic=Array.from({length:53},()=>({
  id:randomUUID(),organizationId:org.id,createdById:staff.id,
  traceId:"ci_support_"+randomUUID().replaceAll("-",""),
  category:"public_content",status:"open",createdAt:fixed,updatedAt:fixed
 }));
 caseIds.push(...synthetic.map(x=>x.id));
 await db.supportCase.createMany({data:synthetic});
 const all=[];
 let cursor=null;
 for(let i=0;i<5;i++){
  const path="admin/support"+(cursor?"?cursor="+cursor:"");
  const p=await request(path,"GET",undefined,token);
  assert.equal(p.status,200,JSON.stringify(p));
  assert.ok(p.data.items.length<=50);
  all.push(...p.data.items);
  if(p.data.complete){assert.equal(p.data.nextCursor,null);break}
  cursor=p.data.nextCursor;
  assert.ok(cursor);
 }
 assert.equal(all.length,54);
 assert.equal(new Set(all.map(x=>x.id)).size,54);
 assert.ok(synthetic.every(x=>all.some(v=>v.id===x.id)));
 const noteRows=Array.from({length:53},()=>({
  id:randomUUID(),caseId,authorId:staff.id,
  code:"investigation_started",createdAt:fixed
 }));
 await db.supportCaseNote.createMany({data:noteRows});
 const notes=[];
 cursor=null;
 for(let i=0;i<5;i++){
  const url="admin/support?caseId="+caseId+
   (cursor?"&noteCursor="+cursor:"");
  const p=await request(url,"GET",undefined,token);
  assert.equal(p.status,200);
  assert.equal(p.data.item.id,caseId);
  assert.ok(p.data.notes.length<=50);
  notes.push(...p.data.notes);
  if(p.data.complete){assert.equal(p.data.nextCursor,null);break}
  cursor=p.data.nextCursor;
 }
 assert.equal(notes.length,55);
 assert.equal(new Set(notes.map(x=>x.id)).size,55);
 assert.ok(noteRows.every(x=>notes.some(v=>v.id===x.id)));
 foreignId=(await db.organization.create({data:{
  slug:"ci-support-foreign-"+randomUUID(),name:"Private other mosque"
 }})).id;
 const foreign=await db.supportCase.create({data:{
  organizationId:foreignId,createdById:staff.id,traceId:"private_other_"+randomUUID().replaceAll("-",""),
  category:"school_access"
 }});
 foreignCaseId=foreign.id;
 const foreignNote=await db.supportCaseNote.create({data:{
  caseId:foreign.id,authorId:staff.id,code:"reproduced"
 }});
 assert.equal((await request("admin/support?caseId="+foreign.id,
  "GET",undefined,token)).status,404);
 assert.equal((await request("admin/support?cursor="+foreign.id,
  "GET",undefined,token)).status,404);
 assert.equal((await request("admin/support?caseId="+caseId+"&noteCursor="+foreignNote.id,
  "GET",undefined,token)).status,404);
 assert.equal((await request("admin/support","POST",{
  kind:"note",caseId:foreign.id,code:"reproduced"
 },token)).status,404);
 assert.ok(all.every(x=>x.id!==foreign.id));
 const audit=await db.integrityAuditEvent.findMany({where:{
  organizationId:org.id,actorId:staff.id,action:{startsWith:"support."}
 }});
 assert.ok(audit.some(x=>x.action==="support.case.create"));
 assert.ok(audit.some(x=>x.action==="support.case.read"));
 assert.ok(audit.some(x=>x.action==="support.case.list"));
 assert.ok(audit.some(x=>x.action==="support.note.record"));
 assert.ok(audit.some(x=>x.action==="support.case.status"));
 assert.ok(audit.every(x=>x.evidence?.capability==="support_manage"));
 assert.ok(!JSON.stringify(audit).includes(member.email));
 assert.ok(!JSON.stringify(audit).includes("Private student details"));
 // Access is re-evaluated on every call: no stale cached grant authority.
 await db.roleGrant.update({where:{id:grantId},data:{
  expiresAt:new Date(Date.now()-1000)
 }});
 assert.equal((await request("admin/support","GET",undefined,token)).status,403);
 await db.roleGrant.update({where:{id:grantId},data:{
  expiresAt:new Date(Date.now()+86400000)
 }});
 assert.equal((await request("admin/support","GET",undefined,token)).status,200);
 const revoked=await request("admin/team","POST",{
  kind:"revoke",userId:staff.id,capability:"support_manage"
 },adminToken);
 assert.equal(revoked.status,200);
 assert.equal((await request("admin/support","GET",undefined,token)).status,401,
  "grant revocation must invalidate active sessions before another support read");
 const after=await makeSession(staff);
 assert.equal((await request("admin/support","GET",undefined,after)).status,403,
  "fresh session without active grant cannot view private support data");
 console.log("Verified metadata-only operational support, sealed read/write audit, seven-day MFA grants, scoped pagination, cross-mosque denial, expiry and revocation.");
}finally{
 if(foreignCaseId){
  await db.supportCaseNote.deleteMany({where:{caseId:foreignCaseId}});
  await db.supportCase.deleteMany({where:{id:foreignCaseId}});
 }
 if(foreignId)await db.organization.deleteMany({where:{id:foreignId}});
 if(caseIds.length){
  await db.supportCaseNote.deleteMany({where:{caseId:{in:caseIds}}});
  await db.supportCase.deleteMany({where:{id:{in:caseIds}}});
 }
 if(staffId){
  await db.authSession.deleteMany({where:{userId:staffId}});
  await db.roleGrant.deleteMany({where:{membership:{userId:staffId}}});
  await db.organizationMembership.deleteMany({where:{userId:staffId}});
  await db.outboxEvent.deleteMany({where:{userId:staffId}});
  await db.notification.deleteMany({where:{userId:staffId}});
  await db.auditEvent.deleteMany({where:{actorId:staffId}});
  await db.user.deleteMany({where:{id:staffId}});
 }
 if(sessionIds.length)await db.authSession.deleteMany({where:{id:{in:sessionIds}}});
 await db.$disconnect();
}

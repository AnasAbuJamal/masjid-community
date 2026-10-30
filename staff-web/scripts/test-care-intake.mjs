// Isolated care-intake and two-person case-access regression.
// Synthetic adult users, synthetic encrypted messages, disposable masjid_ci DB.
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci")||
 process.env.SILA_CARE_INTAKE_ENABLED!=="true")
 throw Error("Refusing confidential care tests outside isolated, opted-in CI.");
const {adminEmail,staffEmail,memberEmail,password}=JSON.parse(
 readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
async function sessionFor(user,mfa){
 const token=randomBytes(32).toString("base64url");
 const saved=await db.authSession.create({data:{
  userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:mfa?new Date():null
 }});
 sessionIds.push(saved.id);return token;
}
const memberIds=[],sessionIds=[],caseIds=[];
let foreignOrg=null;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const staff=await db.user.findUniqueOrThrow({where:{email:staffEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const memberLogin=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(memberLogin.status,200);
 const memberToken=memberLogin.data.token;
 const adminToken=await sessionFor(admin,true);
 const ordinaryStaffToken=await sessionFor(staff,false);
 const coordinators=[];
 for(let index=0;index<3;index++){
  const user=await db.user.create({data:{
   email:"care-coordinator-ci-"+index+"-"+Date.now()+"@example.test",
   firstName:"Coordinator",lastName:String(index+1),passwordHash:member.passwordHash,
   role:"staff",status:"active",verifiedAt:new Date(),mfaEnabledAt:new Date(),
   memberships:{create:{organizationId:org.id}}
  }});
  memberIds.push(user.id);
  const membership=await db.organizationMembership.findUniqueOrThrow({where:{
   organizationId_userId:{organizationId:org.id,userId:user.id}
  }});
  await db.roleGrant.create({data:{
   membershipId:membership.id,capability:"care_manage",grantedById:admin.id,
   expiresAt:new Date(Date.now()+25*86400000)
  }});
  const token=await sessionFor(user,true);
  coordinators.push({user,token});
 }
 const [a,b,c]=coordinators;
 const noMfa=await sessionFor(b.user,false);
 const guest=await request("care");
 assert.equal(guest.status,200);
 assert.equal(guest.data.enabled,true);
 assert.equal(guest.data.consentVersion,"care-consent-v1");
 assert.match(guest.data.emergency,/emergency|crisis/i);
 assert.ok(!Object.hasOwn(guest.data,"encryptionKey"),
  "public care policy never exposes encryption keys");
 const unauth=await request("care","POST",{
  message:"I would like a private conversation about an ongoing challenge.",
  consent:true,consentVersion:"care-consent-v1"
 });
 assert.equal(unauth.status,401);
 const text="I need a private conversation about my community support situation. Sensitive CI secret XYZ-123.";
 const values={message:text,consent:true,consentVersion:"care-consent-v1"};
 assert.equal((await request("care","POST",{...values,consent:false},memberToken)).status,422,
  "unchecked consent cannot be accepted");
 assert.equal((await request("care","POST",{...values,consentVersion:"old"},memberToken)).status,422,
  "outdated consent version is rejected");
 assert.equal((await request("care","POST",{...values,message:"short"},memberToken)).status,422,
  "minimal message length gate");
 const created=await request("care","POST",values,memberToken);
 assert.equal(created.status,201);
 assert.match(created.data.reference,/^CARE-[A-F0-9]{12}$/);
 assert.ok(!JSON.stringify(created.data).includes("XYZ-123"),"receipt contains no confidential details");
 const saved=await db.careRequest.findUniqueOrThrow({where:{reference:created.data.reference}});
 caseIds.push(saved.id);
 assert.equal(saved.organizationId,org.id);
 assert.equal(saved.requesterId,member.id);
 assert.equal(saved.consentVersion,"care-consent-v1");
 assert.ok(saved.consentedAt instanceof Date);
 assert.match(saved.encryptedMessage,/^v1:/);
 assert.ok(!saved.encryptedMessage.includes("XYZ-123"),"plaintext never appears in care database column");
 const mine=await request("care/mine","GET",undefined,memberToken);
 assert.equal(mine.status,200);
 assert.ok(mine.data.requests.some(x=>x.reference===saved.reference&&x.status==="submitted"));
 assert.ok(!JSON.stringify(mine.data).includes("XYZ-123"),"member timeline excludes private narrative");
 assert.equal((await request("care/mine")).status,401);
 const adminDesk=await request("care/desk","GET",undefined,adminToken);
 assert.equal(adminDesk.status,403,"even MFA administrator cannot read care case index implicitly");
 assert.equal((await request("care/desk","GET",undefined,ordinaryStaffToken)).status,403,
  "ordinary community moderation capability never authorizes care");
 const staffAuth=await request("auth/me","GET",undefined,ordinaryStaffToken);
 assert.equal(staffAuth.status,200);
 assert.equal(staffAuth.data.mfaSetupRequired,true,
  "staff can deliberately enroll an authenticator before receiving a confidential capability");
 const enrolledStaffAuth=await request("auth/me","GET",undefined,noMfa);
 assert.equal(enrolledStaffAuth.status,200);
 assert.equal(enrolledStaffAuth.data.mfaRequired,true,
  "MFA-enrolled coordinator must verify every new session");
 const staffNeedsMfa=await request("care/desk","GET",undefined,noMfa);
 assert.equal(staffNeedsMfa.status,403);
 assert.equal(staffNeedsMfa.error.code,"CARE_MFA_REQUIRED");
 const desk=await request("care/desk","GET",undefined,a.token);
 assert.equal(desk.status,200);
 assert.ok(desk.data.requests.some(x=>x.id===saved.id));
 assert.ok(!JSON.stringify(desk.data).includes("XYZ-123"),"triage queue displays metadata only");
 assert.ok(!JSON.stringify(desk.data).includes(member.email),"triage does not disclose requester email");
 const assignedBefore=await request("care/case?caseId="+saved.id,"GET",undefined,b.token);
 assert.equal(assignedBefore.status,404,"coordinator grant alone does not authorize reading case");
 const noSelf=await request("care/desk","POST",{
  action:"propose-access",caseId:saved.id,assigneeId:a.user.id,
  purpose:"Human case coordinator must independently contact the requester."
 },a.token);
 assert.equal(noSelf.status,403,"coordinator cannot propose own case access");
 const proposed=await request("care/desk","POST",{
  action:"propose-access",caseId:saved.id,assigneeId:b.user.id,
  purpose:"Private human review and a follow-up conversation with requester."
 },a.token);
 assert.equal(proposed.status,201,JSON.stringify(proposed));
 assert.equal(proposed.data.status,"proposed");
 const proposerApprove=await request("care/desk","POST",{
  action:"approve-access",accessId:proposed.data.id
 },a.token);
 assert.equal(proposerApprove.status,403,"proposer cannot approve own proposal");
 const assigneeApprove=await request("care/desk","POST",{
  action:"approve-access",accessId:proposed.data.id
 },b.token);
 assert.equal(assigneeApprove.status,403,"assignee cannot self-approve");
 assert.equal((await request("care/case?caseId="+saved.id,"GET",undefined,b.token)).status,404,
  "until separate reviewer approves, message stays inaccessible");
 const approval=await request("care/desk","POST",{
  action:"approve-access",accessId:proposed.data.id
 },c.token);
 assert.equal(approval.status,200,"third distinct coordinator can approve");
 assert.equal(approval.data.status,"approved");
 const forbiddenA=await request("care/case?caseId="+saved.id,"GET",undefined,a.token);
 assert.equal(forbiddenA.status,404,"proposer has no read access");
 const forbiddenC=await request("care/case?caseId="+saved.id,"GET",undefined,c.token);
 assert.equal(forbiddenC.status,404,"checker has no read access");
 const permitted=await request("care/case?caseId="+saved.id,"GET",undefined,b.token);
 assert.equal(permitted.status,200);
 assert.equal(permitted.data.message,text,"only approved assignee can decrypt exact requested text");
 const auditRead=await db.auditEvent.count({where:{
  entity:"CareRequest",entityId:saved.id,action:"care.case.read",actorId:b.user.id
 }});
 assert.equal(auditRead,1,"the authorized read leaves an audit event");
 const review=await request("care/case","POST",{
  caseId:saved.id,status:"in_review",
  reason:"Human coordinator began the requested private support review."
 },b.token);
 assert.equal(review.status,200);
 assert.equal((await request("care/mine","GET",undefined,memberToken)).data.requests.find(x=>x.reference===saved.reference).status,"in_review");
 const closed=await request("care/case","POST",{
  caseId:saved.id,status:"closed",
  reason:"Follow-up conversation was completed under the approved protocol."
 },b.token);
 assert.equal(closed.status,200);
 assert.equal((await request("care/case?caseId="+saved.id,"GET",undefined,b.token)).status,404,
  "closing a case immediately revokes access to confidential narrative");
 assert.equal((await db.careCaseAccess.findUniqueOrThrow({where:{id:proposed.data.id}})).status,"revoked");
 const done=await request("care/mine","GET",undefined,memberToken);
 assert.equal(done.data.requests.find(x=>x.reference===saved.reference).status,"closed");
 const genericAudit=await db.auditEvent.findMany({where:{
  entity:"CareRequest",entityId:saved.id
 }});
 assert.ok(genericAudit.some(x=>x.action==="care.request.submit"));
 assert.ok(genericAudit.some(x=>x.action==="care.case.in_review"));
 assert.ok(genericAudit.some(x=>x.action==="care.case.closed"));
 assert.ok(!JSON.stringify(genericAudit).includes("XYZ-123"),"audit log has no case narrative");
 const generalNotifications=await db.notification.findMany({where:{userId:member.id}});
 assert.ok(!JSON.stringify(generalNotifications).includes("XYZ-123"),
  "case narrative is never placed in ordinary email notification outbox");
 // Malformed synthetic record in a foreign org is not even selected for
 // decryption; its presence cannot widen home mosque access.
 foreignOrg=await db.organization.create({data:{
  slug:"care-other-ci-"+Date.now(),name:"Other confidential community"
 }});
 const foreign=await db.careRequest.create({data:{
  reference:"CARE-"+randomBytes(6).toString("hex").toUpperCase(),
  organizationId:foreignOrg.id,requesterId:member.id,
  encryptedMessage:"v1:invalid-other-tenant-record",
  consentVersion:"care-consent-v1",consentedAt:new Date(),
  retentionAt:new Date(Date.now()+90*86400000)
 }});
 caseIds.push(foreign.id);
 const scopedDesk=await request("care/desk","GET",undefined,a.token);
 assert.ok(!scopedDesk.data.requests.some(x=>x.id===foreign.id));
 assert.equal((await request("care/case?caseId="+foreign.id,"GET",undefined,b.token)).status,404);
 assert.equal((await request("care/desk","POST",{
  action:"propose-access",caseId:foreign.id,assigneeId:b.user.id,
  purpose:"A guessed foreign case ID must not permit a care assignment."
 },a.token)).status,404);
 assert.ok(!(await request("care/mine","GET",undefined,memberToken)).data.requests.some(x=>x.reference===foreign.reference));
 console.log("Verified encrypted care opt-in, no plaintext leakage, MFA/capability, dual approval, case-only decryption and tenant isolation.");
}finally{
 for(const id of caseIds){
  await db.careCaseAccess.deleteMany({where:{caseId:id}});
  await db.careRequest.deleteMany({where:{id}});
 }
 if(foreignOrg)await db.organization.deleteMany({where:{id:foreignOrg.id}});
 if(sessionIds.length)await db.authSession.deleteMany({where:{id:{in:sessionIds}}});
 if(memberIds.length){
  // These artificial reviewers leave audit records referencing their user IDs.
  // Delete only CI-generated audit data before deleting disposable identities.
  await db.auditEvent.deleteMany({where:{actorId:{in:memberIds}}});
  await db.roleGrant.deleteMany({where:{membership:{userId:{in:memberIds}}}});
  await db.organizationMembership.deleteMany({where:{userId:{in:memberIds}}});
  await db.user.deleteMany({where:{id:{in:memberIds}}});
 }
 await db.$disconnect();
}

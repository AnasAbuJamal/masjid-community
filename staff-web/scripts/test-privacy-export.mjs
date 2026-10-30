// Privacy-export step-up and tenant isolation, synthetic CI database only.
import assert from "node:assert/strict";
import {randomBytes,createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("/masjid_ci"))
 throw Error("Private export tests require disposable masjid_ci PostgreSQL.");
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const host="http://127.0.0.1:3000/api/v1/";
async function call(path,method="GET",body,token){
 const r=await fetch(host+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,cache:r.headers.get("cache-control"),...await r.json().catch(()=>({}))};
}
let org,foreign,localCareId=null,foreignCareId=null,foreignCampaign=null,foreignDonation=null,sessionHash=null,oldMfa=null;
const proposals=[];
try{
 org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 oldMfa=member.mfaEnabledAt;
 const login=await call("auth/login","POST",{email:memberEmail,password});
 assert.equal(login.status,200);
 const token=login.data.token;
 sessionHash=createHash("sha256").update(token).digest("hex");
 const unauth=await call("account/export","POST",{password,confirm:true});
 assert.equal(unauth.status,401,"guest cannot export private account data");
 const cachedGet=await call("account/export","GET",undefined,token);
 assert.equal(cachedGet.status,405,"normal authenticated GET cannot download personal data");
 assert.equal(cachedGet.error.code,"EXPORT_REAUTH_REQUIRED");
 const noConsent=await call("account/export","POST",{password,confirm:false},token);
 assert.equal(noConsent.status,422,"a private export requires explicit consent");
 const withoutPassword=await call("account/export","POST",{confirm:true},token);
 assert.equal(withoutPassword.status,422,"password step-up is compulsory");
 const wrong=await call("account/export","POST",{password:"incorrect-password",confirm:true},token);
 assert.equal(wrong.status,401,"wrong current password cannot export");
 const noAudit=await db.auditEvent.count({where:{
  actorId:member.id,action:"account.export.read",entity:"Organization",entityId:org.id
 }});
 assert.equal(noAudit,0,"failed authentication must not record a successful export");
 // A second organization can contain records whose userId matches, but the
 // first organization's account export must not merge them.
 foreign=await db.organization.create({data:{
  slug:"export-scope-"+randomUUID(),name:"Other private mosque"
 }});
 foreignCampaign=await db.donationCampaign.create({data:{
  organizationId:foreign.id,title:"Confidential foreign campaign",
  purpose:"Never appear in local person export.",published:true
 }});
 foreignDonation=await db.donation.create({data:{
  campaignId:foreignCampaign.id,donorId:member.id,amountMinor:8912,status:"paid"
 }});
 foreignCareId=(await db.careRequest.create({data:{
  reference:"CARE-"+randomBytes(6).toString("hex").toUpperCase(),
  organizationId:foreign.id,requesterId:member.id,
  encryptedMessage:"OTHER_MOSQUE_SECRET_DO_NOT_EXPORT",
  consentVersion:"care-consent-v1",consentedAt:new Date(),
  retentionAt:new Date(Date.now()+90*86400000)
 }})).id;
 const localCare=await db.careRequest.create({data:{
  reference:"CARE-"+randomBytes(6).toString("hex").toUpperCase(),
  organizationId:org.id,requesterId:member.id,
  encryptedMessage:"LOCAL_CARE_CIPHERTEXT_MUST_NOT_EXPORT",
  consentVersion:"care-consent-v1",consentedAt:new Date(),
  retentionAt:new Date(Date.now()+90*86400000)
 }});
 localCareId=localCare.id;
 // 201 artificial submissions exercise honest limit disclosure without
 // falsely describing a 200-record category as complete.
 const prefix="export-limit-fixture-"+randomUUID();
 const values=Array.from({length:201},(_,i)=>({
  organizationId:org.id,submittedById:member.id,title:prefix+"-"+i,
  description:"Synthetic personal proposal export pagination proof",status:"draft"
 }));
 const created=await db.proposal.createMany({data:values});
 assert.equal(created.count,201);
 proposals.push(prefix);
 const first=await call("account/export","POST",{password,confirm:true},token);
 assert.equal(first.status,200,"password-verified owner can export only scoped records");
 assert.equal(first.cache,"no-store","private records may not be HTTP-cached");
 assert.equal(first.data.organization.id,org.id);
 assert.equal(first.data.account.email,member.email);
 assert.equal(first.data.proposals.length,200,"export caps each category");
 assert.equal(first.data.complete,false,"truncated data cannot be called complete");
 assert.ok(first.data.truncatedCategories.includes("proposals"));
 assert.ok(first.data.exclusions.includes("care narratives"));
 assert.ok(first.data.careRequestReferences.some(c=>c.reference===localCare.reference));
 assert.ok(!JSON.stringify(first.data).includes("LOCAL_CARE_CIPHERTEXT_MUST_NOT_EXPORT"),
  "confidential-care message is never in personal archive");
 assert.ok(!JSON.stringify(first.data).includes("OTHER_MOSQUE_SECRET_DO_NOT_EXPORT"),
  "foreign care message cannot leak");
 assert.ok(!first.data.careRequestReferences.some(c=>c.id===foreignCareId));
 assert.ok(!first.data.careRequestReferences.some(c=>c.reference===foreignCareId));
 assert.ok(!JSON.stringify(first.data).includes("Confidential foreign campaign"));
 assert.ok(!first.data.donations.some(d=>d.amountMinor===8912),
  "foreign donation owned by same user stays in its own mosque");
 const audit=await db.auditEvent.findMany({where:{
  actorId:member.id,action:"account.export.read",entity:"Organization",entityId:org.id
 }});
 assert.equal(audit.length,1);
 assert.ok(audit[0].detail.includes(org.id));
 assert.ok(!audit[0].detail.includes(prefix),"audits contain metadata, never exported text");
 // Elevated assurance: even a member who has enrolled MFA cannot export
 // using an old session verification from before the ten-minute step-up.
 await db.user.update({where:{id:member.id},data:{mfaEnabledAt:new Date()}});
 const noMfa=await call("account/export","POST",{password,confirm:true},token);
 assert.equal(noMfa.status,403);
 assert.equal(noMfa.error.code,"EXPORT_MFA_STEP_UP");
 await db.authSession.updateMany({where:{tokenHash:sessionHash},
  data:{mfaVerifiedAt:new Date(Date.now()-20*60000)}});
 const stale=await call("account/export","POST",{password,confirm:true},token);
 assert.equal(stale.status,403,"old authenticator assurance is not enough for an export");
 assert.equal(stale.error.code,"EXPORT_MFA_STEP_UP");
 await db.authSession.updateMany({where:{tokenHash:sessionHash},
  data:{mfaVerifiedAt:new Date()}});
 for(let i=0;i<2;i++){
  const exportAgain=await call("account/export","POST",{password,confirm:true},token);
  assert.equal(exportAgain.status,200,"fresh MFA still requires current password");
 }
 const excessive=await call("account/export","POST",{password,confirm:true},token);
 assert.equal(excessive.status,429,"per-person export rate limit protects sensitive downloads");
 assert.equal(excessive.error.code,"EXPORT_RATE_LIMIT");
 assert.equal(await db.auditEvent.count({where:{
  actorId:member.id,action:"account.export.read",entityId:org.id
 }}),3,"only completed owner exports count as successful");
 console.log("Verified password and MFA step-up, private export no-store, foreign mosque/care isolation, truthful limits, and safe audit.");
}finally{
 if(org){
  await db.auditEvent.deleteMany({where:{actorId:(
   await db.user.findUnique({where:{email:memberEmail},select:{id:true}})
  )?.id,action:"account.export.read",entityId:org.id}});
 }
 if(sessionHash)await db.authSession.deleteMany({where:{tokenHash:sessionHash}});
 if(oldMfa!==null||sessionHash){
  const member=await db.user.findUnique({where:{email:memberEmail},select:{id:true}});
  if(member)await db.user.update({where:{id:member.id},data:{mfaEnabledAt:oldMfa}});
 }
 if(proposals.length)await db.proposal.deleteMany({where:{title:{startsWith:proposals[0]}}});
 if(localCareId)await db.careRequest.deleteMany({where:{id:localCareId}});
 if(foreignCareId)await db.careRequest.deleteMany({where:{id:foreignCareId}});
 if(foreignDonation)await db.donation.deleteMany({where:{id:foreignDonation.id}});
 if(foreignCampaign)await db.donationCampaign.deleteMany({where:{id:foreignCampaign.id}});
 if(foreign)await db.organization.deleteMany({where:{id:foreign.id}});
 await db.$disconnect();
}

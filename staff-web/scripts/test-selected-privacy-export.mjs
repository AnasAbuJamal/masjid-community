// F-043/F-048: selected-mosque owner archives. Synthetic disposable CI only.
import assert from "node:assert/strict";
import {randomBytes,createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 process.env.GITHUB_ACTIONS!=="true"||
 process.env.DATABASE_URL!=="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci")
 throw Error("Selected export tests require disposable CI masjid_ci; no real accounts.");
const {memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),root="http://127.0.0.1:3000/api/v1/";
const userIds=[],parents={event:[],donationCampaign:[],jobPosting:[],volunteerOpportunity:[],rentalResource:[],circle:[]};
let secondary=null,owner=null,home=null,token=null;
async function call(path,method="GET",body,bearer=token){
 const response=await fetch(root+path,{method,headers:{
  ...(bearer?{Authorization:"Bearer "+bearer}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,cache:response.headers.get("cache-control"),...await response.json().catch(()=>({}))};
}
async function parent(model,data){
 const value=await db[model].create({data});parents[model].push(value.id);return value;
}
async function fixture(organizationId,userId,label){
 const startAt=new Date(Date.now()+86400000),endAt=new Date(Date.now()+90000000);
 const event=await parent("event",{organizationId,title:label+"_EVENT",description:"Synthetic export test",location:"Synthetic hall",startAt,endAt});
 await db.eventRSVP.create({data:{userId,eventId:event.id,status:"confirmed"}});
 const campaign=await parent("donationCampaign",{organizationId,title:label+"_CAMPAIGN",purpose:"Synthetic only"});
 await db.donation.create({data:{donorId:userId,campaignId:campaign.id,amountMinor:1234,status:"pending"}});
 const job=await parent("jobPosting",{organizationId,title:label+"_JOB",company:"Synthetic only",description:"Synthetic export test"});
 await db.jobApplication.create({data:{userId,jobId:job.id,coverLetter:label+"_COVER_LETTER"}});
 const opportunity=await parent("volunteerOpportunity",{organizationId,title:label+"_VOLUNTEER",description:"Synthetic",startsAt:startAt,capacity:5});
 await db.volunteerApplication.create({data:{userId,opportunityId:opportunity.id}});
 const resource=await parent("rentalResource",{organizationId,title:label+"_RENTAL",description:"Synthetic"});
 await db.rentalBooking.create({data:{userId,resourceId:resource.id,startAt,endAt}});
 await db.proposal.create({data:{organizationId,submittedById:userId,title:label+"_PROPOSAL",description:label+"_DRAFT"}});
 const circle=await parent("circle",{organizationId,hostId:userId,title:label+"_CIRCLE",summary:"Synthetic",cadence:"Synthetic",guidelines:"Synthetic"});
 await db.circleMember.create({data:{circleId:circle.id,userId}});
 await db.careRequest.create({data:{organizationId,requesterId:userId,
  reference:label+"_CARE_"+randomBytes(4).toString("hex"),encryptedMessage:label+"_SECRET_NARRATIVE",
  consentVersion:"synthetic-only",consentedAt:new Date(),retentionAt:endAt}});
}
function checkArchive(response,organizationId,label,forbidden){
 assert.equal(response.status,200,JSON.stringify(response.error));
 assert.equal(response.cache,"no-store");
 assert.equal(response.data.organization.id,organizationId);
 assert.equal(response.data.account.email,owner.email);
 assert.equal(response.data.complete,false);
 assert.equal(response.data.categoryWindowComplete,true);
 assert.deepEqual(response.data.truncatedCategories,[]);
 for(const category of ["eventRegistrations","donations","jobApplications","volunteerApplications",
  "rentalBookings","proposals","circleMemberships","careRequestReferences"]){
  assert.equal(response.data[category].length,1,"exactly this owner's selected-mosque "+category);
  assert.ok(JSON.stringify(response.data[category]).includes(label),category+" has the selected owner fixture");
 }
 const serialized=JSON.stringify(response.data);
 for(const text of forbidden)assert.ok(!serialized.includes(text),"archive must exclude "+text);
 assert.ok(!serialized.includes("SECRET_NARRATIVE"),"even owned confidential narratives stay excluded");
 assert.ok(!serialized.includes("passwordHash")&&!serialized.includes("tokenHash"));
 assert.ok(response.data.exclusions.includes("student and guardianship records"));
 assert.ok(response.data.exclusions.includes("care narratives"));
 assert.ok(response.data.exclusions.includes("finance-provider account data"));
}
async function changeDuringExport(change,{seed=786,key=owner.id}={}){
 // Hold the actor's export lock, wait until the HTTP handler is actually
 // queued behind it, then alter authorization. No timing-only race assertion.
 let release,acquired;
 const ready=new Promise(resolve=>{acquired=resolve;});
 const held=new Promise(resolve=>{release=resolve;});
 const holder=db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${key}::text, ${seed}::bigint))`;
  acquired();await held;
 },{timeout:10000});
 await ready;
 let request;
 try{
  request=call("account/export","POST",{password,confirm:true});
  let waiting=false;
  for(let attempt=0;attempt<75;attempt++){
   const [row]=await db.$queryRaw`SELECT EXISTS (
    SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted AND objsubid=1
    AND ((classid::bigint << 32) | objid::bigint)=hashtextextended(${key}::text, ${seed}::bigint)
   ) AS waiting`;
   if(row.waiting){waiting=true;break;}
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  assert.ok(waiting,"export must acquire its quota/authority or organization audit lock before auditing");
  await change();
 }finally{release();await holder;}
 return await request;
}
try{
 home=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 const source=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 secondary=await db.organization.create({data:{slug:"ci-export-selected-"+randomUUID(),name:"Synthetic second export mosque"}});
 for(const label of ["owner","other"]){
  const user=await db.user.create({data:{email:"export-"+label+"-"+randomUUID()+"@example.test",
   firstName:"Synthetic",lastName:label,passwordHash:source.passwordHash,verifiedAt:new Date(),
   memberships:{create:[{organizationId:home.id},{organizationId:secondary.id}]}}});
  userIds.push(user.id);if(label==="owner")owner=user;
  await fixture(home.id,user.id,"HOME_"+label.toUpperCase());
  await fixture(secondary.id,user.id,"SECOND_"+label.toUpperCase());
 }
 const login=await call("auth/login","POST",{email:owner.email,password},null);
 assert.equal(login.status,200);token=login.data.token;
 const ownHome=await call("account/export","POST",{password,confirm:true});
 checkArchive(ownHome,home.id,"HOME_OWNER",["SECOND_OWNER","HOME_OTHER","SECOND_OTHER"]);
 assert.equal((await call("organizations/context","POST",{organizationId:secondary.id})).status,200);
 const ownSecond=await call("account/export","POST",{password,confirm:true});
 checkArchive(ownSecond,secondary.id,"SECOND_OWNER",["HOME_OWNER","HOME_OTHER","SECOND_OTHER"]);
 // Bodies cannot select another identity/tenant; only the verified session can.
 for(const injected of [{organizationId:home.id},{userId:userIds[1]},{role:"admin"}]){
  const rejected=await call("account/export","POST",{password,confirm:true,...injected});
  assert.equal(rejected.status,422,"caller-supplied export authority is rejected");
 }
 assert.equal((await call("account/export","GET")).status,405);
 assert.equal((await call("account/export","POST",{password,confirm:true},null)).status,401);
 assert.equal((await call("account/export","POST",{password:"wrong-synthetic-password",confirm:true})).status,401);
 assert.equal((await call("account/export","POST",{password,confirm:false})).status,422);
 await db.user.update({where:{id:owner.id},data:{verifiedAt:null}});
 assert.equal((await call("account/export","POST",{password,confirm:true})).status,403,"unverified account cannot export");
 await db.user.update({where:{id:owner.id},data:{verifiedAt:new Date(),status:"suspended"}});
 assert.equal((await call("account/export","POST",{password,confirm:true})).status,401,"suspended account cannot export");
 await db.user.update({where:{id:owner.id},data:{status:"active"}});
 const membership={organizationId_userId:{organizationId:secondary.id,userId:owner.id}};
 await db.organizationMembership.update({where:membership,data:{status:"suspended"}});
 assert.equal((await call("account/export","POST",{password,confirm:true})).status,403,"revoked selected membership cannot export");
 await db.organizationMembership.update({where:membership,data:{status:"active"}});
 await db.user.update({where:{id:owner.id},data:{role:"teacher"}});
 assert.equal((await call("account/export","POST",{password,confirm:true})).status,403,"global staff role never grants another mosque's archive");
 await db.user.update({where:{id:owner.id},data:{role:"member",mfaEnabledAt:new Date()}});
 const stepUp=await call("account/export","POST",{password,confirm:true});
 assert.equal(stepUp.status,403);assert.equal(stepUp.error.code,"EXPORT_MFA_STEP_UP");
 const tokenHash=createHash("sha256").update(token).digest("hex");
 await db.authSession.update({where:{tokenHash},data:{mfaVerifiedAt:new Date(Date.now()-20*60000)}});
 assert.equal((await call("account/export","POST",{password,confirm:true})).status,403,"stale MFA cannot export secondary records");
 await db.authSession.update({where:{tokenHash},data:{mfaVerifiedAt:new Date()}});
 const revokedWhileWaiting=await changeDuringExport(()=>db.organizationMembership.update({
  where:membership,data:{status:"suspended"}
 }));
 assert.equal(revokedWhileWaiting.status,403,"revocation while export is preparing prevents audit and response");
 await db.organizationMembership.update({where:membership,data:{status:"active"}});
 const changedWhileWaiting=await changeDuringExport(async()=>{
  assert.equal((await call("organizations/context","POST",{organizationId:home.id})).status,200);
 });
 assert.equal(changedWhileWaiting.status,409,"a preparing export must never return after selected mosque changed");
 assert.equal(changedWhileWaiting.error.code,"EXPORT_CONTEXT_CHANGED");
 assert.equal((await call("organizations/context","POST",{organizationId:secondary.id})).status,200);
 const revokedAtAuditLock=await changeDuringExport(()=>db.organizationMembership.update({
  where:membership,data:{status:"suspended"}
 }),{seed:785,key:secondary.id});
 assert.equal(revokedAtAuditLock.status,403,"revocation while waiting for organization audit lock must still prevent export");
 await db.organizationMembership.update({where:membership,data:{status:"active"}});
 const changedAtAuditLock=await changeDuringExport(async()=>{
  assert.equal((await call("organizations/context","POST",{organizationId:home.id})).status,200);
 },{seed:785,key:secondary.id});
 assert.equal(changedAtAuditLock.status,409,"context change at the later audit lock must not return the old mosque archive");
 assert.equal(changedAtAuditLock.error.code,"EXPORT_CONTEXT_CHANGED");
 assert.equal((await call("organizations/context","POST",{organizationId:home.id})).status,200);
 const secondToken=randomBytes(32).toString("base64url");
 const secondHash=createHash("sha256").update(secondToken).digest("hex");
 await db.authSession.create({data:{userId:owner.id,tokenHash:secondHash,
  selectedOrganizationId:secondary.id,mfaVerifiedAt:new Date(),expiresAt:new Date(Date.now()+3600000)}});
 const concurrent=await Promise.all([token,secondToken,token].map(bearer=>
  call("account/export","POST",{password,confirm:true},bearer)));
 assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,429,429],"simultaneous exports cannot exceed the one remaining global download slot");
 const secondWon=concurrent[1].status===200;
 checkArchive(concurrent.find(r=>r.status===200),secondWon?secondary.id:home.id,
  secondWon?"SECOND_OWNER":"HOME_OWNER",[secondWon?"HOME_OWNER":"SECOND_OWNER","HOME_OTHER","SECOND_OTHER"]);
 assert.equal((await call("organizations/context","POST",{organizationId:secondary.id})).status,200);
 const limited=await call("account/export","POST",{password,confirm:true});
 assert.equal(limited.status,429);assert.equal(limited.error.code,"EXPORT_RATE_LIMIT",
  "switching mosques does not reset the per-person private download limit");
 const audits=await db.auditEvent.findMany({where:{actorId:owner.id,action:"account.export.read"}});
 assert.equal(audits.length,3);
 assert.equal(audits.filter(a=>a.entityId===home.id).length,secondWon?1:2);
 assert.equal(audits.filter(a=>a.entityId===secondary.id).length,secondWon?2:1);
 assert.ok(!JSON.stringify(audits).includes("_OWNER"),"export audits contain metadata only");
 await db.authSession.update({where:{tokenHash:secondHash},data:{revokedAt:new Date()}});
 assert.equal((await call("account/export","POST",{password,confirm:true},secondToken)).status,401,"revoked session cannot export");
 await db.authSession.update({where:{tokenHash},data:{expiresAt:new Date(Date.now()-1000)}});
 assert.equal((await call("account/export","POST",{password,confirm:true})).status,401,"expired session cannot export");
 console.log("Verified two-mosque owner exports across eight categories, strict authority inputs, scoped audit, step-up, revocation and global download limits.");
}finally{
 // Delete only synthetic records created by this test. Never touch other CI actors.
 if(userIds.length){
  await db.auditEvent.deleteMany({where:{actorId:{in:userIds}}});
  await db.authSession.deleteMany({where:{userId:{in:userIds}}});
  await db.eventRSVP.deleteMany({where:{userId:{in:userIds}}});
  await db.donation.deleteMany({where:{donorId:{in:userIds}}});
  await db.jobApplication.deleteMany({where:{userId:{in:userIds}}});
  await db.volunteerApplication.deleteMany({where:{userId:{in:userIds}}});
  await db.rentalBooking.deleteMany({where:{userId:{in:userIds}}});
  await db.proposal.deleteMany({where:{submittedById:{in:userIds}}});
  await db.circleMember.deleteMany({where:{userId:{in:userIds}}});
  await db.careRequest.deleteMany({where:{requesterId:{in:userIds}}});
  for(const [model,ids] of Object.entries(parents))await db[model].deleteMany({where:{id:{in:ids}}});
  await db.organizationMembership.deleteMany({where:{userId:{in:userIds}}});
  await db.user.deleteMany({where:{id:{in:userIds}}});
 }
 // Successful exports seal an append-only audit chain. Retain its synthetic
 // organization and chain; deleting either would undermine audit invariants.
 await db.$disconnect();
}

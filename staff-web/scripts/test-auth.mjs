// Real HTTP security smoke against ephemeral CI Postgres and a local-only web server.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHmac} from "node:crypto";
if(process.env.NODE_ENV==="production"||!process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing auth integration test outside isolated CI database.");
const {adminEmail,memberEmail,staffEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const host="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(host+path,{method,headers:{...(token?{Authorization:"Bearer "+token}:{}),...(body?{"Content-Type":"application/json"}:{})},
  body:body?JSON.stringify(body):undefined});
 const value=await response.json().catch(()=>({}));
 return {status:response.status,...value};
}
function totp(secret,step=Math.floor(Date.now()/30000)){
 const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
 let value=0,bits=0;const bytes=[];
 for(const c of secret){const n=chars.indexOf(c);assert.ok(n>=0);value=(value<<5)|n;bits+=5;if(bits>=8){bits-=8;bytes.push((value>>>bits)&255);}}
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));
 const h=createHmac("sha1",Buffer.from(bytes)).update(counter).digest(),off=h[19]&15;
 return ((h.readUInt32BE(off)&0x7fffffff)%1_000_000).toString().padStart(6,"0");
}
const admin=await request("auth/login","POST",{email:adminEmail,password});
assert.equal(admin.status,200,"admin can sign in with credentials");
assert.equal(admin.data.user.mfaRequired,true,"admin must satisfy MFA");
assert.equal(admin.data.user.mfaSetupRequired,true,"new admin must enroll");
const blocked=await request("admin","GET",null,admin.data.token);
assert.equal(blocked.status,403,"no privileged data before MFA");
assert.equal(blocked.error.code,"MFA_REQUIRED");
const teamBlocked=await request("admin/team","GET",null,admin.data.token);
 assert.equal(teamBlocked.status,403,"team management requires MFA");
const weak=await request("auth/mfa-setup","POST",{password:"incorrect-password"},admin.data.token);
assert.equal(weak.status,401,"enrollment requires current password");
const setup=await request("auth/mfa-setup","POST",{password},admin.data.token);
assert.equal(setup.status,200,"enrollment starts after password recheck");
assert.match(setup.data.secret,/^[A-Z2-7]{32}$/);
const otp=totp(setup.data.secret);
const invalid=await request("auth/mfa-enable","POST",{code:otp.slice(0,5)+(otp[5]==="0"?"1":"0")},admin.data.token);
assert.equal(invalid.status,422,"wrong authenticator code rejected");
const enabled=await request("auth/mfa-enable","POST",{code:otp},admin.data.token);
assert.equal(enabled.status,200,"valid authenticator enrolled");
const allowed=await request("admin","GET",null,admin.data.token);
assert.equal(allowed.status,200,"MFA-verified session can enter admin");
const team=await request("admin/team","GET",null,admin.data.token);
assert.equal(team.status,200,"verified admin can inspect scoped organization access");
assert.ok(team.data.memberships.some(m=>m.user.email===staffEmail));
const another=await request("auth/login","POST",{email:adminEmail,password});
assert.equal(another.status,200);
assert.equal(another.data.user.mfaSetupRequired,false);
const secondBlocked=await request("admin","GET",null,another.data.token);
assert.equal(secondBlocked.status,403,"other session must separately authenticate");
const replay=await request("auth/mfa-verify","POST",{code:otp},another.data.token);
assert.equal(replay.status,409,"already used code cannot authorize another session");
const member=await request("auth/login","POST",{email:memberEmail,password});
assert.equal(member.status,200);
assert.equal(member.data.user.mfaRequired,false,"ordinary members can sign in without privileged MFA");

 // Cross-site writes must reject the full serialized Origin, including
 // scheme, port and invalid/opaque values. Native Bearer requests without an
 // Origin still work; a well-formed same-origin request reaches validation.
 async function probeOrigin(origin){
  const headers={Authorization:"Bearer "+member.data.token,"Content-Type":"application/json"};
  if(origin!==undefined)headers.Origin=origin;
  const response=await fetch(host+"actions",{method:"POST",headers,
   body:JSON.stringify({kind:"__synthetic_invalid_action__"})});
  return {status:response.status,...await response.json().catch(()=>({}))};
 }
 for(const origin of [
  "https://127.0.0.1:3000","http://localhost:3000","http://127.0.0.1:3001",
  "null","not-a-url","http://127.0.0.1:3000/path",
  "http://127.0.0.1:3000 http://evil.example"
 ]){
  const rejected=await probeOrigin(origin);
  assert.equal(rejected.status,403,"Origin must match scheme, hostname and port exactly: "+origin);
  assert.equal(rejected.error.code,"ORIGIN","bad Origin fails closed instead of 500");
 }
 const acceptedOrigin=await probeOrigin("http://127.0.0.1:3000");
 assert.equal(acceptedOrigin.status,422,"same origin reaches ordinary payload validation");
 assert.equal((await probeOrigin()).status,422,
  "native authenticated Bearer clients without browser Origin remain supported");
const memberForbidden=await request("admin","GET",null,member.data.token);
assert.equal(memberForbidden.status,403,"member must not be able to read admin data");
const staff=await request("auth/login","POST",{email:staffEmail,password});
assert.equal(staff.status,200);
assert.equal(staff.data.user.role,"staff");
const staffHome=await request("staff/capabilities","GET",null,staff.data.token);
assert.equal(staffHome.status,200);
assert.ok(staffHome.data.capabilities.some(c=>c.capability==="community_moderate"));
assert.ok(!staffHome.data.capabilities.some(c=>c.capability==="facilities_manage"),"expired capabilities are excluded");
const noFacilities=await request("admin/operations","GET",null,staff.data.token);
assert.equal(noFacilities.status,403,"staff lacking facilities grant denied");
const allowedCommunity=await request("admin/contact","GET",null,staff.data.token);
assert.equal(allowedCommunity.status,200,"staff's live community grant permits moderation");
const forbiddenDashboard=await request("admin","GET",null,staff.data.token);
assert.equal(forbiddenDashboard.status,403,"staff cannot read admin-wide private data");
console.log("Verified admin MFA, team access, role separation, staff grant allow/deny and expired capability checks.");


// Prayer publication acceptance: authentic draft, separate reviewer, stable public
// data until publication, versioned corrections and append-only audit snapshots.
const {PrismaClient}=await import("@prisma/client");
const worshipDb=new PrismaClient();
try{
 const org=await worshipDb.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const venue=await worshipDb.venue.findFirst({where:{organizationId:org.id},orderBy:{id:"asc"}});
 assert.ok(venue);
 const day="2032-11-05";
 const bypass=await request("admin","POST",{
  kind:"prayer",venueId:venue.id,localDate:"2032-11-05",published:true,
  fajr:"05:30",sunrise:"06:44",dhuhr:"12:10",asr:"15:15",maghrib:"17:20",isha:"19:00"
 },admin.data.token);
 assert.equal(bypass.status,409,"old admin endpoint must reject direct prayer publishing");
 assert.equal(bypass.error.code,"PRAYER_REVIEW_REQUIRED");
 const unchanged=await worshipDb.prayerDay.findUnique({where:{venueId_localDate:{
  venueId:venue.id,localDate:"2032-11-05"
 }}});
 assert.equal(unchanged,null,"old admin route must not create even an unpublished schedule");

 const draft={
  action:"create",venueId:venue.id,localDate:day,source:"CI verified mosque schedule",
  fajr:"05:30",sunrise:"06:44",dhuhr:"12:10",asr:"15:15",maghrib:"17:20",isha:"19:00",
  fajrIqamah:"05:45",dhuhrIqamah:"12:30",asrIqamah:"15:30",
  maghribIqamah:"17:20",ishaIqamah:"19:10"
 };
 const anonymous=await request("admin/prayer-revisions","POST",draft);
 assert.equal(anonymous.status,401,"guest cannot create prayer drafts");
 const denied=await request("admin/prayer-revisions","POST",draft,member.data.token);
 assert.equal(denied.status,403,"ordinary member cannot create prayer drafts");
 const invalidDate=await request("admin/prayer-revisions","POST",{...draft,localDate:"2032-02-30"},admin.data.token);
 assert.equal(invalidDate.status,422,"invalid local civil date rejected");
 const reversed=await request("admin/prayer-revisions","POST",{...draft,sunrise:"04:00"},admin.data.token);
 assert.equal(reversed.status,422,"chronologically impossible worship timetable rejected");
 const started=await request("admin/prayer-revisions","POST",draft,admin.data.token);
 assert.equal(started.status,201,"authorized editor creates a private draft");
 assert.equal(started.data.status,"draft");
 const publicBefore=await request("public/prayers?venueId="+venue.id+"&date="+day);
 assert.equal(publicBefore.status,200);
 assert.deepEqual(publicBefore.data.days,[],"unpublished candidate is never public");
 const duplicate=await request("admin/prayer-revisions","POST",draft,admin.data.token);
 assert.equal(duplicate.status,409,"only one active candidate may exist for an unchanged base version");
 const submitted=await request("admin/prayer-revisions","POST",{action:"submit",id:started.data.id},admin.data.token);
 assert.equal(submitted.status,200);
 const selfApproval=await request("admin/prayer-revisions","POST",{action:"approve",id:started.data.id},admin.data.token);
 assert.equal(selfApproval.status,403,"author cannot approve own proposal");
 const ungranted=await request("admin/prayer-revisions","POST",{action:"approve",id:started.data.id},staff.data.token);
 assert.equal(ungranted.status,403,"staff must have explicit worship publishing grant");
 const adminUser=await worshipDb.user.findUnique({where:{email:adminEmail}});
 const staffUser=await worshipDb.user.findUnique({where:{email:staffEmail}});
 assert.ok(adminUser&&staffUser);
 const membership=await worshipDb.organizationMembership.findUnique({where:{organizationId_userId:{organizationId:org.id,userId:staffUser.id}}});
 assert.ok(membership);
 await worshipDb.roleGrant.upsert({where:{membershipId_capability:{membershipId:membership.id,capability:"worship_publish"}},
  update:{grantedById:adminUser.id,revokedAt:null,expiresAt:null},
  create:{membershipId:membership.id,capability:"worship_publish",grantedById:adminUser.id}});
 const approved=await request("admin/prayer-revisions","POST",{action:"approve",id:started.data.id},staff.data.token);
 assert.equal(approved.status,200,"different granted reviewer approves");
 const stillPrivate=await request("public/prayers?venueId="+venue.id+"&date="+day);
 assert.deepEqual(stillPrivate.data.days,[],"approved but unpublished values stay private");
 const published=await request("admin/prayer-revisions","POST",{action:"publish",id:started.data.id},admin.data.token);
 assert.equal(published.status,200);
 assert.equal(published.data.revision,1);
 const again=await request("admin/prayer-revisions","POST",{action:"publish",id:started.data.id},admin.data.token);
 assert.equal(again.status,200);
 assert.equal(again.data.alreadyPublished,true,"publication retry is idempotent");
 const visible=await request("public/prayers?venueId="+venue.id+"&date="+day);
 assert.equal(visible.data.days[0].fajr,"05:30");
 assert.equal(visible.data.days[0].revision,1);
 const missingReason=await request("admin/prayer-revisions","POST",{...draft,maghrib:"17:25"},admin.data.token);
 assert.equal(missingReason.status,422,"published schedule corrections require a reason");
 const correction=await request("admin/prayer-revisions","POST",{...draft,
  maghrib:"17:25",maghribIqamah:"17:26",correctionReason:"Mosque-approved correction of Maghrib time."},admin.data.token);
 assert.equal(correction.status,201,"a new authorized correction can be drafted");
 assert.equal(correction.data.revision,2);
 const beforeCorrection=await request("public/prayers?venueId="+venue.id+"&date="+day);
 assert.equal(beforeCorrection.data.days[0].maghrib,"17:20","public values stay stable while correction is drafted");
 assert.equal((await request("admin/prayer-revisions","POST",{action:"submit",id:correction.data.id},admin.data.token)).status,200);
 assert.equal((await request("admin/prayer-revisions","POST",{action:"approve",id:correction.data.id},staff.data.token)).status,200);
 assert.equal((await request("admin/prayer-revisions","POST",{action:"publish",id:correction.data.id},admin.data.token)).status,200);
 const corrected=await request("public/prayers?venueId="+venue.id+"&date="+day);
 assert.equal(corrected.data.days[0].maghrib,"17:25");
 assert.equal(corrected.data.days[0].revision,2);
 const history=await worshipDb.auditEvent.findMany({where:{entity:"PrayerScheduleRevision",action:"worship.prayer.publish",
  entityId:{in:[started.data.id,correction.data.id]}}});
 assert.equal(history.length,2,"each published revision has one audit record");
 const second=history.find(x=>x.entityId===correction.data.id);
 const detail=JSON.parse(second.detail);
 assert.equal(detail.previous.maghrib,"17:20");
 assert.equal(detail.published.maghrib,"17:25");
 assert.equal(detail.reason,"Mosque-approved correction of Maghrib time.");
 const withdrawnDraft=await request("admin/prayer-revisions","POST",{
  ...draft,asr:"15:20",correctionReason:"Mosque staff reviewed a later Asr time."
 },admin.data.token);
 assert.equal(withdrawnDraft.status,201);
 assert.equal(withdrawnDraft.data.revision,3);
 const withdrawn=await request("admin/prayer-revisions","POST",{action:"withdraw",id:withdrawnDraft.data.id},admin.data.token);
 assert.equal(withdrawn.status,200);
 const recreated=await request("admin/prayer-revisions","POST",{
  ...draft,asr:"15:20",correctionReason:"After withdrawal, a revised draft was recorded."
 },admin.data.token);
 assert.equal(recreated.status,201,"withdrawn candidates do not permanently block replacement drafts");
 assert.equal(recreated.data.revision,4,"candidate revision numbers are never reused");
 const afterDraft=await request("public/prayers?venueId="+venue.id+"&date="+day);
 assert.equal(afterDraft.data.days[0].asr,"15:15","unpublished replacements never leak");
 assert.equal((await request("admin/prayer-revisions","POST",{action:"withdraw",id:recreated.data.id},admin.data.token)).status,200);
 console.log("Verified private prayer drafts, independent reviewer grants, audited revision history and idempotent publication.");
}finally{await worshipDb.$disconnect();}

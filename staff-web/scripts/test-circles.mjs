// Private circles: public outlines, moderated adult membership and scoped updates.
// Synthetic data only in the ephemeral masjid_ci PostgreSQL + local test server.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomBytes,createHash} from "node:crypto";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
 !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Circle integration tests require isolated masjid_ci PostgreSQL.");
const {adminEmail,staffEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(body?{"Content-Type":"application/json"}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
const ids=[],notificationIds=[];
let foreignOrgId=null,adminSession=null;
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org);
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const staff=await db.user.findUniqueOrThrow({where:{email:staffEmail}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const [staffLogin,memberLogin]=await Promise.all([
  request("auth/login","POST",{email:staffEmail,password}),
  request("auth/login","POST",{email:memberEmail,password})
 ]);
 assert.equal(staffLogin.status,200);assert.equal(memberLogin.status,200);
 const staffToken=staffLogin.data.token,memberToken=memberLogin.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 const publicBefore=await request("circles");
 assert.equal(publicBefore.status,200);
 assert.ok(!Object.hasOwn(publicBefore.data,"members"),"public listing contains no member directory");
 const forbiddenCreate=await request("admin/circles","POST",{
  action:"create",title:"Guest circle",summary:"This must not be accepted by outsiders.",
  cadence:"Weekly",guidelines:"Respect confidentiality and boundaries.",
  hostId:staff.id,published:true
 },memberToken);
 assert.equal(forbiddenCreate.status,403);
 const noGuestHost=await request("circles/host");
 assert.equal(noGuestHost.status,401);
 const details={
  action:"create",title:"Private neighbors' circle",
  summary:"A moderated community group for welcoming new neighbors and building friendships.",
  cadence:"Every Saturday afternoon",
  guidelines:"Respect privacy, do not share member names or contact information, and follow host guidance.",
  hostId:staff.id,published:false
 };
 const draft=await request("admin/circles","POST",details,adminToken);
 assert.equal(draft.status,201,"authorized steward can create an unpublished circle");
 ids.push(draft.data.id);
 const draftList=await request("circles");
 assert.ok(!draftList.data.items.some(x=>x.id===draft.data.id),"draft is not in public discovery");
 const draftJoin=await request("circles","POST",{circleId:draft.data.id},memberToken);
 assert.equal(draftJoin.status,404,"cannot join an unpublished circle by ID");
 const published=await request("admin/circles","PATCH",{
  action:"change-status",circleId:draft.data.id,status:"published"
 },adminToken);
 assert.equal(published.status,200);
 const list=await request("circles");
 assert.ok(list.data.items.some(x=>x.id===draft.data.id));
 assert.ok(!JSON.stringify(list.data).includes(member.email),"public circles do not show member contact details");
 assert.ok(!JSON.stringify(list.data).includes(staff.email),"public circles do not show host contact details");
 assert.ok(!JSON.stringify(list.data).includes("memberId"),"public listing exposes no membership IDs");
 const firstMine=await request("circles/mine","GET",undefined,memberToken);
 assert.equal(firstMine.status,200);
 assert.ok(!firstMine.data.memberships.some(m=>m.circle.id===draft.data.id));
 assert.ok(!firstMine.data.updates.some(m=>m.circleId===draft.data.id));
 const outsiderHost=await request("circles/host?circleId="+draft.data.id,"GET",undefined,memberToken);
 assert.equal(outsiderHost.status,404,"ordinary members cannot view the private host roster");
 const guestRequest=await request("circles","POST",{circleId:draft.data.id});
 assert.equal(guestRequest.status,401);
 const joined=await request("circles","POST",{circleId:draft.data.id},memberToken);
 assert.equal(joined.status,201);
 assert.equal(joined.data.status,"requested","join request is never auto-approved");
 assert.equal(await db.circleMember.count({where:{circleId:draft.data.id,userId:member.id}}),1);
 const repeat=await request("circles","POST",{circleId:draft.data.id},memberToken);
 assert.equal(repeat.status,200);
 assert.equal(repeat.data.id,joined.data.id);
 const pendingMine=await request("circles/mine","GET",undefined,memberToken);
 assert.ok(pendingMine.data.memberships.some(m=>m.circle.id===draft.data.id&&m.status==="requested"));
 assert.ok(!pendingMine.data.updates.some(u=>u.circleId===draft.data.id));
 const hostList=await request("circles/host","GET",undefined,staffToken);
 assert.equal(hostList.status,200);
 assert.ok(hostList.data.circles.some(c=>c.id===draft.data.id));
 const roster=await request("circles/host?circleId="+draft.data.id,"GET",undefined,staffToken);
 assert.equal(roster.status,200);
 assert.equal(roster.data.members.length,1);
 assert.equal(roster.data.members[0].id,joined.data.id);
 assert.deepEqual(Object.keys(roster.data.members[0].member).sort(),["firstName","lastName"],
  "private host roster excludes email and contact details");
 const guestDecision=await request("circles/host","POST",{
  action:"decide",circleId:draft.data.id,memberId:joined.data.id,
  decision:"approved",reason:"Applicant understands the group guidelines."
 });
 assert.equal(guestDecision.status,401);
 const wrongDecision=await request("circles/host","POST",{
  action:"decide",circleId:draft.data.id,memberId:joined.data.id,
  decision:"approved",reason:"Applicant understands the group guidelines."
 },memberToken);
 assert.equal(wrongDecision.status,404,"unassigned members cannot approve");
 const missingReason=await request("circles/host","POST",{
  action:"decide",circleId:draft.data.id,memberId:joined.data.id,
  decision:"approved",reason:"ok"
 },staffToken);
 assert.equal(missingReason.status,422,"host reviews require meaningful decision reasons");
 const body="Next week we will meet at the mosque reception desk at the announced time.";
 const posted=await request("circles/host","POST",{
  action:"publish-update",circleId:draft.data.id,body
 },staffToken);
 assert.equal(posted.status,200);
 const awaiting=await request("circles/mine","GET",undefined,memberToken);
 assert.ok(!awaiting.data.updates.some(u=>u.id===posted.data.id),
  "pending members cannot read host updates even if they know update IDs");
 const approved=await request("circles/host","POST",{
  action:"decide",circleId:draft.data.id,memberId:joined.data.id,
  decision:"approved",reason:"Applicant understands the circle's community code of conduct."
 },staffToken);
 assert.equal(approved.status,200);
 assert.equal(approved.data.status,"approved");
 const afterApproval=await request("circles/mine","GET",undefined,memberToken);
 assert.ok(afterApproval.data.memberships.some(m=>m.circle.id===draft.data.id&&m.status==="approved"));
 assert.ok(afterApproval.data.updates.some(u=>u.id===posted.data.id&&u.body===body));
 assert.ok(!JSON.stringify(afterApproval.data).includes(staff.email),
  "member's private updates must not expose host contact details");
 const doubleReview=await request("circles/host","POST",{
  action:"decide",circleId:draft.data.id,memberId:joined.data.id,
  decision:"declined",reason:"Must not override an already-approved request."
 },staffToken);
 assert.equal(doubleReview.status,409,"review decisions are single-use");
 const generic=await db.notification.findMany({where:{
  userId:member.id,title:"Your community request has been reviewed"
 },orderBy:{createdAt:"desc"},take:5});
 assert.ok(generic.length>0,"approval creates a minimal personal notice");
 const notification=generic.find(n=>n.body==="Check your account for the status of your community request.");
 assert.ok(notification,"notice does not disclose private circle name, decision, roster or host");
 notificationIds.push(notification.id);
 const noAdminHost=await request("circles/host?circleId="+draft.data.id,"GET",undefined,adminToken);
 assert.equal(noAdminHost.status,404,"admin role without assigned host authority cannot read roster");
 const left=await request("circles","DELETE",{circleId:draft.data.id},memberToken);
 assert.equal(left.status,200);
 const afterLeave=await request("circles/mine","GET",undefined,memberToken);
 assert.ok(afterLeave.data.memberships.some(m=>m.circle.id===draft.data.id&&m.status==="left"));
 assert.ok(!afterLeave.data.updates.some(u=>u.circleId===draft.data.id),
  "private updates disappear immediately after leaving");
 const rejoin=await request("circles","POST",{circleId:draft.data.id},memberToken);
 assert.equal(rejoin.status,409,"cooldown prevents immediate rejoin");
 assert.equal(rejoin.error.code,"JOIN_COOLDOWN");
 const secondLeave=await request("circles","DELETE",{circleId:draft.data.id},memberToken);
 assert.equal(secondLeave.status,200);
 assert.equal(secondLeave.data.alreadyLeft,true);
 const reviewHistory=await db.auditEvent.findMany({where:{
  entity:"CircleMember",entityId:joined.data.id,action:{in:["circle.join.request","circle.join.approved","circle.member.leave"]}
 }});
 assert.deepEqual(reviewHistory.map(x=>x.action).sort(),["circle.join.approved","circle.join.request","circle.member.leave"].sort());
 const second=await request("admin/circles","POST",{...details,
  title:"Second group for a privacy boundary",published:true
 },adminToken);
 assert.equal(second.status,201);ids.push(second.data.id);
 const secondRequest=await request("circles","POST",{circleId:second.data.id},memberToken);
 assert.equal(secondRequest.status,201);
 const awaitReview=await request("circles/host","POST",{
  action:"decide",circleId:second.data.id,memberId:secondRequest.data.id,
  decision:"declined",reason:"The group is not suitable for this request right now."
 },staffToken);
 assert.equal(awaitReview.status,200);
 const declineCooldown=await request("circles","POST",{circleId:second.data.id},memberToken);
 assert.equal(declineCooldown.status,409);
 assert.equal(declineCooldown.error.code,"JOIN_COOLDOWN");
 const declineBypass=await request("circles","DELETE",{circleId:second.data.id},memberToken);
 assert.equal(declineBypass.status,409,"a declined applicant cannot reset cooldown by leaving");
 assert.equal(declineBypass.error.code,"JOIN_COOLDOWN");
 assert.equal((await db.circleMember.findUniqueOrThrow({where:{
  circleId_userId:{circleId:second.data.id,userId:member.id}
 }})).status,"declined","denied deletion must leave declined state unchanged");
 const notice=await db.notification.findFirst({where:{
  userId:member.id,title:"Your community request has been reviewed",
  id:{not:notification.id}
 },orderBy:{createdAt:"desc"}});
 if(notice)notificationIds.push(notice.id);
 const foreignOrg=await db.organization.create({data:{
  slug:"circle-tenant-ci-"+Date.now(),name:"Separate mosque circle"
 }});foreignOrgId=foreignOrg.id;
 const foreignCircle=await db.circle.create({data:{
  organizationId:foreignOrg.id,hostId:staff.id,title:"Separate mosque private circle",
  summary:"Other mosque's private moderation records must not be accessible.",
  cadence:"Monthly gathering",guidelines:"Respect privacy and community boundaries.",status:"published"
 }});
 ids.push(foreignCircle.id);
 await db.circleMember.create({data:{circleId:foreignCircle.id,userId:member.id,status:"approved"}});
 await db.circleUpdate.create({data:{
  circleId:foreignCircle.id,authorId:staff.id,
  body:"Other mosque's very private member message - never visible in current mosque."
 }});
 const foreignList=await request("circles");
 assert.ok(!foreignList.data.items.some(c=>c.id===foreignCircle.id));
 assert.equal((await request("circles","POST",{circleId:foreignCircle.id},memberToken)).status,404);
 assert.equal((await request("circles/host?circleId="+foreignCircle.id,"GET",undefined,staffToken)).status,404);
 assert.equal((await request("admin/circles","PATCH",{
  action:"change-status",circleId:foreignCircle.id,status:"archived"
 },adminToken)).status,404);
 const foreignMine=await request("circles/mine","GET",undefined,memberToken);
 assert.ok(!foreignMine.data.memberships.some(m=>m.circle.id===foreignCircle.id));
 assert.ok(!JSON.stringify(foreignMine.data).includes("Other mosque's very private member message"));
 const third=await request("admin/circles","POST",{...details,title:"Archive access immediately",
  published:true},adminToken);
 assert.equal(third.status,201);ids.push(third.data.id);
 const thirdJoin=await request("circles","POST",{circleId:third.data.id},memberToken);
 assert.equal(thirdJoin.status,201);
 assert.equal((await request("circles/host","POST",{
  action:"decide",circleId:third.data.id,memberId:thirdJoin.data.id,
  decision:"approved",reason:"Applicant meets current member requirements."
 },staffToken)).status,200);
 const thirdNotice=await db.notification.findMany({where:{
  userId:member.id,title:"Your community request has been reviewed"
 },orderBy:{createdAt:"desc"},take:5});
 for(const n of thirdNotice)if(!notificationIds.includes(n.id))notificationIds.push(n.id);
 const thirdPosted=await request("circles/host","POST",{
  action:"publish-update",circleId:third.data.id,body:"Private update removed from view after archiving the circle."
 },staffToken);
 assert.equal(thirdPosted.status,200);
 assert.ok((await request("circles/mine","GET",undefined,memberToken)).data.updates.some(u=>u.id===thirdPosted.data.id));
 const archived=await request("admin/circles","PATCH",{
  action:"change-status",circleId:third.data.id,status:"archived"
 },adminToken);
 assert.equal(archived.status,200);
 assert.ok(!(await request("circles")).data.items.some(c=>c.id===third.data.id));
 assert.ok(!(await request("circles/mine","GET",undefined,memberToken)).data.updates.some(u=>u.id===thirdPosted.data.id),
  "archived circle update is no longer in own view");
 assert.equal((await request("circles/host?circleId="+third.data.id,"GET",undefined,staffToken)).status,404,
  "archiving immediately revokes host roster access");
 assert.equal((await request("circles","POST",{circleId:third.data.id},memberToken)).status,404);
 assert.equal((await request("admin/circles","PATCH",{
  action:"change-status",circleId:third.data.id,status:"published"
 },adminToken)).status,409,"archived private groups cannot be silently reopened");
 console.log("Verified moderated circles, private updates, cooldowns, host authorization, denial and immediate archive isolation.");
}finally{
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 for(const id of notificationIds){
  await db.outboxEvent.deleteMany({where:{notificationId:id}});
  await db.notification.deleteMany({where:{id}});
 }
 for(const id of ids){
  await db.circleUpdate.deleteMany({where:{circleId:id}});
  await db.circleMember.deleteMany({where:{circleId:id}});
  await db.circle.deleteMany({where:{id}});
 }
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

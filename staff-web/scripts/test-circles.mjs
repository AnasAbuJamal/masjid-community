// Private circles: public outlines, moderated adult membership and scoped updates.
// Synthetic data only in the ephemeral masjid_ci PostgreSQL + local test server.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomBytes,createHash,randomUUID} from "node:crypto";
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
const ids=[],notificationIds=[],fakeCircleUsers=[];
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
 const access=await request("circles/host?circleId="+draft.data.id+
  "&mode=access","GET",undefined,staffToken);
 assert.equal(access.status,200);
 assert.deepEqual(Object.keys(access.data).sort(),["authorized","circleId","note"]);
 assert.equal(access.data.authorized,true);
 assert.equal(access.data.circleId,draft.data.id);
 assert.equal((await request("circles/host?circleId="+draft.data.id+
  "&mode=access","GET",undefined,memberToken)).status,404);
 for(const suffix of [
  "?mode=access", "?circleId="+draft.data.id+"&mode=wrong",
  "?circleId="+draft.data.id+"&mode=access&cursor="+joined.data.id,
  "?circleId="+draft.data.id+"&mode=access&mode=access"
 ]){
  assert.equal((await request("circles/host"+suffix,"GET",undefined,staffToken)).status,422);
 }
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
 // A host can retract a mistaken private update without disclosing its
 // content in the audit log; no unassigned actor may retract it.
 const mistaken=await request("circles/host","POST",{
  action:"publish-update",circleId:draft.data.id,
  body:"Synthetic message to retract immediately from member views."
 },staffToken);
 assert.equal(mistaken.status,200);
 assert.ok((await request("circles/mine","GET",undefined,memberToken))
  .data.updates.some(u=>u.id===mistaken.data.id));
 const forbiddenRetract=await request("circles/host","DELETE",{
  circleId:draft.data.id,updateId:mistaken.data.id
 },memberToken);
 assert.equal(forbiddenRetract.status,404);
 const wrongCircleRetract=await request("circles/host","DELETE",{
  circleId:draft.data.id,updateId:randomUUID()
 },staffToken);
 assert.equal(wrongCircleRetract.status,404);
 assert.equal(wrongCircleRetract.error.code,"UPDATE_UNAVAILABLE");
 const malformedRetract=await request("circles/host","DELETE",{
  circleId:draft.data.id,updateId:mistaken.data.id,extra:"not accepted"
 },staffToken);
 assert.equal(malformedRetract.status,422);
 const retracted=await request("circles/host","DELETE",{
  circleId:draft.data.id,updateId:mistaken.data.id
 },staffToken);
 assert.equal(retracted.status,200);
 assert.equal(retracted.data.retracted,true);
 assert.ok(!(await request("circles/mine","GET",undefined,memberToken))
  .data.updates.some(u=>u.id===mistaken.data.id));
 assert.ok(!(await request("circles/host?circleId="+draft.data.id,
  "GET",undefined,staffToken)).data.updates.some(u=>u.id===mistaken.data.id));
 assert.equal((await request("circles/host","DELETE",{
  circleId:draft.data.id,updateId:mistaken.data.id
 },staffToken)).status,404,"retraction is single-use");
 const retractionAudit=await db.auditEvent.findFirst({where:{
  actorId:staff.id,action:"circle.update.retract",
  entity:"CircleUpdate",entityId:mistaken.data.id
 }});
 assert.ok(retractionAudit);
 assert.ok(!retractionAudit.detail.includes("Synthetic message"),
  "retraction audit must never copy private message body");

 // A previously approved adult member becomes ineligible for private
 // circle updates after a student-role reclassification. Do not rely on
 // the historical approved circle membership status.
 const originalRole=member.role;
 try{
  await db.user.update({where:{id:member.id},data:{role:"student"}});
  const blockedMine=await request("circles/mine","GET",undefined,memberToken);
  assert.equal(blockedMine.status,403,"reclassified student cannot read private updates");
  assert.equal(blockedMine.error.code,"ADULT_ONLY");
  assert.ok(!JSON.stringify(blockedMine).includes(body));
  assert.equal((await request("circles","POST",{circleId:draft.data.id},memberToken)).status,403);
 }finally{
  await db.user.update({where:{id:member.id},data:{role:originalRole}});
 }
 const adultMine=await request("circles/mine","GET",undefined,memberToken);
 assert.equal(adultMine.status,200);
 assert.ok(adultMine.data.updates.some(u=>u.id===posted.data.id));

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

 // F-012: actual private queue can exceed 100, but names must remain
 // paginated and every cursor checked against assigned current host,
 // same published circle and eligible active members.
 const largeCircle=await db.circle.create({data:{
  organizationId:org.id,hostId:staff.id,
  title:"Synthetic large private moderator queue",
  summary:"Controlled review of a synthetic CI circle with many participants.",
  cadence:"Weekly synthetic schedule",
  guidelines:"No real people or personal information in this test roster.",
  status:"published"
 }});
 ids.push(largeCircle.id);
 const fakeIds=Array.from({length:55},()=>randomUUID());
 fakeCircleUsers.push(...fakeIds);
 await db.user.createMany({data:fakeIds.map((id,i)=>({
  id,email:"ci-circle-"+id+"@example.test",firstName:"CI Circle Applicant",
  lastName:"Member "+String(i).padStart(2,"0"),
  role:"member",passwordHash:staff.passwordHash,verifiedAt:new Date()
 }))});
 await db.organizationMembership.createMany({data:fakeIds.map(userId=>({
  organizationId:org.id,userId,status:"active"
 }))});
 const requestedAt=new Date("2031-08-22T10:30:00Z");
 const people=fakeIds.map(userId=>({
  id:randomUUID(),circleId:largeCircle.id,userId,
  requestedAt,status:"requested"
 }));
 await db.circleMember.createMany({data:people});
 const expected=people.map(p=>p.id).sort(),seen=[];
 let cursor=null,firstCursor=null;
 for(let i=0;i<3;i++){
  const response=await request("circles/host?circleId="+largeCircle.id+
   (cursor?"&cursor="+encodeURIComponent(cursor):""),
   "GET",undefined,staffToken);
  assert.equal(response.status,200,JSON.stringify(response));
  assert.equal(response.data.pageSize,25);
  assert.equal(response.data.members.length,i===2?5:25);
  assert.equal(response.data.hasMore,i!==2);
  assert.equal(response.data.rosterComplete,i===2);
  assert.ok(response.data.members.every(item=>
   Object.keys(item.member).sort().join(",")==="firstName,lastName"));
  seen.push(...response.data.members.map(item=>item.id));
  cursor=response.data.nextCursor;
  if(i===0){firstCursor=cursor;assert.equal(cursor,seen[seen.length-1]);}
  if(i===2)assert.equal(cursor,null);
 }
 assert.deepEqual(seen,expected,
  "25/25/5 synthetic same-time requests must be complete and duplicate-free");
 for(const query of [
  "cursor="+randomUUID(),
  "cursor="+joined.data.id,
  "cursor=",
  "cursor=bad",
  "cursor="+firstCursor+"&cursor="+firstCursor,
  "circleId="+draft.data.id+"&cursor="+firstCursor
 ]){
  const url=query.startsWith("circleId=")
   ?"circles/host?"+query:"circles/host?circleId="+largeCircle.id+"&"+query;
  const result=await request(url,"GET",undefined,staffToken);
  assert.ok([404,422].includes(result.status),
   "unknown/foreign/duplicate cursor must fail closed: "+query);
 }
 assert.equal((await request("circles/host?cursor="+firstCursor,
  "GET",undefined,staffToken)).status,422);
 assert.equal((await request("circles/host?circleId="+largeCircle.id+
  "&circleId="+draft.data.id,"GET",undefined,staffToken)).status,422);
 const pivotMember=people.find(p=>p.id===firstCursor);
 assert.ok(pivotMember);
 try{
  await db.organizationMembership.update({where:{
   organizationId_userId:{organizationId:org.id,userId:pivotMember.userId}
  },data:{status:"suspended"}});
  const blocked=await request("circles/host?circleId="+largeCircle.id+
   "&cursor="+firstCursor,"GET",undefined,staffToken);
  assert.equal(blocked.status,404,
   "suspending a member invalidates their roster cursor immediately");
  assert.equal(blocked.error.code,"CIRCLE_CURSOR_UNAVAILABLE");
 }finally{
  await db.organizationMembership.update({where:{
   organizationId_userId:{organizationId:org.id,userId:pivotMember.userId}
  },data:{status:"active"}});
 }
 const originalHostRole=staff.role;
 try{
  await db.user.update({where:{id:staff.id},data:{role:"student"}});
  const blocked=await request("circles/host?circleId="+largeCircle.id+
   "&cursor="+firstCursor,"GET",undefined,staffToken);
  assert.equal(blocked.status,403,
   "student-reclassified host cannot continue a private circle roster");
  assert.equal((await request("circles/host?circleId="+largeCircle.id+
   "&mode=access","GET",undefined,staffToken)).status,403,
   "reclassified host cannot pass a name-free circle permission check");
 }finally{
  await db.user.update({where:{id:staff.id},data:{role:originalHostRole}});
 }
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
 assert.equal((await request("circles/host?circleId="+third.data.id+
  "&mode=access","GET",undefined,staffToken)).status,404,
  "archiving revokes even a cached circle access-only check");
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
 if(fakeCircleUsers.length){
  await db.organizationMembership.deleteMany({where:{userId:{in:fakeCircleUsers}}});
  await db.user.deleteMany({where:{id:{in:fakeCircleUsers}}});
 }
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

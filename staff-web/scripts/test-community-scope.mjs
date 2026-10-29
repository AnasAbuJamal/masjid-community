// HTTP regression: other mosques' public IDs never authorize member writes,
// private dashboard reads or authorized facility decisions.
// Uses a disposable CI PostgreSQL instance and synthetic accounts only.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomBytes,createHash} from "node:crypto";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||process.env.VERCEL||
   !process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Community scope tests require isolated masjid_ci PostgreSQL.");
const {memberEmail,adminEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",payload,token){
 const response=await fetch(base+path,{method,headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  ...(payload?{"Content-Type":"application/json"}:{})
 },body:payload?JSON.stringify(payload):undefined});
 return {status:response.status,...await response.json().catch(()=>({}))};
}
const fixtureIds={};
let foreignOrg=null;
let adminSession=null;
try {
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org,"CI mosque exists");
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const signedIn=await request("auth/login","POST",{email:memberEmail,password});
 assert.equal(signedIn.status,200);
 const memberToken=signedIn.data.token;
 const adminToken=randomBytes(32).toString("base64url");
 adminSession=await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  expiresAt:new Date(Date.now()+3600000),mfaVerifiedAt:new Date()
 }});
 foreignOrg=await db.organization.create({data:{slug:"community-scope-ci-"+Date.now(),name:"Different mosque"}});
 const farDate=new Date(Date.now()+3*86400000);
 const endDate=new Date(farDate.getTime()+3600000);
 const foreignEvent=await db.event.create({data:{
  organizationId:foreignOrg.id,title:"Different mosque event",description:"Synthetic other mosque",
  location:"Other venue",startAt:farDate,endAt:endDate,status:"published",capacity:10,rsvpCount:1
 }});
 fixtureIds.event=foreignEvent.id;
 const foreignRSVP=await db.eventRSVP.create({data:{eventId:foreignEvent.id,userId:member.id,status:"confirmed"}});
 const foreignOpportunity=await db.volunteerOpportunity.create({data:{
  organizationId:foreignOrg.id,title:"Different mosque volunteer",description:"Synthetic data",
  startsAt:farDate,capacity:10,published:true
 }});
 fixtureIds.opportunity=foreignOpportunity.id;
 const foreignApplication=await db.volunteerApplication.create({data:{
  opportunityId:foreignOpportunity.id,userId:member.id
 }});
 fixtureIds.application=foreignApplication.id;
 const foreignApprovedApp=await db.volunteerApplication.create({data:{
  opportunityId:foreignOpportunity.id,userId:admin.id,status:"approved"
 }});
 fixtureIds.foreignApprovedApplication=foreignApprovedApp.id;
 const foreignShift=await db.volunteerShift.create({data:{
  applicationId:foreignApplication.id,opportunityId:foreignOpportunity.id,userId:member.id,
  startAt:farDate,endAt:endDate
 }});
 fixtureIds.shift=foreignShift.id;
 const foreignProposal=await db.proposal.create({data:{
  organizationId:foreignOrg.id,title:"Different mosque proposal",
  description:"Confidential synthetic proposal for other community",
  submittedById:member.id,status:"published"
 }});
 fixtureIds.proposal=foreignProposal.id;
 await db.proposalVote.create({data:{proposalId:foreignProposal.id,userId:member.id}});
 const title="Community-scoped duplicate proposal";
 await db.proposal.create({data:{
  organizationId:foreignOrg.id,title,description:"Unrelated mosque draft",
  submittedById:member.id,status:"draft"
 }});
 const foreignJob=await db.jobPosting.create({data:{
  organizationId:foreignOrg.id,title:"Different mosque opportunity",
  company:"Other mosque",description:"Synthetic private role",status:"published"
 }});
 fixtureIds.job=foreignJob.id;
 const foreignJobApp=await db.jobApplication.create({data:{
  jobId:foreignJob.id,userId:member.id,coverLetter:"Sensitive synthetic cover letter"
 }});
 fixtureIds.jobApplication=foreignJobApp.id;
 const foreignResource=await db.rentalResource.create({data:{
  organizationId:foreignOrg.id,title:"Different mosque room",
  description:"Synthetic room",published:true
 }});
 fixtureIds.resource=foreignResource.id;
 const foreignBooking=await db.rentalBooking.create({data:{
  resourceId:foreignResource.id,userId:member.id,startAt:farDate,endAt:endDate
 }});
 fixtureIds.booking=foreignBooking.id;
 const foreignCampaign=await db.donationCampaign.create({data:{
  organizationId:foreignOrg.id,title:"Different mosque giving",
  purpose:"Synthetic foreign-purpose text",published:true
 }});
 fixtureIds.campaign=foreignCampaign.id;
 const foreignDonation=await db.donation.create({data:{
  campaignId:foreignCampaign.id,donorId:member.id,amountMinor:1500,status:"paid"
 }});
 fixtureIds.donation=foreignDonation.id;
 const foreignCheckout=await request("donations/checkout","POST",{
  campaignId:foreignCampaign.id,amountMinor:1500,anonymous:false
 },memberToken);
 assert.equal(foreignCheckout.status,404,
  "foreign campaign checkout fails before a payment intent or donation is created");
 assert.equal(await db.donation.count({where:{campaignId:foreignCampaign.id}}),1,
  "rejected payment request cannot persist a new donation");

 // All independent ID-based write paths must reject unrelated organizations.
 const attempts=[
  {body:{kind:"rsvp",eventId:foreignEvent.id},expected:404},
  {body:{kind:"volunteer",opportunityId:foreignOpportunity.id},expected:404},
  {body:{kind:"vote",proposalId:foreignProposal.id},expected:404},
  {body:{kind:"job",jobId:foreignJob.id,coverLetter:"I want to help this other group."},expected:404},
  {body:{kind:"rental",resourceId:foreignResource.id,startAt:farDate.toISOString(),endAt:endDate.toISOString()},expected:404}
 ];
 for(const attempt of attempts){
  const result=await request("actions","POST",attempt.body,memberToken);
  assert.equal(result.status,attempt.expected,
   "foreign action denied: "+attempt.body.kind);
 }
 assert.equal(await db.eventRSVP.count({where:{eventId:foreignEvent.id}}),1);
 assert.equal(await db.volunteerApplication.count({where:{opportunityId:foreignOpportunity.id}}),2,
  "rejected request must not add to the member and approved-staff fixture applications");
 assert.equal(await db.proposalVote.count({where:{proposalId:foreignProposal.id}}),1);
 assert.equal(await db.jobApplication.count({where:{jobId:foreignJob.id}}),1);
 assert.equal(await db.rentalBooking.count({where:{resourceId:foreignResource.id}}),1);

 const me=await request("me","GET",null,memberToken);
 assert.equal(me.status,200);
 assert.ok(!me.data.donations.some(x=>x.id===foreignDonation.id),"foreign donation hidden");
 assert.ok(!me.data.rsvps.some(x=>x.id===foreignRSVP.id),"foreign RSVP hidden");
 assert.ok(!me.data.volunteerApplications.some(x=>x.id===foreignApplication.id),"foreign volunteering hidden");
 assert.ok(!me.data.jobApplications.some(x=>x.id===foreignJobApp.id),"foreign job application hidden");
 assert.ok(!me.data.bookings.some(x=>x.id===foreignBooking.id),"foreign booking hidden");

 const shifts=await request("shifts","GET",null,memberToken);
 assert.equal(shifts.status,200);
 assert.ok(!shifts.data.shifts.some(x=>x.id===foreignShift.id),"foreign shift hidden");
 const proposals=await request("proposals","GET",null,memberToken);
 assert.equal(proposals.status,200);
 assert.ok(!proposals.data.items.some(x=>x.id===foreignProposal.id),"foreign proposal hidden");
 const localProposal=await request("proposals","POST",{
  title,description:"I propose more accessible community volunteering and learning opportunities."
 },memberToken);
 assert.equal(localProposal.status,201,"other mosque draft cannot block local proposal submission");
 fixtureIds.localProposal=localProposal.data.id;

 // Privileged dashboards and work queues must never cross organization scopes.
 const steward=await request("admin","GET",null,adminToken);
 assert.equal(steward.status,200);
 assert.ok(!steward.data.events.some(x=>x.id===foreignEvent.id),"foreign event hidden from steward");
 assert.ok(!steward.data.applications.some(x=>x.id===foreignApplication.id),"foreign volunteer application hidden from steward");
 assert.equal(steward.data.counts.events,await db.event.count({where:{organizationId:org.id}}));
 assert.equal(steward.data.counts.donations,await db.donation.count({where:{campaign:{organizationId:org.id}}}));
 const finance=await request("admin/finance","GET",null,adminToken);
 assert.equal(finance.status,200);
 assert.ok(!finance.data.payments.some(x=>x.id===foreignDonation.id),"foreign paid record absent from finance totals");
 const foreignVolunteerDecision=await request("admin","POST",{
  kind:"volunteer-decision",applicationId:foreignApplication.id,decision:"approved"
 },adminToken);
 assert.equal(foreignVolunteerDecision.status,404,"steward cannot decide foreign volunteer application");
 assert.equal((await db.volunteerApplication.findUniqueOrThrow({where:{id:foreignApplication.id}})).status,"submitted");
 const shiftQueue=await request("admin/shifts","GET",null,adminToken);
 assert.equal(shiftQueue.status,200);
 assert.ok(!shiftQueue.data.applications.some(x=>x.id===foreignApprovedApp.id),"approved foreign application absent from shift queue");
 assert.ok(!shiftQueue.data.shifts.some(x=>x.id===foreignShift.id),"foreign shift absent from steward listing");
 const foreignSchedule=await request("admin/shifts","POST",{
  kind:"schedule",applicationId:foreignApprovedApp.id,startAt:farDate.toISOString(),endAt:endDate.toISOString()
 },adminToken);
 assert.equal(foreignSchedule.status,404,"steward cannot schedule foreign approved application");
 const foreignCheckIn=await request("admin/shifts","POST",{
  kind:"update",shiftId:foreignShift.id,action:"cancel"
 },adminToken);
 assert.equal(foreignCheckIn.status,409,"steward cannot modify foreign volunteer shift");
 assert.equal((await db.volunteerShift.findUniqueOrThrow({where:{id:foreignShift.id}})).status,"scheduled");
 const adminQueue=await request("admin/operations","GET",null,adminToken);
 assert.equal(adminQueue.status,200);
 assert.ok(!adminQueue.data.bookings.some(x=>x.id===foreignBooking.id),"foreign facility request hidden from steward");
 const foreignDecision=await request("admin/operations","POST",{
  kind:"rental-decision",bookingId:foreignBooking.id,decision:"approved"
 },adminToken);
 assert.equal(foreignDecision.status,409,"steward cannot approve another mosque's booking");
 assert.equal((await db.rentalBooking.findUniqueOrThrow({where:{id:foreignBooking.id}})).status,"requested");

 // Confirm local published items remain usable after scoping.
 const localOpportunity=await db.volunteerOpportunity.create({data:{
  organizationId:org.id,title:"Local service CI",description:"Own mosque opportunity",
  startsAt:farDate,capacity:10,published:true
 }});
 fixtureIds.localOpportunity=localOpportunity.id;
 const localJob=await db.jobPosting.create({data:{
  organizationId:org.id,title:"Local CI role",company:"Home mosque",
  description:"Own mosque job",status:"published"
 }});
 fixtureIds.localJob=localJob.id;
 const localProposalPublished=await db.proposal.create({data:{
  organizationId:org.id,title:"Local CI vote",description:"Own mosque proposal",
  submittedById:member.id,status:"published"
 }});
 fixtureIds.localPublishedProposal=localProposalPublished.id;
 const localResource=await db.rentalResource.create({data:{
  organizationId:org.id,title:"Local CI room",description:"Own mosque room",published:true
 }});
 fixtureIds.localResource=localResource.id;
 const positives=[
  {kind:"volunteer",opportunityId:localOpportunity.id},
  {kind:"vote",proposalId:localProposalPublished.id},
  {kind:"job",jobId:localJob.id,coverLetter:"I would like to support my own mosque."},
  {kind:"rental",resourceId:localResource.id,startAt:farDate.toISOString(),endAt:endDate.toISOString()}
 ];
 for(const item of positives){
  const accepted=await request("actions","POST",item,memberToken);
  assert.equal(accepted.status,201,"local action accepted: "+item.kind);
  if(item.kind==="rental")fixtureIds.localBooking=accepted.data.id;
 }
 // Home mosque volunteer review -> scheduled shift must still work.
 const localVolunteerApp=await db.volunteerApplication.findUniqueOrThrow({where:{
  opportunityId_userId:{opportunityId:localOpportunity.id,userId:member.id}
 }});
 const reviewed=await request("admin","POST",{
  kind:"volunteer-decision",applicationId:localVolunteerApp.id,decision:"approved"
 },adminToken);
 assert.equal(reviewed.status,201,"steward may approve local volunteer application");
 const scheduled=await request("admin/shifts","POST",{
  kind:"schedule",applicationId:localVolunteerApp.id,startAt:farDate.toISOString(),endAt:endDate.toISOString()
 },adminToken);
 assert.equal(scheduled.status,201,"steward may schedule home mosque shift");
 fixtureIds.localShift=scheduled.data.id;
 const localShifts=await request("admin/shifts","GET",null,adminToken);
 assert.ok(localShifts.data.shifts.some(x=>x.id===fixtureIds.localShift));
 const localAdminQueue=await request("admin/operations","GET",null,adminToken);
 assert.ok(localAdminQueue.data.bookings.some(x=>x.id===fixtureIds.localBooking),
  "own mosque booking is visible to steward");
 const localDecision=await request("admin/operations","POST",{
  kind:"rental-decision",bookingId:fixtureIds.localBooking,decision:"approved"
 },adminToken);
 assert.equal(localDecision.status,200,"authorized steward can approve a home-mosque request");
 const localDashboard=await request("me","GET",null,memberToken);
 assert.ok(localDashboard.data.volunteerApplications.some(x=>x.opportunity.title==="Local service CI"));
 assert.ok(localDashboard.data.jobApplications.some(x=>x.job.title==="Local CI role"));
 assert.ok(localDashboard.data.bookings.some(x=>x.id===fixtureIds.localBooking));
 console.log("Verified member actions, steward dashboard, finance, volunteer approvals/shifts and facilities deny cross-mosque data.");
}finally{
 // Test fixtures are deliberately synthetic and must never run against live DB.
 if(adminSession)await db.authSession.deleteMany({where:{id:adminSession.id}});
 for(const id of [fixtureIds.localBooking,fixtureIds.booking].filter(Boolean))
  await db.rentalBooking.deleteMany({where:{id}});
 for(const id of [fixtureIds.localResource,fixtureIds.resource].filter(Boolean))
  await db.rentalResource.deleteMany({where:{id}});
 for(const id of [fixtureIds.localOpportunity,fixtureIds.opportunity].filter(Boolean)){
  await db.volunteerShift.deleteMany({where:{opportunityId:id}});
  await db.volunteerApplication.deleteMany({where:{opportunityId:id}});
  await db.volunteerOpportunity.deleteMany({where:{id}});
 }
 for(const id of [fixtureIds.localPublishedProposal,fixtureIds.localProposal,fixtureIds.proposal].filter(Boolean)){
  await db.proposalVote.deleteMany({where:{proposalId:id}});
  await db.proposal.deleteMany({where:{id}});
 }
 if(foreignOrg)await db.proposal.deleteMany({where:{
  organizationId:foreignOrg.id,status:"draft"
 }});
 for(const id of [fixtureIds.localJob,fixtureIds.job].filter(Boolean)){
  await db.jobApplication.deleteMany({where:{jobId:id}});
  await db.jobPosting.deleteMany({where:{id}});
 }
 if(fixtureIds.donation)await db.donation.deleteMany({where:{id:fixtureIds.donation}});
 if(fixtureIds.campaign)await db.donationCampaign.deleteMany({where:{id:fixtureIds.campaign}});
 if(fixtureIds.event){
  await db.eventRSVP.deleteMany({where:{eventId:fixtureIds.event}});
  await db.event.deleteMany({where:{id:fixtureIds.event}});
 }
 if(foreignOrg)await db.organization.deleteMany({where:{id:foreignOrg.id}});
 await db.$disconnect();
}

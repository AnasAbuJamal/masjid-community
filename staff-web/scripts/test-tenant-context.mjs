// F-048 member context pilot: selected organization stored in server-side
// auth session, no global role transfer or header/body tenant spoofing.
// Operates ONLY against isolated, disposable GitHub Actions masjid_ci.
import assert from "node:assert/strict";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

if(process.env.GITHUB_ACTIONS!=="true"||process.env.NODE_ENV==="production"||
 process.env.VERCEL||!process.env.DATABASE_URL?.endsWith("/masjid_ci"))
 throw Error("Cross-mosque context tests require disposable CI PostgreSQL.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient(),base="http://127.0.0.1:3000/api/v1/";
const fixture={notes:[],campaigns:[],donations:[],events:[],rsvps:[],prefs:[],invitations:[],
 opportunities:[],volunteerApplications:[],shifts:[],venues:[],prayerDays:[],
 jummah:[],faithNotices:[],announcements:[],articles:[],budgets:[]};
const createdAt=new Date();
let foreignOrgId=null,foreignMembershipId=null,adminMembershipId=null;
const tokens=[];
async function call(path,method="GET",body,token,headers={}){
 const r=await fetch(base+path,{method,headers:{
  ...(token?{authorization:"Bearer "+token}:{}),
  ...(body?{"content-type":"application/json"}:{}),...headers
 },body:body?JSON.stringify(body):undefined});
 return {status:r.status,...await r.json().catch(()=>({}))};
}
async function login(email){
 const result=await call("auth/login","POST",{email,password});
 assert.equal(result.status,200,JSON.stringify(result));
 tokens.push(result.data.token);
 return result.data.token;
}
async function note(orgId,userId,body){
 const value=await db.notification.create({data:{
  organizationId:orgId,userId,title:"Synthetic private mosque message",body
 }});
 fixture.notes.push(value.id);return value;
}
try{
 const home=await db.organization.findFirstOrThrow({orderBy:[{createdAt:"asc"},{id:"asc"}]});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const admin=await db.user.findUniqueOrThrow({where:{email:adminEmail}});
 const homeMember=await db.organizationMembership.findUniqueOrThrow({where:{
  organizationId_userId:{organizationId:home.id,userId:member.id}
 }});
 assert.equal(homeMember.status,"active");
 assert.equal((await call("events/catalog")).status,401,
  "authenticated gathering catalog must never become a public second-tenant listing");
 const first=await login(memberEmail);
 const second=await login(memberEmail);
 const stranger=await call("organizations/context");
 assert.equal(stranger.status,401,"anonymous users cannot list private memberships");
 const initial=await call("organizations/context","GET",undefined,first);
 assert.equal(initial.status,200);
 assert.equal(initial.data.selectedOrganizationId,home.id);
 assert.ok(initial.data.selectedActive);
 assert.ok(initial.data.organizations.some(o=>o.id===home.id&&o.memberWorkspace==="pilot"));
 const foreign=await db.organization.create({data:{
  name:"Synthetic private second mosque",slug:"session-tenant-"+randomUUID(),
  timeZone:"America/Chicago"
 }});
 foreignOrgId=foreign.id;
 const foreignMembership=await db.organizationMembership.create({data:{
  organizationId:foreign.id,userId:member.id
 }});
 foreignMembershipId=foreignMembership.id;
 const directForeign=await db.organizationMembership.create({data:{
  organizationId:foreign.id,userId:admin.id
 }});
 adminMembershipId=directForeign.id;

 // Synthetic worship evidence belongs to the *foreign selected mosque*,
 // never the original pilot. These are fictional test fixtures only.
 const homeVenue=await db.venue.findFirstOrThrow({where:{organizationId:home.id},
  orderBy:{id:"asc"}});
 const foreignVenue=await db.venue.create({data:{
  organizationId:foreign.id,name:"FOREIGN_SYNTHETIC_VENUE",address:"Synthetic test location",
  timeZone:"America/Chicago"
 }});
 fixture.venues.push(foreignVenue.id);
 const parts=new Intl.DateTimeFormat("en-US",{
  year:"numeric",month:"2-digit",day:"2-digit",timeZone:"America/Chicago"
 }).formatToParts(new Date());
 const part=(type)=>parts.find(x=>x.type===type)?.value||"";
 const chicagoToday=part("year")+"-"+part("month")+"-"+part("day");
 const worshipTimes={fajr:"05:30",sunrise:"06:45",dhuhr:"12:25",
  asr:"15:40",maghrib:"17:45",isha:"19:10"};
 const publishedPrayer=await db.prayerDay.create({data:{
  venueId:foreignVenue.id,localDate:chicagoToday,...worshipTimes,
  source:"FOREIGN_SYNTHETIC_PUBLISHED_PRAYER",published:true,publishedAt:new Date()
 }});
 fixture.prayerDays.push(publishedPrayer.id);
 const unpublishedPrayer=await db.prayerDay.create({data:{
  venueId:foreignVenue.id,localDate:"2032-11-06",...worshipTimes,
  source:"FOREIGN_SYNTHETIC_DRAFT_PRAYER",published:false
 }});
 fixture.prayerDays.push(unpublishedPrayer.id);
 const foreignJummah=await db.jummahSession.create({data:{
  venueId:foreignVenue.id,localDate:chicagoToday,ordinal:1,
  khutbahAt:"13:00",iqamahAt:"13:25"
 }});
 fixture.jummah.push(foreignJummah.id);
 const foreignFaith=await db.faithNotice.create({data:{
  organizationId:foreign.id,kind:"moon_sighting",localDate:"2032-11-05",
  title:"FOREIGN_SYNTHETIC_APPROVED_FAITH",body:"Fictional approved notice",
  status:"published",approvedById:admin.id,publishedAt:new Date()
 }});
 fixture.faithNotices.push(foreignFaith.id);
 const foreignNotice=await db.announcement.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_PUBLIC_NOTICE",
  body:"Fictional published mosque notice",status:"published",publishedAt:new Date()
 }});
 fixture.announcements.push(foreignNotice.id);
 const draftNotice=await db.announcement.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_DRAFT_NOTICE",
  body:"Unpublished notice",status:"draft"
 }});
 fixture.announcements.push(draftNotice.id);

 // Publication gates for selected-mosque editorial and financial read-only views.
 const releasedArticle=await db.communityArticle.create({data:{
  organizationId:foreign.id,title:"FOREIGN_PUBLISHED_ARTICLE",
  body:"Fictional reviewed community writing",status:"published",publishedAt:new Date()
 }});
 fixture.articles.push(releasedArticle.id);
 const draftArticle=await db.communityArticle.create({data:{
  organizationId:foreign.id,title:"FOREIGN_DRAFT_ARTICLE",
  body:"Unpublished writing must remain hidden",status:"draft"
 }});
 fixture.articles.push(draftArticle.id);
 const futureArticle=await db.communityArticle.create({data:{
  organizationId:foreign.id,title:"FOREIGN_FUTURE_ARTICLE",
  body:"Embargoed publication",status:"published",
  publishedAt:new Date(Date.now()+86400000)
 }});
 fixture.articles.push(futureArticle.id);
 const releasedBudget=await db.financeBudget.create({data:{
  organizationId:foreign.id,category:"FOREIGN_PUBLISHED_BUDGET",
  periodMonth:"2032-11",amountMinor:123400,published:true
 }});
 fixture.budgets.push(releasedBudget.id);
 const hiddenBudget=await db.financeBudget.create({data:{
  organizationId:foreign.id,category:"FOREIGN_DRAFT_BUDGET",
  periodMonth:"2032-10",amountMinor:900,published:false
 }});
 fixture.budgets.push(hiddenBudget.id);
 const guestWorship=await call("organizations/view?resource=venues");
 assert.equal(guestWorship.status,401,"selected-mosque worship route requires authenticated membership");
 const homeVenues=await call("organizations/view?resource=venues","GET",undefined,first);
 assert.equal(homeVenues.status,200);
 assert.equal(homeVenues.data.organization.id,home.id);
 assert.ok(homeVenues.data.venues.some(v=>v.id===homeVenue.id));
 assert.ok(!homeVenues.data.venues.some(v=>v.id===foreignVenue.id));
 const homeWorship=await call("organizations/view?resource=home","GET",undefined,first);
 assert.equal(homeWorship.status,200);
 assert.equal(homeWorship.data.organization.id,home.id);
 assert.ok(!JSON.stringify(homeWorship).includes("FOREIGN_SYNTHETIC_PUBLISHED_PRAYER"));
 assert.ok(!JSON.stringify(homeWorship).includes("FOREIGN_SYNTHETIC_PUBLIC_NOTICE"));
 assert.equal((await call("organizations/view?resource=home&venueId="+foreignVenue.id,
  "GET",undefined,first)).status,404);
 const homeNote=await note(home.id,member.id,"HOME_PRIVATE_CONTEXT_ONLY");
 const foreignNote=await note(foreign.id,member.id,"FOREIGN_PRIVATE_CONTEXT_ONLY");
 const unknownNote=await note(null,member.id,"LEGACY_UNOWNED_NEVER_PRESENT");
 const campaignHome=await db.donationCampaign.create({data:{
  organizationId:home.id,title:"HOME_SYNTHETIC_FUND",purpose:"Home-only test",published:true
 }});
 fixture.campaigns.push(campaignHome.id);
 const campaignForeign=await db.donationCampaign.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_FUND",purpose:"Foreign-only test",published:true
 }});
 fixture.campaigns.push(campaignForeign.id);
 for(const c of [campaignHome,campaignForeign]){
  const d=await db.donation.create({data:{
   campaignId:c.id,donorId:member.id,amountMinor:1400,currency:"usd",status:"pending"
  }});
  fixture.donations.push(d.id);
 }
 const event=await db.event.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_PRIVATE_RSVP",description:"Private event",
  location:"Synthetic community",status:"published",startAt:new Date(Date.now()+86400000),
  endAt:new Date(Date.now()+90000000),rsvpCount:1,
  venueId:foreignVenue.id,category:"workshop",audience:"families",
  accessibilityFeatures:["step_free"],accessibilityNotes:"Synthetic verified step-free route."
 }});
 fixture.events.push(event.id);
 const homeEvent=await db.event.create({data:{
  organizationId:home.id,title:"HOME_SYNTHETIC_RSVP_EVENT",description:"Home gathering",
  location:"Synthetic home hall",status:"published",startAt:new Date(Date.now()+86400000),
  endAt:new Date(Date.now()+90000000),capacity:2,
  venueId:homeVenue.id,category:"service",audience:"everyone"
 }});
 fixture.events.push(homeEvent.id);
 const foreignDraft=await db.event.create({data:{
  organizationId:foreign.id,title:"FOREIGN_SYNTHETIC_UNPUBLISHED_EVENT",
  description:"Not for publication",location:"Private draft",
  status:"draft",startAt:new Date(Date.now()+86400000),
  endAt:new Date(Date.now()+90000000)
 }});
 fixture.events.push(foreignDraft.id);
 const homeCatalog=await call("events/catalog","GET",undefined,first);
 assert.equal(homeCatalog.status,200,JSON.stringify(homeCatalog));
 assert.equal(homeCatalog.data.organization.id,home.id);
 assert.ok(homeCatalog.data.items.some(x=>x.id===homeEvent.id));
 assert.ok(!homeCatalog.data.items.some(x=>x.id===event.id||x.id===foreignDraft.id));
 assert.equal((await call("events/catalog?eventId="+event.id,"GET",undefined,first)).status,404,
  "known foreign event ID must not reveal its publication or metadata");
 const homeTagged=await call("events/catalog?category=service&audience=everyone&venueId="+homeVenue.id,
  "GET",undefined,first);
 assert.equal(homeTagged.status,200);
 assert.ok(homeTagged.data.items.some(x=>x.id===homeEvent.id));
 assert.ok(!homeTagged.data.items.some(x=>x.id===event.id));
 const guestTagged=await call("public/events?category=service&venueId="+homeVenue.id);
 assert.equal(guestTagged.status,200);
 assert.ok(guestTagged.data.items.some(x=>x.id===homeEvent.id));
 assert.ok(!guestTagged.data.items.some(x=>x.id===event.id));
 const rsvp=await db.eventRSVP.create({data:{eventId:event.id,userId:member.id}});
 fixture.rsvps.push(rsvp.id);
 // Two genuine future service shifts belong to the same person but different
 // mosques. Their records must never mix in upcoming commitments.
 const shifts={};
 for(const [label,orgId] of [["HOME",home.id],["FOREIGN",foreign.id]]){
  const opportunity=await db.volunteerOpportunity.create({data:{
   organizationId:orgId,title:label+"_SYNTHETIC_UPCOMING_SHIFT",
   description:"Synthetic test volunteer shift",startsAt:new Date(Date.now()+172800000),
   capacity:3,published:true
  }});
  fixture.opportunities.push(opportunity.id);
  const application=await db.volunteerApplication.create({data:{
   opportunityId:opportunity.id,userId:member.id,status:"approved"
  }});
  fixture.volunteerApplications.push(application.id);
  const shift=await db.volunteerShift.create({data:{
   opportunityId:opportunity.id,applicationId:application.id,userId:member.id,
   startAt:new Date(Date.now()+172800000),endAt:new Date(Date.now()+176400000)
  }});
  fixture.shifts.push(shift.id);
  shifts[label]=shift;
 }
 const homeInbox=await call("me","GET",undefined,first);
 assert.equal(homeInbox.status,200);
 assert.equal(homeInbox.data.organization.id,home.id);
 assert.ok(homeInbox.data.upcoming.some(x=>x.id===shifts.HOME.id&&x.kind==="service_shift"));
 assert.ok(!homeInbox.data.upcoming.some(x=>x.id===shifts.FOREIGN.id||x.eventId===event.id),
  "home dashboard must exclude all foreign future commitments");
 assert.ok(homeInbox.data.notifications.some(n=>n.id===homeNote.id));
 assert.ok(homeInbox.data.donations.some(d=>d.campaign.title==="HOME_SYNTHETIC_FUND"));
 assert.ok(!JSON.stringify(homeInbox.data).includes("FOREIGN_PRIVATE_CONTEXT_ONLY"));
 assert.ok(!JSON.stringify(homeInbox.data).includes("FOREIGN_SYNTHETIC_FUND"));
 assert.ok(!JSON.stringify(homeInbox.data).includes("FOREIGN_SYNTHETIC_PRIVATE_RSVP"));
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,first)).status,404,
  "home context cannot see known foreign registration");
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:event.id},first)).status,404,
  "home context cannot reserve foreign event by known ID");
 const invalid=await call("organizations/context","POST",{
  organizationId:"missing-organization-"+randomUUID()
 },first);
 assert.equal(invalid.status,404,"an arbitrary organization ID is not authority");
 assert.equal((await call("organizations/context","POST",{organizationId:foreign.id},first,
  {origin:"https://malicious.example.test"})).status,403,"wrong browser origin must be rejected");
 const rejectedBody=await call("organizations/context","POST",{
  organizationId:foreign.id,role:"admin"
 },first);
 assert.equal(rejectedBody.status,422,"unexpected client role or scope fields are denied");
 const list=await call("organizations/context?organizationId="+foreign.id,
  "GET",undefined,first,{"x-organization-id":foreign.id});
 assert.equal(list.data.selectedOrganizationId,home.id,
  "forged header or query must not change selection");
 assert.ok(list.data.organizations.some(o=>o.id===foreign.id&&o.selectable));
 const changed=await call("organizations/context","POST",{organizationId:foreign.id},first);
 assert.equal(changed.status,200,JSON.stringify(changed));
 assert.equal(changed.data.selectedOrganizationId,foreign.id);
 assert.equal(changed.data.limited,true);

 // Venue selection is an authorized filter, not a client-selected tenant.
 const selectedVenues=await call("organizations/view?resource=venues","GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(selectedVenues.status,200);
 assert.equal(selectedVenues.data.organization.id,foreign.id);
 assert.deepEqual(selectedVenues.data.venues.map(v=>v.id),[foreignVenue.id]);
 const filteredForeign=await call("events/catalog?category=workshop&audience=families"+
  "&accessibility=step_free&venueId="+foreignVenue.id,"GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(filteredForeign.status,200,JSON.stringify(filteredForeign));
 assert.equal(filteredForeign.data.organization.id,foreign.id);
 assert.deepEqual(filteredForeign.data.items.map(x=>x.id),[event.id]);
 assert.equal(filteredForeign.data.items[0].venue.timeZone,"America/Chicago");
 assert.equal((await call("events/catalog?venueId="+homeVenue.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?category=service","GET",undefined,first))
  .data.items.some(x=>x.id===homeEvent.id),false);
 assert.equal((await call("events/catalog?organizationId="+home.id,"GET",undefined,first)).status,422);

 const foreignAnnouncements=await call("organizations/view?resource=announcements","GET",undefined,first);
 assert.equal(foreignAnnouncements.status,200);
 assert.equal(foreignAnnouncements.data.organization.id,foreign.id);
 assert.deepEqual(foreignAnnouncements.data.items.map(x=>x.id),[foreignNotice.id],
  "draft or another mosque's announcements cannot enter the selected list");
 const selectedAnnouncement=await call("organizations/view?resource=announcements&itemId="+foreignNotice.id,
  "GET",undefined,first);
 assert.deepEqual(selectedAnnouncement.data.items.map(x=>x.id),[foreignNotice.id]);
 for(const id of [draftNotice.id,homeNote.id,"missing-article-id"]){
  assert.equal((await call("organizations/view?resource=announcements&itemId="+id,
   "GET",undefined,first)).status,404,"draft, foreign or unknown item IDs do not disclose content");
 }
 const foreignArticles=await call("organizations/view?resource=articles","GET",undefined,first);
 assert.equal(foreignArticles.status,200);
 assert.deepEqual(foreignArticles.data.items.map(x=>x.id),[releasedArticle.id]);
 assert.equal((await call("organizations/view?resource=articles&itemId="+releasedArticle.id,
  "GET",undefined,first)).data.items[0].id,releasedArticle.id);
 for(const id of [draftArticle.id,futureArticle.id]){
  assert.equal((await call("organizations/view?resource=articles&itemId="+id,
   "GET",undefined,first)).status,404,"unreleased articles remain inaccessible by ID");
 }
 const anonymousDiscovery=await call("organizations/search?q=FOREIGN&kind=all");
 assert.equal(anonymousDiscovery.status,401,"private selected-mosque search requires authentication");
 const selectedDiscovery=await call("organizations/search?q=FOREIGN&kind=all","GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(selectedDiscovery.status,200,JSON.stringify(selectedDiscovery));
 assert.equal(selectedDiscovery.data.organization.id,foreign.id);
 assert.deepEqual(new Set(selectedDiscovery.data.items.map(x=>x.kind)),
  new Set(["events","announcements","articles"]));
 assert.ok(selectedDiscovery.data.items.some(x=>x.id===event.id));
 assert.ok(selectedDiscovery.data.items.some(x=>x.id===foreignNotice.id));
 assert.ok(selectedDiscovery.data.items.some(x=>x.id===releasedArticle.id));
 assert.ok(!selectedDiscovery.data.items.some(x=>x.id===draftArticle.id||
  x.id===futureArticle.id||x.id===draftNotice.id||x.id===homeEvent.id));
 const articleDiscovery=await call("organizations/search?q=FOREIGN&kind=articles","GET",undefined,first);
 assert.deepEqual(articleDiscovery.data.items.map(x=>x.id),[releasedArticle.id]);
 const homeDiscovery=await call("organizations/search?q=FOREIGN&kind=all","GET",undefined,second);
 assert.equal(homeDiscovery.data.organization.id,home.id);
 assert.ok(!homeDiscovery.data.items.some(x=>x.id===event.id||
  x.id===releasedArticle.id||x.id===foreignNotice.id));
 for(const bad of [
  "q=a","q=FOREIGN&kind=jobs","q=FOREIGN&organizationId="+home.id,
  "q=FOREIGN&q=SECOND","q=FOREIGN&kind=all&kind=events",
  "q="+encodeURIComponent("!".repeat(10))
 ]){
  assert.equal((await call("organizations/search?"+bad,"GET",undefined,first)).status,422,
   "malformed or unauthorized selected search must return 422: "+bad);
 }
 const foreignFinance=await call("organizations/view?resource=financials","GET",undefined,first);
 assert.equal(foreignFinance.status,200);
 assert.equal(foreignFinance.data.organization.id,foreign.id);
 assert.deepEqual(foreignFinance.data.budgets.map(x=>x.id),[releasedBudget.id]);
 assert.match(foreignFinance.data.note,/not donations received or cash balances/);
 const originalFinance=await call("organizations/view?resource=financials","GET",undefined,second);
 assert.equal(originalFinance.data.organization.id,home.id);
 assert.ok(!originalFinance.data.budgets.some(x=>x.id===releasedBudget.id));
 const originalArticle=await call("organizations/view?resource=articles","GET",undefined,second);
 assert.ok(!originalArticle.data.items.some(x=>x.id===releasedArticle.id));
 for(const resource of ["financials","announcements","articles"]){
  assert.equal((await call("organizations/view?resource="+resource+"&organizationId="+home.id,
   "GET",undefined,first)).status,422,"tenant hint must not choose publication owner");
  assert.equal((await call("organizations/view?resource="+resource+"&venueId="+homeVenue.id,
   "GET",undefined,first)).status,422,"venue hints are forbidden for unrelated resources");
 }
 assert.equal((await call("organizations/view?resource=articles&itemId="+releasedArticle.id+
  "&itemId="+draftArticle.id,"GET",undefined,first)).status,422,
  "multiple item IDs must fail closed");

 const selectedToday=await call("organizations/view?resource=home&venueId="+foreignVenue.id,
  "GET",undefined,first);
 assert.equal(selectedToday.status,200,JSON.stringify(selectedToday));
 assert.equal(selectedToday.data.organization.id,foreign.id);
 assert.equal(selectedToday.data.venue.id,foreignVenue.id);
 assert.equal(selectedToday.data.venue.timeZone,"America/Chicago");
 assert.equal(selectedToday.data.prayer.source,"FOREIGN_SYNTHETIC_PUBLISHED_PRAYER");
 assert.ok(selectedToday.data.announcements.some(x=>x.id===foreignNotice.id));
 assert.ok(!selectedToday.data.announcements.some(x=>x.id===draftNotice.id));
 assert.ok(!JSON.stringify(selectedToday).includes("FOREIGN_SYNTHETIC_DRAFT_NOTICE"));
 assert.ok(!JSON.stringify(selectedToday).includes("HOME_SYNTHETIC_FUND"));
 const selectedPrayers=await call("organizations/view?resource=prayers&venueId="+foreignVenue.id+
  "&date="+chicagoToday,"GET",undefined,first);
 assert.equal(selectedPrayers.status,200,JSON.stringify(selectedPrayers));
 assert.equal(selectedPrayers.data.days[0].source,"FOREIGN_SYNTHETIC_PUBLISHED_PRAYER");
 assert.equal(selectedPrayers.data.jummah[0].iqamahAt,"13:25");
 const draftPrayers=await call("organizations/view?resource=prayers&venueId="+foreignVenue.id+
  "&date=2032-11-06","GET",undefined,first);
 assert.equal(draftPrayers.status,200);
 assert.deepEqual(draftPrayers.data.days,[],"unpublished times never appear in calendar");
 const selectedFaith=await call("organizations/view?resource=faith","GET",undefined,first);
 assert.equal(selectedFaith.status,200);
 assert.equal(selectedFaith.data.organization.id,foreign.id);
 assert.ok(selectedFaith.data.notices.some(n=>n.id===foreignFaith.id));
 assert.equal((await call("organizations/view?resource=home&venueId="+homeVenue.id,
  "GET",undefined,first)).status,404);
 assert.equal((await call("organizations/view?resource=prayers&venueId="+homeVenue.id,
  "GET",undefined,first)).status,404);
 assert.equal((await call("organizations/view?resource=home&organizationId="+home.id,
  "GET",undefined,first)).status,422,"forged tenant query must never be accepted");
 assert.equal((await call("organizations/view?resource=home&resource=faith",
  "GET",undefined,first)).status,422,"ambiguous resource query fails closed");
 assert.equal((await call("organizations/view?resource=prayers&date=2032-02-30",
  "GET",undefined,first)).status,422,"invalid civil dates rejected");
 const untouchedDevice=await call("organizations/view?resource=venues","GET",undefined,second);
 assert.equal(untouchedDevice.data.organization.id,home.id);
 assert.ok(!untouchedDevice.data.venues.some(v=>v.id===foreignVenue.id));

 assert.equal((await call("organizations/context","GET",undefined,first)).data.selectedOrganizationId,foreign.id);
 const dbSession=await db.authSession.findUniqueOrThrow({where:{
  tokenHash:createHash("sha256").update(first).digest("hex")
 }});
 assert.equal(dbSession.selectedOrganizationId,foreign.id);
 assert.equal((await call("organizations/context","GET",undefined,second)).data.selectedOrganizationId,home.id,
  "second device/session must NOT switch when first device changes mosque");
 const foreignCatalog=await call("events/catalog?organizationId="+home.id,"GET",undefined,first);
 assert.equal(foreignCatalog.status,422,"client-provided mosque filter is forbidden");
 const selectedCatalog=await call("events/catalog","GET",undefined,first,{"x-organization-id":home.id});
 assert.equal(selectedCatalog.status,200,JSON.stringify(selectedCatalog));
 assert.equal(selectedCatalog.data.organization.id,foreign.id,"server session chooses mosque");
 assert.ok(selectedCatalog.data.items.some(x=>x.id===event.id));
 assert.ok(!selectedCatalog.data.items.some(x=>x.id===homeEvent.id||x.id===foreignDraft.id));
 assert.ok(!JSON.stringify(selectedCatalog).includes("FOREIGN_SYNTHETIC_UNPUBLISHED_EVENT"));
 const byTitle=await call("events/catalog?q="+encodeURIComponent("foreign_synthetic"),"GET",undefined,first);
 assert.equal(byTitle.status,200);
 assert.deepEqual(byTitle.data.items.map(x=>x.id),[event.id],
  "case-insensitive text search returns only published selected-mosque gathering");
 const byPlace=await call("events/catalog?q="+encodeURIComponent("synthetic community"),"GET",undefined,first);
 assert.equal(byPlace.status,200);
 assert.deepEqual(byPlace.data.items.map(x=>x.id),[event.id],
  "displayed location is searchable without leaking another mosque");
 const noMatch=await call("events/catalog?q="+encodeURIComponent("HOME_SYNTHETIC"),"GET",undefined,first);
 assert.equal(noMatch.status,200);
 assert.deepEqual(noMatch.data.items,[],"home-only event is never a selected-foreign search hit");
 for(const badQuery of [
  "q=x","q=%20%20%20","q="+encodeURIComponent("a".repeat(81)),
  "q=valid&q=valid","q=valid&eventId="+event.id
 ]){
  const response=await call("events/catalog?"+badQuery,"GET",undefined,first);
  assert.equal(response.status,422,"invalid or ambiguous search input is denied: "+badQuery);
 }
 const selectedExact=await call("events/catalog?eventId="+event.id,"GET",undefined,first);
 assert.equal(selectedExact.status,200);
 assert.equal(selectedExact.data.items.length,1);
 assert.equal(selectedExact.data.items[0].id,event.id);
 assert.equal((await call("events/catalog?eventId="+foreignDraft.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?eventId="+homeEvent.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?eventId=missing-synthetic-event","GET",undefined,first)).status,404);
 assert.equal((await call("events/catalog?eventId=bad","GET",undefined,first)).status,422);
 const stillHomeCatalog=await call("events/catalog","GET",undefined,second);
 assert.equal(stillHomeCatalog.data.organization.id,home.id);
 assert.ok(!stillHomeCatalog.data.items.some(x=>x.id===event.id));
 const switched=await call("me","GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(switched.status,200,JSON.stringify(switched));
 assert.equal(switched.data.organization.id,foreign.id,
  "selected server session, not spoofed home mosque header, owns the query");
 assert.ok(switched.data.notifications.some(n=>n.id===foreignNote.id));
 assert.ok(switched.data.donations.some(d=>d.campaign.title==="FOREIGN_SYNTHETIC_FUND"));
 assert.ok(switched.data.rsvps.some(r=>r.event.title==="FOREIGN_SYNTHETIC_PRIVATE_RSVP"));
 assert.ok(switched.data.upcoming.some(x=>x.kind==="gathering"&&x.eventId===event.id&&x.status==="confirmed"));
 assert.ok(switched.data.upcoming.some(x=>x.kind==="service_shift"&&x.id===shifts.FOREIGN.id&&x.status==="scheduled"));
 assert.ok(!switched.data.upcoming.some(x=>x.id===shifts.HOME.id));
 assert.ok(switched.data.upcoming.every((x,i,a)=>i===0||
  new Date(a[i-1].startAt).getTime()<=new Date(x.startAt).getTime()),
  "commitments are ordered by actual start instant");
 assert.equal(switched.data.upcoming.length,2,"future RSVP and shift, not unrelated work, are returned");
 assert.ok(!JSON.stringify(switched.data).includes("HOME_PRIVATE_CONTEXT_ONLY"));
 assert.ok(!JSON.stringify(switched.data).includes("HOME_SYNTHETIC_FUND"));
 assert.ok(!JSON.stringify(switched.data).includes("LEGACY_UNOWNED_NEVER_PRESENT"));
 const otherDevice=await call("me","GET",undefined,second);
 assert.equal(otherDevice.data.organization.id,home.id);
 // F-009 selected-mosque RSVP lifecycle: server-held session context and
 // active membership must drive every read and write, never client IDs.
 const foreignRegistration=await call("events/registration?eventId="+event.id,"GET",undefined,first,
  {"x-organization-id":home.id});
 assert.equal(foreignRegistration.status,200,JSON.stringify(foreignRegistration));
 assert.equal(foreignRegistration.data.registration?.status,"confirmed");
 assert.equal((await call("events/registration?eventId="+homeEvent.id,"GET",undefined,first)).status,404);
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,second)).status,404);
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:homeEvent.id},first)).status,404);
 assert.equal((await call("events/rsvp","DELETE",{eventId:homeEvent.id},first)).status,404);
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:event.id},second)).status,404);
 assert.equal((await call("events/rsvp","DELETE",{eventId:event.id},second)).status,404);
 assert.equal((await call("actions","POST",{kind:"volunteer",opportunityId:"synthetic-unknown"},first)).status,409,
  "unmigrated action kinds remain pilot-only");
 assert.equal((await call("actions","POST",{kind:"rsvp",eventId:event.id},first,
  {origin:"https://malicious.example.test"})).status,403);
 assert.equal((await call("events/rsvp","DELETE",{eventId:event.id},first,
  {origin:"https://malicious.example.test"})).status,403);
 const repeat=await call("actions","POST",{kind:"rsvp",eventId:event.id},first);
 assert.equal(repeat.status,201,JSON.stringify(repeat));
 assert.equal(repeat.data.alreadyJoined,true);
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,1);
 const leaveForeign=await call("events/rsvp","DELETE",{eventId:event.id},first);
 assert.equal(leaveForeign.status,200,JSON.stringify(leaveForeign));
 assert.equal(leaveForeign.data.cancelled,true);
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,0);
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,first)).data.registration,null);
 assert.equal((await call("events/rsvp","DELETE",{eventId:event.id},first)).data.alreadyCancelled,true);
 const rejoin=await call("actions","POST",{kind:"rsvp",eventId:event.id},first);
 assert.equal(rejoin.status,201,JSON.stringify(rejoin));
 assert.equal(rejoin.data.status,"confirmed");
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,1);
 assert.equal((await call("events/registration?eventId="+event.id,"GET",undefined,first)).data.registration?.status,"confirmed");
 assert.ok(otherDevice.data.notifications.some(n=>n.id===homeNote.id));
 assert.ok(!JSON.stringify(otherDevice.data).includes("FOREIGN_PRIVATE_CONTEXT_ONLY"));
 assert.equal((await call("notifications/"+homeNote.id,"PATCH",undefined,first)).status,404,
  "known home notification ID cannot be marked read while foreign context selected");
 assert.equal((await call("notifications/"+unknownNote.id,"PATCH",undefined,first)).status,404);
 assert.equal((await call("notifications/"+foreignNote.id,"PATCH",undefined,second)).status,404);
 assert.equal((await call("notifications/"+foreignNote.id,"PATCH",undefined,first)).status,200);
 assert.ok((await db.notification.findUniqueOrThrow({where:{id:foreignNote.id}})).readAt);
 assert.equal((await db.notification.findUniqueOrThrow({where:{id:homeNote.id}})).readAt,null);
 // A shared account still has its own profile, but its private deletion
 // status must be scoped to the currently selected membership.
 const accountForeign=await call("account","GET",undefined,first);
 assert.equal(accountForeign.status,200);
 const scopedDeletion=await db.deletionRequest.create({data:{
  userId:member.id,organizationId:home.id
 }});
 try{
  const privateAccount=await call("account","GET",undefined,first);
  assert.equal(privateAccount.status,200);
  assert.equal(privateAccount.data.deletion,null,
   "home privacy request must not be shown inside foreign mosque context");
  const ownAccount=await call("account","GET",undefined,second);
  assert.equal(ownAccount.status,200);
  assert.equal(ownAccount.data.deletion?.id,scopedDeletion.id);
 }finally{await db.deletionRequest.delete({where:{id:scopedDeletion.id}});}
 // Staff onboarding also uses requireActor (to allow invitation preview
 // before email verification), so it must explicitly reject foreign
 // selected sessions rather than silently use home organization authority.
 const invitationToken=randomBytes(32).toString("hex");
 const invitation=await db.staffInvitation.create({data:{
  organizationId:home.id,invitedEmail:member.email,
  tokenHash:createHash("sha256").update(invitationToken).digest("hex"),
  capabilities:["community_moderate"],issuedById:admin.id,
  expiresAt:new Date(Date.now()+3600000)
 }});
 fixture.invitations.push(invitation.id);
 const blockedInvitation=await call("invitations","POST",{
  action:"preview",token:invitationToken
 },first);
 assert.equal(blockedInvitation.status,409,
  "a member in foreign selected context cannot preview or accept home-mosque staff authority");
 assert.equal(blockedInvitation.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 const homeInvitation=await call("invitations","POST",{
  action:"preview",token:invitationToken
 },second);
 assert.equal(homeInvitation.status,200,
  "original pilot session retains its independently authorized onboarding context");
 const unrelatedRoutes=["students","invoices","shifts","circles/mine"];
 for(const path of unrelatedRoutes){
  const result=await call(path,"GET",undefined,first);
  assert.equal(result.status,409,
   "unmigrated "+path+" must reject foreign tenant context instead of using home records");
  assert.equal(result.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 }
 const blockedPrivacy=await call("account/deletion-request","POST",{confirm:true},first);
 assert.equal(blockedPrivacy.status,409,
  "unmigrated privacy request submission cannot silently target home mosque");
 assert.equal(blockedPrivacy.error.code,"TENANT_CONTEXT_UNSUPPORTED");
 const prefHome=await call("me/preferences","GET",undefined,second);
 assert.equal(prefHome.status,200);
 assert.equal(prefHome.data.organization.id,home.id);
 const foreignPrefs=await call("me/preferences","GET",undefined,first);
 assert.equal(foreignPrefs.status,200);
 assert.equal(foreignPrefs.data.organization.id,foreign.id);
 assert.equal(foreignPrefs.data.organization.timeZone,"America/Chicago");
 assert.ok(foreignPrefs.data.optional.every(v=>!v.enabled));
 const updated=await call("me/preferences","PATCH",{
  purpose:"event_updates",enabled:true,quietStartHour:21,quietEndHour:6
 },first);
 assert.equal(updated.status,200,JSON.stringify(updated));
 assert.equal(updated.data.organizationId,foreign.id);
 const saved=await db.organizationDeliveryPreference.findUniqueOrThrow({where:{
  organizationId_userId_purpose_channel:{
   organizationId:foreign.id,userId:member.id,purpose:"event_updates",channel:"email"
  }
 }});
 fixture.prefs.push(saved.id);
 assert.equal(saved.quietStartHour,21);
 assert.equal(saved.quietEndHour,6);
 assert.ok(saved.consentedAt);
 const homeAfter=await call("me/preferences","GET",undefined,second);
 assert.equal(homeAfter.status,200);
 assert.deepEqual(homeAfter.data.optional,prefHome.data.optional,
  "second mosque opt-in cannot alter default mosque consent");
 assert.equal((await call("me/preferences","GET",undefined,first)).data.optional
  .find(x=>x.purpose==="event_updates").enabled,true);
 const adminToken=randomBytes(32).toString("base64url");
 tokens.push(adminToken);
 await db.authSession.create({data:{
  userId:admin.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
  mfaVerifiedAt:new Date(),expiresAt:new Date(Date.now()+3600000)
 }});
 const adminForeign=await call("organizations/context","POST",{organizationId:foreign.id},adminToken);
 assert.equal(adminForeign.status,403,"global administrator role cannot move to another mosque");
 assert.equal(adminForeign.error.code,"TENANT_ROLE_ISOLATION");
 assert.equal((await call("organizations/context","GET",undefined,adminToken)).data.selectedOrganizationId,home.id);
 assert.equal((await call("admin","GET",undefined,adminToken)).status,200);
 await db.organizationMembership.update({where:{id:foreignMembership.id},data:{status:"suspended"}});
 const revoked=await call("me","GET",undefined,first);
 assert.equal(revoked.status,403,"foreign context must recheck active membership every call");
 assert.equal(revoked.error.code,"MEMBERSHIP_REQUIRED");
 const blockedCatalog=await call("events/catalog","GET",undefined,first);
 assert.equal(blockedCatalog.status,403,"suspended membership cannot browse selected catalog");
 const deniedDiscovery=await call("organizations/search?q=FOREIGN&kind=all","GET",undefined,first);
 assert.equal(deniedDiscovery.status,403,"revoked selected membership cannot use search");
 for(const resource of ["venues","home","prayers","faith","announcements","articles","financials"]){
  const blockedView=await call("organizations/view?resource="+resource,"GET",undefined,first);
  assert.equal(blockedView.status,403,"revoked foreign membership blocks "+resource);
  assert.equal(blockedView.error.code,"MEMBERSHIP_REQUIRED");
 }
 assert.equal(blockedCatalog.error.code,"MEMBERSHIP_REQUIRED");
 assert.equal((await call("notifications/"+foreignNote.id,"PATCH",undefined,first)).status,403);
 for(const operation of [
  call("events/registration?eventId="+event.id,"GET",undefined,first),
  call("actions","POST",{kind:"rsvp",eventId:event.id},first),
  call("events/rsvp","DELETE",{eventId:event.id},first)
 ]){
  const response=await operation;
  assert.equal(response.status,403,"revoked selected membership blocks RSVP operations immediately");
  assert.equal(response.error.code,"MEMBERSHIP_REQUIRED");
 }
 assert.equal((await db.event.findUniqueOrThrow({where:{id:event.id}})).rsvpCount,1);
 const contextRevoked=await call("organizations/context","GET",undefined,first);
 assert.equal(contextRevoked.status,200,"account must be able to recover by switching home");
 assert.equal(contextRevoked.data.selectedActive,false);
 assert.ok(!contextRevoked.data.organizations.some(o=>o.id===foreign.id));
 assert.equal((await call("organizations/context","POST",{organizationId:foreign.id},first)).status,404);
 const back=await call("organizations/context","POST",{organizationId:home.id},first);
 assert.equal(back.status,200);
 assert.equal(back.data.limited,false);
 const homeAgain=await call("me","GET",undefined,first);
 assert.equal(homeAgain.data.organization.id,home.id);
 assert.equal((await call("organizations/view?resource=venues","GET",undefined,first))
  .data.organization.id,home.id);
 assert.ok(homeAgain.data.upcoming.some(x=>x.id===shifts.HOME.id));
 assert.ok(!homeAgain.data.upcoming.some(x=>x.id===shifts.FOREIGN.id));
 assert.equal((await call("students","GET",undefined,first)).status,200,
  "original API pilot routes re-enable only after safe return to primary mosque");
 const entries=await db.auditEvent.findMany({where:{
  actorId:member.id,action:"membership.context.select",occurredAt:{gte:createdAt}
 }});
 assert.equal(entries.length,2,"each successful switch records a scoped audit");
 assert.deepEqual(entries.map(e=>e.entityId),[foreign.id,home.id]);
 console.log("Verified per-session mosque selection, tenant-owned published worship, venue/faith isolation, private dashboard, inbox/read, consent, active membership revocation, unsafe-workflow denial and privileged role isolation.");
}finally{
 if(foreignMembershipId)await db.organizationMembership.updateMany({where:{id:foreignMembershipId},
  data:{status:"active"}});
 if(tokens.length)await db.authSession.deleteMany({where:{
  tokenHash:{in:tokens.map(x=>createHash("sha256").update(x).digest("hex"))}
 }});
 await db.auditEvent.deleteMany({where:{
  action:"membership.context.select",actorId:(await db.user.findUnique({where:{email:memberEmail}}))?.id||"",
  occurredAt:{gte:createdAt}
 }});
 if(fixture.invitations.length)await db.staffInvitation.deleteMany({where:{id:{in:fixture.invitations}}});
 if(fixture.prefs.length)await db.organizationDeliveryPreference.deleteMany({where:{id:{in:fixture.prefs}}});
 if(fixture.shifts.length)await db.volunteerShift.deleteMany({where:{id:{in:fixture.shifts}}});
 if(fixture.volunteerApplications.length)await db.volunteerApplication.deleteMany({where:{id:{in:fixture.volunteerApplications}}});
 if(fixture.opportunities.length)await db.volunteerOpportunity.deleteMany({where:{id:{in:fixture.opportunities}}});
 if(fixture.budgets.length)await db.financeBudget.deleteMany({where:{id:{in:fixture.budgets}}});
 if(fixture.articles.length)await db.communityArticle.deleteMany({where:{id:{in:fixture.articles}}});
 if(fixture.faithNotices.length)await db.faithNotice.deleteMany({where:{id:{in:fixture.faithNotices}}});
 if(fixture.announcements.length)await db.announcement.deleteMany({where:{id:{in:fixture.announcements}}});
 if(fixture.jummah.length)await db.jummahSession.deleteMany({where:{id:{in:fixture.jummah}}});
 if(fixture.prayerDays.length)await db.prayerDay.deleteMany({where:{id:{in:fixture.prayerDays}}});
 if(fixture.venues.length)await db.venue.deleteMany({where:{id:{in:fixture.venues}}});
 if(fixture.events.length){
  await db.eventRSVP.deleteMany({where:{eventId:{in:fixture.events}}});
  await db.event.deleteMany({where:{id:{in:fixture.events}}});
 }
 if(fixture.donations.length)await db.donation.deleteMany({where:{id:{in:fixture.donations}}});
 if(fixture.campaigns.length)await db.donationCampaign.deleteMany({where:{id:{in:fixture.campaigns}}});
 if(fixture.notes.length){
  await db.outboxEvent.deleteMany({where:{notificationId:{in:fixture.notes}}});
  await db.notification.deleteMany({where:{id:{in:fixture.notes}}});
 }
 if(adminMembershipId)await db.organizationMembership.deleteMany({where:{id:adminMembershipId}});
 if(foreignMembershipId)await db.organizationMembership.deleteMany({where:{id:foreignMembershipId}});
 if(foreignOrgId)await db.organization.deleteMany({where:{id:foreignOrgId}});
 await db.$disconnect();
}

import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
if(process.env.NODE_ENV==="production"||!process.env.DATABASE_URL?.includes("masjid_ci"))throw Error("Refusing production public smoke.");
const api="http://127.0.0.1:3000/api/v1/";
async function get(path){const res=await fetch(api+path);return {status:res.status,data:await res.json()};}
const programs=await get("public/search?q=Reading&kind=programs");
assert.equal(programs.status,200);
assert.ok(programs.data.data.items.some(x=>x.kind==="programs"&&x.title==="Reading Skills"));
const secret=await get("public/search?q=Unpublished");
assert.equal(secret.status,200);
assert.ok(!secret.data.data.items.some(x=>x.title==="Unpublished fixture"),"draft dates never appear in search");
const malformed=await get("public/search?q="+encodeURIComponent("<private>"));
assert.equal(malformed.status,422);
const faith=await get("public/faith");
assert.equal(faith.status,200);
assert.ok(faith.data.data.notices.some(x=>x.title==="Integration fixture notice"));
assert.ok(!faith.data.data.notices.some(x=>x.title==="Unpublished fixture"));
const privateAdmin=await get("admin/worship");
assert.equal(privateAdmin.status,401);
const prayer=await get("public/prayers?date=2026-10-26");
assert.equal(prayer.status,200);
assert.deepEqual(prayer.data.data.days,[],"unpublished adhan times are not public");
const impossibleDate=await get("public/prayers?date=2026-02-30");
assert.equal(impossibleDate.status,422,"invalid civil dates are rejected");
console.log("Verified published-only search, date-confirmed faith notices, admin denial and unpublished worship privacy.");


// Server-rendered public website: guest access, published content only, and venue-scoped times.
const {PrismaClient}=await import("@prisma/client");
const db=new PrismaClient();
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org,"CI must provision a mosque before guest web tests");
 const unapproved=await db.faithNotice.create({data:{
  organizationId:org.id,kind:"other",localDate:"2032-11-06",title:"Unapproved public candidate",
  body:"This announcement was deliberately not reviewed by an eligible mosque approver.",
  status:"published",approvedById:null,publishedAt:new Date()
 }});
 try{
  const feed=await get("public/faith");
  assert.equal(feed.status,200);
  assert.ok(!feed.data.data.notices.some(n=>n.id===unapproved.id),
   "a published flag without named mosque approval is not sufficient for the public faith feed");
  const detail=await fetch("http://127.0.0.1:3000/visit/content/faith/"+unapproved.id);
  assert.equal(detail.status,404,"unapproved notices have no public canonical detail page");
 }finally{
  await db.faithNotice.delete({where:{id:unapproved.id}});
 }

 const initial=await fetch("http://127.0.0.1:3000/visit");
 assert.equal(initial.status,200,"public web page must work without login");
 const initialHtml=await initial.text();
 assert.match(initialHtml,/Prayer times/);
 assert.match(initialHtml,/Example gathering/,"published gathering is discoverable without login");
 assert.doesNotMatch(initialHtml,/Unpublished fixture/,"draft mosque notices must remain private");
 assert.doesNotMatch(initialHtml,/password.*required/i,"guest should not encounter an authentication wall");
 const publishedEvent=await db.event.findFirst({where:{organizationId:org.id,status:"published",title:"Example gathering"}});
 assert.ok(publishedEvent);
 const eventPage=await fetch("http://127.0.0.1:3000/visit/content/gatherings/"+publishedEvent.id);
 assert.equal(eventPage.status,200,"published event has a guest-accessible canonical URL");
 assert.match(await eventPage.text(),/Example gathering/);
 const draftFaith=await db.faithNotice.findFirst({where:{organizationId:org.id,status:"draft",title:"Unpublished fixture"}});
 assert.ok(draftFaith);
 const privatePage=await fetch("http://127.0.0.1:3000/visit/content/faith/"+draftFaith.id);
 assert.equal(privatePage.status,404,"guessed ID must not expose unpublished faith notices");

 const marker="CI SECOND VENUE";
 const other=await db.venue.create({data:{organizationId:org.id,name:marker,timeZone:"America/New_York"}});
 let filteredEventId=null;
 const pagingIds=[];
 try{
  const todayParts=new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"America/New_York"}).formatToParts(new Date());
  const field=(type)=>todayParts.find(x=>x.type===type)?.value||"";
  const today=field("year")+"-"+field("month")+"-"+field("day");
  await db.prayerDay.create({data:{venueId:other.id,localDate:today,published:true,
   fajr:"04:17",sunrise:"06:21",dhuhr:"12:44",asr:"15:37",maghrib:"18:20",isha:"19:39",source:"CI source"}});
  const filtered=await db.event.create({data:{
   organizationId:org.id,title:"CI_WEB_FILTERED_GATHERING",
   description:"A synthetic public filtered community workshop.",
   location:"CI SECOND VENUE",
   status:"published",startAt:new Date(Date.now()+86400000*7),
   endAt:new Date(Date.now()+86400000*7+3600000),
   venueId:other.id,category:"workshop",audience:"families",
   accessibilityFeatures:["step_free"],accessibilityNotes:"Synthetic step-free access only."
  }});
  filteredEventId=filtered.id;
  const filterUrl="http://127.0.0.1:3000/visit";
  const good=await fetch(filterUrl+"?gatherVenue="+encodeURIComponent(other.id)+
   "&category=workshop&audience=families&accessibility=step_free");
  assert.equal(good.status,200);
  const goodHtml=await good.text();
  assert.match(goodHtml,/CI_WEB_FILTERED_GATHERING/);
  assert.match(goodHtml,/Confirmed accommodations:/);
  assert.match(goodHtml,/Verified venue:/);
  const noMatch=await fetch(filterUrl+"?category=lecture&audience=families");
  assert.equal(noMatch.status,200);
  assert.doesNotMatch(await noMatch.text(),/CI_WEB_FILTERED_GATHERING/);
  const wrongTenant=await fetch(filterUrl+"?gatherVenue=foreign-venue-id&category=workshop");
  assert.equal(wrongTenant.status,200);
  const invalidFilterPage=await wrongTenant.text();
  assert.match(invalidFilterPage,/filter was invalid or does not belong to this mosque/);
  assert.doesNotMatch(invalidFilterPage,/CI_WEB_FILTERED_GATHERING/);
  const filteredQuery=await fetch(filterUrl+"?gatherQ=CI_WEB_FILTERED_GATHERING");
  assert.match(await filteredQuery.text(),/CI_WEB_FILTERED_GATHERING/);
  const parts=new Intl.DateTimeFormat("en-US",{
   timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(filtered.startAt);
  const datePart=(type)=>parts.find(x=>x.type===type)?.value||"";
  const gatheringDay=datePart("year")+"-"+datePart("month")+"-"+datePart("day");
  const matchingDate=await fetch(filterUrl+"?fromDay="+gatheringDay+"&toDay="+gatheringDay+
   "&gatherVenue="+encodeURIComponent(other.id));
  assert.equal(matchingDate.status,200);
  assert.match(await matchingDate.text(),/CI_WEB_FILTERED_GATHERING/,
   "venue-local inclusive civil day contains the real gathering instant");
  const outOfDate=await fetch(filterUrl+"?fromDay=2026-01-01&toDay=2026-01-01");
  assert.equal(outOfDate.status,200);
  assert.doesNotMatch(await outOfDate.text(),/CI_WEB_FILTERED_GATHERING/);
  const impossibleDay=await fetch(filterUrl+"?fromDay=2032-02-30");
  assert.equal(impossibleDay.status,200);
  assert.match(await impossibleDay.text(),/filter was invalid or does not belong to this mosque/);
  const duplicate=await fetch(filterUrl+"?category=workshop&category=lecture");
  assert.match(await duplicate.text(),/filter was invalid or does not belong to this mosque/);

  // Real guest server-rendered pagination: 28 equal-start gatherings must
  // appear on 25/3 separate pages without duplication or tenant changes.
  const staged=Array.from({length:28},(_,i)=>({
   id:randomUUID(),organizationId:org.id,venueId:other.id,
   title:"CI_WEB_PAGED_GATHERING "+String(i).padStart(3,"0"),
   description:"Synthetic paged public visitor gathering.",
   location:"CI SECOND VENUE",status:"published",category:"other",
   startAt:new Date("2032-12-07T15:00:00.000Z"),
   endAt:new Date("2032-12-07T16:00:00.000Z")
  }));
  pagingIds.push(...staged.map(x=>x.id));
  await db.event.createMany({data:staged});
  const pBase=filterUrl+"?gatherQ=CI_WEB_PAGED_GATHERING&category=other"+
   "&gatherVenue="+encodeURIComponent(other.id);
  const firstPage=await fetch(pBase);
  assert.equal(firstPage.status,200);
  const firstHtml=await firstPage.text();
  const seenFirst=staged.filter(x=>firstHtml.includes(x.title)).map(x=>x.id);
  assert.equal(seenFirst.length,25,"visitor listing shows a bounded first page");
  assert.match(firstHtml,/Next 25 published gatherings/);
  const href=firstHtml.match(/href="([^"]*gatherCursor=[^"]*)"/)?.[1];
  assert.ok(href,"server-rendered next page link must preserve the opaque cursor");
  const pageUrl=new URL(href.replaceAll("&amp;","&"),filterUrl);
  assert.equal(pageUrl.searchParams.get("gatherQ"),"CI_WEB_PAGED_GATHERING");
  assert.equal(pageUrl.searchParams.get("category"),"other");
  assert.equal(pageUrl.searchParams.get("gatherVenue"),other.id);
  const secondPage=await fetch(pageUrl);
  assert.equal(secondPage.status,200);
  const secondHtml=await secondPage.text();
  const seenSecond=staged.filter(x=>secondHtml.includes(x.title)).map(x=>x.id);
  assert.equal(seenSecond.length,3,"remaining gatherings display on final page");
  assert.equal(new Set([...seenFirst,...seenSecond]).size,28);
  assert.doesNotMatch(secondHtml,/Next 25 published gatherings/);
  assert.match(secondHtml,/Restart the filtered gathering list/);
  const staleCursor=await fetch(pBase+"&gatherCursor="+encodeURIComponent(filtered.id));
  assert.equal(staleCursor.status,200);
  const staleHtml=await staleCursor.text();
  assert.match(staleHtml,/filter was invalid or does not belong to this mosque/);
  assert.doesNotMatch(staleHtml,/CI_WEB_PAGED_GATHERING 0[0-9][0-9]/);
  const malformedCursor=await fetch(pBase+"&gatherCursor=short");
  assert.equal(malformedCursor.status,200);
  assert.match(await malformedCursor.text(),/filter was invalid or does not belong to this mosque/);
  const duplicateCursor=await fetch(pBase+"&gatherCursor="+staged[0].id+
   "&gatherCursor="+staged[1].id);
  assert.equal(duplicateCursor.status,200);
  assert.match(await duplicateCursor.text(),/filter was invalid or does not belong to this mosque/);
  const available=await get("public/venues");
  assert.equal(available.status,200);
  assert.ok(available.data.data.venues.some(v=>v.id===other.id));
  const scoped=await get("public/home?venueId="+encodeURIComponent(other.id));
  assert.equal(scoped.status,200);
  assert.equal(scoped.data.data.venue.id,other.id);
  assert.equal(scoped.data.data.prayer.fajr,"04:17");
  const invalid=await get("public/home?venueId=unknown");
  assert.equal(invalid.status,404);
  const selected=await fetch("http://127.0.0.1:3000/visit?venue="+encodeURIComponent(other.id));
  assert.equal(selected.status,200);
  const selectedHtml=await selected.text();
  assert.match(selectedHtml,/CI SECOND VENUE/);
  assert.match(selectedHtml,/04:17/,"selected mosque-local published prayer must render");
  const unknown=await fetch("http://127.0.0.1:3000/visit?venue=outside-this-mosque");
  assert.equal(unknown.status,200);
  const unknownHtml=await unknown.text();
  assert.doesNotMatch(unknownHtml,/04:17/,"unrecognized venue IDs cannot select another venue");
 }finally{
  if(pagingIds.length)await db.event.deleteMany({where:{id:{in:pagingIds}}});
  if(filteredEventId)await db.event.deleteMany({where:{id:filteredEventId}});
  await db.prayerDay.deleteMany({where:{venueId:other.id}});
  await db.venue.delete({where:{id:other.id}});
 }
 console.log("Verified public guest website, draft filtering, scoped venue switching and no fabricated times.");
}finally{await db.$disconnect();}

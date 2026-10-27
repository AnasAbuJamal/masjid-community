import assert from "node:assert/strict";
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
console.log("Verified published-only search, date-confirmed faith notices, admin denial and unpublished worship privacy.");


// Server-rendered public website: guest access, published content only, and venue-scoped times.
const {PrismaClient}=await import("@prisma/client");
const db=new PrismaClient();
try{
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org,"CI must provision a mosque before guest web tests");
 const initial=await fetch("http://127.0.0.1:3000/visit");
 assert.equal(initial.status,200,"public web page must work without login");
 const initialHtml=await initial.text();
 assert.match(initialHtml,/Prayer times/);
 assert.match(initialHtml,/Example gathering/,"published gathering is discoverable without login");
 assert.doesNotMatch(initialHtml,/Unpublished fixture/,"draft mosque notices must remain private");
 assert.doesNotMatch(initialHtml,/password.*required/i,"guest should not encounter an authentication wall");
 const marker="CI SECOND VENUE";
 const other=await db.venue.create({data:{organizationId:org.id,name:marker,timeZone:"America/New_York"}});
 try{
  const todayParts=new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"America/New_York"}).formatToParts(new Date());
  const field=(type)=>todayParts.find(x=>x.type===type)?.value||"";
  const today=field("year")+"-"+field("month")+"-"+field("day");
  await db.prayerDay.create({data:{venueId:other.id,localDate:today,published:true,
   fajr:"04:17",sunrise:"06:21",dhuhr:"12:44",asr:"15:37",maghrib:"18:20",isha:"19:39",source:"CI source"}});
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
  await db.prayerDay.deleteMany({where:{venueId:other.id}});
  await db.venue.delete({where:{id:other.id}});
 }
 console.log("Verified public guest website, draft filtering, scoped venue switching and no fabricated times.");
}finally{await db.$disconnect();}

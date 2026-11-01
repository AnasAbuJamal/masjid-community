import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";

// This test creates ONLY disposable CI fixtures. Never touch the connected
// production Neon project, any staging instance or real member records.
if(process.env.NODE_ENV==="production" ||
 !process.env.DATABASE_URL?.includes("/masjid_ci")) {
 throw Error("Refusing tenant-safe gathering time smoke outside disposable CI.");
}

const db=new PrismaClient();
const id=randomUUID().replaceAll("-","");
const origin="http://127.0.0.1:3000/api/v1/public/home";
let homeVenue=null,foreignOrg=null,foreignVenue=null;
const eventIds=[];
try {
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
 assert.ok(org,"CI requires its synthetic primary mosque");
 homeVenue=await db.venue.create({data:{
  organizationId:org.id,name:"CI Gathering Time Venue",timeZone:"Pacific/Honolulu"
 }});
 foreignOrg=await db.organization.create({data:{
  slug:"ci-home-event-"+id,name:"Unrelated synthetic mosque"
 }});
 foreignVenue=await db.venue.create({data:{
  organizationId:foreignOrg.id,name:"Foreign timezone (must not be shared)",
  timeZone:"Asia/Tokyo"
 }});

 // A published gathering may have a venue unrelated to the user's selected
 // prayer venue. The event's own verified venue must determine event time.
 const now=Date.now();
 const own=await db.event.create({data:{
  organizationId:org.id,venueId:homeVenue.id,
  title:"CI VERIFIED EVENT TIME "+id,description:"Synthetic venue time",
  location:"One mosque venue",status:"published",
  startAt:new Date(now+10*60_000),endAt:new Date(now+70*60_000)
 }});
 eventIds.push(own.id);

 // Legacy schema can reference another tenant's venue; the public serializer
 // must drop those venue details rather than reveal its name/timezone.
 const foreign=await db.event.create({data:{
  organizationId:org.id,venueId:foreignVenue.id,
  title:"CI FOREIGN VENUE REDACTION "+id,description:"Synthetic isolation check",
  location:"Location not verified",status:"published",
  startAt:new Date(now+11*60_000),endAt:new Date(now+71*60_000)
 }});
 eventIds.push(foreign.id);

 const res=await fetch(origin,{cache:"no-store"});
 assert.equal(res.status,200);
 const body=await res.json();
 const events=body.data?.events;
 assert.ok(Array.isArray(events));
 const ownResult=events.find(e=>e.id===own.id);
 const foreignResult=events.find(e=>e.id===foreign.id);
 assert.ok(ownResult,"published event must appear in upcoming list");
 assert.deepEqual(ownResult.venue,{
  id:homeVenue.id,name:"CI Gathering Time Venue",timeZone:"Pacific/Honolulu"
 });
 assert.ok(foreignResult,"legacy foreign-venue event is still in public listing");
 assert.equal(foreignResult.venue,null,"foreign venue metadata must never leak");
 assert.ok(!JSON.stringify(events).includes(foreignVenue.name),
  "unrelated mosque identity must not enter the response");

 // Choosing a different prayer venue changes worship context, not a
 // published event's independently associated gathering venue.
 const selected=await fetch(origin+"?venueId="+encodeURIComponent(homeVenue.id));
 assert.equal(selected.status,200);
 const selectedData=(await selected.json()).data;
 assert.equal(selectedData.venue.id,homeVenue.id);
 assert.equal(selectedData.events.find(e=>e.id===own.id)?.venue?.timeZone,
  "Pacific/Honolulu");
 console.log("Verified guest upcoming gatherings use safe venue metadata.");
} finally {
 if(eventIds.length)await db.event.deleteMany({where:{id:{in:eventIds}}});
 if(homeVenue)await db.venue.deleteMany({where:{id:homeVenue.id}});
 if(foreignVenue)await db.venue.deleteMany({where:{id:foreignVenue.id}});
 if(foreignOrg)await db.organization.deleteMany({where:{id:foreignOrg.id}});
 await db.$disconnect();
}

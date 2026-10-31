import {test} from "node:test";
import assert from "node:assert/strict";
import {matchesKioskSnapshot,venueCivilDay} from "../staff-web/src/app/kiosk/kiosk-freshness.ts";

const snapshot={
 venueId:"venue-a",timeZone:"America/New_York",localDay:"2026-11-01",
 prayerRevision:3,prayerUpdatedAt:"2026-11-01T04:10:00.000Z",
 emergencyId:"urgent-1",emergencyRevision:2
};
const home={
 venue:{id:"venue-a"},
 prayer:{localDate:"2026-11-01",revision:3,updatedAt:"2026-11-01T04:10:00.000Z"},
 emergency:{id:"urgent-1",revision:2}
};

test("kiosk civil day is selected venue local time, including DST and year rollover",()=>{
 assert.equal(venueCivilDay(new Date("2026-11-01T03:59:59Z"),"America/New_York"),"2026-10-31");
 assert.equal(venueCivilDay(new Date("2026-11-01T04:00:00Z"),"America/New_York"),"2026-11-01");
 assert.equal(venueCivilDay(new Date("2026-03-08T04:59:59Z"),"America/New_York"),"2026-03-07");
 assert.equal(venueCivilDay(new Date("2026-03-08T05:00:00Z"),"America/New_York"),"2026-03-08");
 assert.equal(venueCivilDay(new Date("2027-01-01T01:30:00Z"),"America/Los_Angeles"),"2026-12-31");
 assert.equal(venueCivilDay(new Date("2026-10-31T23:30:00Z"),"Asia/Kolkata"),"2026-11-01");
});
test("published prayer and safety revision must exactly match the rendered kiosk",()=>{
 assert.equal(matchesKioskSnapshot(home,snapshot),true);
 for(const h of [
  {...home,venue:{id:"venue-b"}},
  {...home,prayer:{...home.prayer,localDate:"2026-10-31"}},
  {...home,prayer:{...home.prayer,revision:4}},
  {...home,prayer:{...home.prayer,updatedAt:"2026-11-01T04:20:00.000Z"}},
  {...home,prayer:null},
  {...home,emergency:{...home.emergency,revision:3}},
  {...home,emergency:{id:"urgent-other",revision:2}},
  {...home,emergency:null},
 ]){
  assert.equal(matchesKioskSnapshot(h,snapshot),false,
   "any changed venue, date, prayer or emergency invalidates the cached screen");
 }
});
test("a genuinely unpublished prayer is explicit, and unexpected publication fails closed",()=>{
 const missing={...snapshot,prayerRevision:null,prayerUpdatedAt:null,emergencyId:null,emergencyRevision:null};
 const empty={venue:{id:"venue-a"},prayer:null,emergency:null};
 assert.equal(matchesKioskSnapshot(empty,missing),true,"known empty schedule can display its missing-data explanation");
 assert.equal(matchesKioskSnapshot({...empty,prayer:home.prayer},missing),false);
 assert.equal(matchesKioskSnapshot({...empty,emergency:home.emergency},missing),false);
 assert.equal(matchesKioskSnapshot({venue:null,prayer:null,emergency:null},missing),false);
});

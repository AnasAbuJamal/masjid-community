import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 venueLocalCivilDay,shiftPublishedCivilDay,selectedVenuePrayerDay
} from "../masjid-mobile/src/prayer-calendar-date.ts";

test("venue today is based on published mosque timezone rather than UTC or phone timezone",()=>{
 const instant=new Date("2026-11-01T01:30:00.000Z");
 assert.equal(venueLocalCivilDay("America/New_York",instant),"2026-10-31");
 assert.equal(venueLocalCivilDay("Asia/Riyadh",instant),"2026-11-01");
 assert.equal(venueLocalCivilDay("Pacific/Honolulu",instant),"2026-10-31");
 assert.equal(venueLocalCivilDay("Invalid/Timezone",instant),null);
 assert.equal(venueLocalCivilDay(null,instant),null);
 assert.equal(venueLocalCivilDay("UTC",new Date("invalid")),null);
});

test("switching venues clears the previous selected civil day before any network call",()=>{
 const prior={venueId:"mosque-a",localDate:"2026-11-01"};
 assert.equal(selectedVenuePrayerDay(prior,"mosque-a"),"2026-11-01");
 assert.equal(selectedVenuePrayerDay(prior,"mosque-b"),null);
 assert.equal(selectedVenuePrayerDay(prior,null),null);
 assert.equal(selectedVenuePrayerDay({venueId:"mosque-a",localDate:"2026-02-30"},"mosque-a"),null);
 assert.equal(selectedVenuePrayerDay(null,"mosque-a"),null);
});

test("calendar navigation handles leap years, year boundaries, and DST as civil days",()=>{
 assert.equal(shiftPublishedCivilDay("2028-02-28",1),"2028-02-29");
 assert.equal(shiftPublishedCivilDay("2028-02-29",1),"2028-03-01");
 assert.equal(shiftPublishedCivilDay("2026-01-01",-1),"2025-12-31");
 assert.equal(shiftPublishedCivilDay("2026-03-08",1),"2026-03-09");
 assert.equal(shiftPublishedCivilDay("2026-11-01",-1),"2026-10-31");
 assert.equal(shiftPublishedCivilDay("0001-01-01",-1),null);
 assert.equal(shiftPublishedCivilDay("9999-12-31",1),null);
 for(const invalid of ["","2026-2-3","2026-02-30","2026-13-02","2026-11-31","tomorrow"]){
  assert.equal(shiftPublishedCivilDay(invalid,1),null,invalid);
 }
});

test("Calendar keeps the selected date tied to the correct venue and published response",()=>{
 const source=readFileSync("masjid-mobile/app/calendar.tsx","utf8");
 const locale=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(source,/selectedVenuePrayerDay\(selection,ready\?venue\?\.id:null\)/);
 assert.match(source,/venueLocalCivilDay\(venue\.timeZone\)/);
 assert.match(source,/React\.useEffect\(\(\)=>\{/);
 assert.match(source,/\[ready,venue\?\.id,venue\?\.timeZone\]/);
 assert.match(source,/date&&validToday&&ready&&venue/);
 assert.match(source,/encodeURIComponent\(date\)/);
 assert.match(source,/encodeURIComponent\(venue\.id\)/);
 assert.match(source,/result\.data\?\.venue\?\.id===venue\.id/);
 assert.match(source,/result\.data\?\.localDate===date/);
 assert.match(source,/publishedPrayerDayLabel\(date,language\)/);
 assert.match(source,/scheduleRevisionTime\(day\.updatedAt,venue\?\.timeZone,language\)/);
 assert.match(source,/flexDirection:isRTL\?"row-reverse":"row"/);
 assert.match(source,/t\("calendar\.source"\)/);
 assert.match(source,/t\("calendar\.invalidZone"\)/);
 assert.doesNotMatch(source,/return new Date\(\)\.toISOString\(\)\.slice\(0,10\)/,
  "invalid venue timezone must not default to UTC");
 assert.doesNotMatch(source,/>\{date\}<\/Text>/);
 for(const key of ["back","eyebrow","title","subtitle","previous","next","today","noVenue",
  "invalidZone","unavailableDate","source","iqamah","sunrise","updated","updateUnavailable"]){
  assert.match(locale,new RegExp('"calendar\\.'+key+'":\\{en:".+",ar:".+"\\}'),
   "English and Arabic calendar labels required for "+key);
 }
});

test("calendar revalidates withdrawn prayer publication when app resumes",()=>{
 const source=readFileSync("masjid-mobile/app/calendar.tsx","utf8");
 const shared=readFileSync("masjid-mobile/src/useVenueSafetyRefresh.ts","utf8");
 assert.ok(source.includes("useVenueSafetyRefresh(!!path,result.refresh)"));
 assert.ok(shared.includes('AppState.addEventListener("change"'));
 assert.ok(shared.includes('shouldRefreshVenueOnResume(previous,state)'));
});

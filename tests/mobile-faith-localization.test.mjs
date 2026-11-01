import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publishedPrayerDayLabel} from "../masjid-mobile/src/prayer-civil-day.ts";
import {scheduleRevisionTime} from "../masjid-mobile/src/schedule-revision-time.ts";

test("approved Ramadan/Eid civil dates stay fixed across user timezone changes",()=>{
 const date="2026-11-01";
 assert.match(publishedPrayerDayLabel(date,"en"),/November 1, 2026/);
 assert.match(publishedPrayerDayLabel(date,"ar"),/٢٠٢٦|2026/);
 assert.equal(publishedPrayerDayLabel("2026-02-30","ar"),null);
 const instant="2026-11-01T01:15:00.000Z";
 const newYork=scheduleRevisionTime(instant,"America/New_York","en");
 const riyadh=scheduleRevisionTime(instant,"Asia/Riyadh","en");
 assert.ok(newYork&&riyadh);
 assert.notEqual(newYork,riyadh,"publishedAt must use mosque rather than device timezone");
 assert.equal(scheduleRevisionTime(instant,"Unknown/Mosque","en"),null);
});

test("faith screen translates chrome but preserves published mosque title and policy",()=>{
 const page=readFileSync("masjid-mobile/app/faith.tsx","utf8");
 const locale=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 const member=readFileSync("staff-web/src/app/api/v1/organizations/view/route.ts","utf8");
 const guest=readFileSync("staff-web/src/app/api/v1/public/faith/route.ts","utf8");
 for(const key of ["back","eyebrow","title","subtitle","policy","confirmedPolicy",
  "kindRamadan","kindFitr","kindAdha","kindMoon","kindOther",
  "dateUnavailable","updated","updateUnavailable","revision"]){
  assert.match(locale,new RegExp('"faith\\.'+key+'":\\{en:".+",ar:".+"\\}'),
   "expected localized label "+key);
 }
 assert.match(page,/publishedPrayerDayLabel\(n\.localDate,language\)/);
 assert.match(page,/scheduleRevisionTime\(n\.publishedAt,/);
 assert.match(page,/result\.data\?\.organization\?\.timeZone,language/);
 assert.match(page,/t\("faith\.confirmedPolicy"\)/);
 assert.match(page,/\{result\.data\.policy\}/);
 assert.match(page,/\{n\.title\}/);
 assert.match(page,/\{n\.body\}/);
 assert.match(page,/textAlign:align/);
 assert.doesNotMatch(page,/n\.kind\.replaceAll/);
 assert.doesNotMatch(page,/new Date\(n\.publishedAt\)\.toLocaleDateString\(\)/);
 for(const api of [member,guest]){
  assert.match(api,/approvedById:\{not:null\}/);
  assert.match(api,/status:"published"/);
  assert.match(api,/publishedAt:\{lte:new Date\(\)\}|publishedAt:\{lte:now\}/);
 }
});

test("corrected or retracted faith notices are refreshed after app resume",()=>{
 const source=readFileSync("masjid-mobile/app/faith.tsx","utf8");
 const shared=readFileSync("masjid-mobile/src/useVenueSafetyRefresh.ts","utf8");
 assert.ok(source.includes("useVenueSafetyRefresh(true,result.refresh)"));
 assert.ok(shared.includes("setInterval(()=>void refresh(),60_000)"));
 assert.ok(shared.includes('shouldRefreshVenueOnResume(previous,state)'));
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {volunteerTime} from "../masjid-mobile/src/volunteerTime.ts";

test("volunteer commitments use the mosque's zone, not the device's zone",()=>{
 const instant="2026-07-15T16:00:00.000Z";
 const eastern=volunteerTime(instant,"America/New_York","en");
 const pacific=volunteerTime(instant,"America/Los_Angeles","en");
 assert.match(eastern,/12:00\s*PM/);
 assert.match(pacific,/9:00\s*AM/);
 assert.match(eastern,/EDT/);
 assert.match(pacific,/PDT/);
 assert.notEqual(eastern,pacific);
});
test("DST fall-back ambiguous clock hour retains the correct offset abbreviation",()=>{
 const first=volunteerTime("2026-11-01T05:30:00Z","America/New_York","en");
 const second=volunteerTime("2026-11-01T06:30:00Z","America/New_York","en");
 assert.match(first,/1:30\s*AM/);
 assert.match(second,/1:30\s*AM/);
 assert.match(first,/EDT/);
 assert.match(second,/EST/);
});
test("Arabic shift time and invalid-zone UTC fallback are explicit",()=>{
 const ar=volunteerTime("2026-07-15T16:00:00.000Z","America/New_York","ar");
 assert.match(ar,/[\u0600-\u06FF]/);
 const fallback=volunteerTime("2026-07-15T16:00:00.000Z","bad/zone","en");
 assert.equal(fallback,"2026-07-15 16:00 UTC");
 assert.equal(volunteerTime("not-an-instant","America/New_York","ar"),"وقت غير صالح");
});
test("private shift API and mobile view use server-provided timezone and localized status",()=>{
 const api=readFileSync("staff-web/src/app/api/v1/shifts/route.ts","utf8");
 const mobile=readFileSync("masjid-mobile/app/volunteer/shifts.tsx","utf8");
 const locale=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 const httpTest=readFileSync("staff-web/scripts/test-shift-safety.mjs","utf8");
 assert.match(api,/select:\{id:true,name:true,timeZone:true\}/);
 assert.match(api,/organization:\{name:org.name,timeZone:org.timeZone\}/);
 assert.match(api,/orderBy:\[\{createdAt:"asc"\},\{id:"asc"\}\]/);
 assert.match(readFileSync("staff-web/src/app/api/v1/admin/shifts/route.ts","utf8"),
  /orderBy:\[\{createdAt:"asc"\},\{id:"asc"\}\]/);
 assert.match(mobile,/volunteerTime\(value,zone,language\)/);
 assert.match(mobile,/t\("shifts.notCheckedIn"\)/);
 assert.match(mobile,/t\("shifts.timezone"\)/);
 assert.match(locale,/"shifts.scheduled":\{en:/);
 assert.match(locale,/"shifts.cancelled":\{en:/);
 assert.match(httpTest,/member shift timestamps are explicitly tied to the mosque timezone/);
});

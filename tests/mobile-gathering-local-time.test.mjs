import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {gatheringLocalTime} from "../masjid-mobile/src/gathering-local-time.ts";

const time="2026-11-01T05:30:00.000Z";

test("verified gathering venues own time display regardless of the selected prayer venue",()=>{
 const event=gatheringLocalTime(time,"America/New_York","Asia/Dubai","en");
 const organization=gatheringLocalTime(time,null,"Asia/Dubai","en");
 assert.ok(event);
 assert.ok(organization);
 assert.equal(event.source,"venue");
 assert.equal(event.timeZone,"America/New_York");
 assert.equal(organization.source,"organization");
 assert.equal(organization.timeZone,"Asia/Dubai");
 assert.notEqual(event.text,organization.text);
});

test("ambiguous DST fall-back hours display distinguishable zone abbreviations",()=>{
 const earlier=gatheringLocalTime("2026-11-01T05:30:00.000Z","America/New_York",null,"en");
 const later=gatheringLocalTime("2026-11-01T06:30:00.000Z","America/New_York",null,"en");
 assert.ok(earlier&&later);
 assert.notEqual(earlier.text,later.text,
  "the two distinct 1:30 AM instants must not display as the same time");
});

test("Arabic display is Gregorian and never substitutes the device timezone",()=>{
 const english=gatheringLocalTime(time,"America/New_York",null,"en");
 const arabic=gatheringLocalTime(time,"America/New_York",null,"ar");
 assert.ok(english&&arabic);
 assert.notEqual(english.text,arabic.text);
 assert.match(arabic.text,/٢٠٢٦|2026/);
 assert.equal(arabic.source,"venue");
});

test("unknown, malformed or deliberately missing zone/time fails closed",()=>{
 const invalidTimes=[
  undefined,null,"","today","2026-11-01","2026-02-30T05:30:00.000Z",
  "2026-11-01T05:30:00Z","2026-11-01T05:30:00.000+00:00"
 ];
 for(const instant of invalidTimes){
  assert.equal(gatheringLocalTime(instant,"America/New_York","UTC","en"),null,String(instant));
 }
 for(const zone of ["Invalid/Zone", "", "  "]){
  assert.equal(gatheringLocalTime(time,zone,"UTC","en"),null,
   "a malformed verified venue zone must not use organization or device zone");
 }
 assert.equal(gatheringLocalTime(time,null,null,"en"),null);
});

test("guest and member homes return tenant-sanitized event venue while mobile labels fallback",()=>{
 const guest=readFileSync("staff-web/src/app/api/v1/public/[resource]/route.ts","utf8");
 const member=readFileSync("staff-web/src/app/api/v1/organizations/view/route.ts","utf8");
 const mobile=readFileSync("masjid-mobile/app/(tabs)/index.tsx","utf8");
 const translation=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 for(const source of [guest,member]){
  assert.match(source,/venue:\{select:\{id:true,name:true,timeZone:true,organizationId:true\}\}/);
  assert.match(source,/events:publicGatheringItems\(events,org\.id\)/);
 }
 assert.match(mobile,/gatheringLocalTime\(e\.startAt,e\.venue\?\.timeZone,/);
 assert.match(mobile,/home\.verifiedVenueTime/);
 assert.match(mobile,/home\.organizationTime/);
 assert.match(mobile,/home\.gatheringTimeUnavailable/);
 assert.doesNotMatch(mobile,/new Date\(e\.startAt\)\.toLocaleString\(/);
 for(const key of ["verifiedVenueTime","organizationTime","gatheringTimeUnavailable"]){
  assert.match(translation,new RegExp('"home\\.'+key+'":\\{en:".+",ar:".+"\\}'));
 }
});

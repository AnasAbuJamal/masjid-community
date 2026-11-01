import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {scheduleRevisionTime} from "../masjid-mobile/src/schedule-revision-time.ts";

test("schedule revisions are formatted for mosque timezone, not device timezone",()=>{
 const instant="2026-11-01T05:30:00.000Z";
 const ny=scheduleRevisionTime(instant,"America/New_York","en");
 const dubai=scheduleRevisionTime(instant,"Asia/Dubai","en");
 assert.ok(ny);
 assert.ok(dubai);
 assert.notEqual(ny,dubai,"different locations must show their own local publication time");
 assert.match(ny,/Nov/i);
});

test("Arabic schedule revisions have Arabic locale and explicitly Gregorian dates",()=>{
 const stamp="2026-11-01T05:30:00.000Z";
 const ar=scheduleRevisionTime(stamp,"America/New_York","ar");
 const en=scheduleRevisionTime(stamp,"America/New_York","en");
 assert.ok(ar);
 assert.notEqual(ar,en);
 assert.match(ar,/٢٠٢٦|2026/);
});

test("unknown timezone, malformed time and missing source cannot display a fabricated update",()=>{
 for(const date of [undefined,null,"", "invalid"]){
  assert.equal(scheduleRevisionTime(date,"America/New_York","en"),null);
 }
 for(const zone of [undefined,null,"","Nonexistent/Mosque"]){
  assert.equal(scheduleRevisionTime("2026-11-01T05:30:00.000Z",zone,"en"),null);
 }
});

test("Salah localizes prayer source, iqamah, publication revision and Friday session labels",()=>{
 const source=readFileSync("masjid-mobile/app/(tabs)/salah.tsx","utf8");
 const dict=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 for(const key of ["source","updated","updateUnavailable","iqamah","session","khutbah"]){
  assert.match(dict,new RegExp('"salah\\.'+key+'":\\{en:".+",ar:".+"\\}'));
  assert.ok(source.includes('t("salah.'+key+'")'),"missing bilingual label "+key);
 }
 assert.match(source,/scheduleRevisionTime\(day\.updatedAt/);
 assert.match(source,/flexDirection:isRTL\?"row-reverse":"row"/);
 assert.doesNotMatch(source,/new Date\(day\.updatedAt\)\.toLocaleDateString\(\)/);
 assert.doesNotMatch(source,/>Source: /);
});

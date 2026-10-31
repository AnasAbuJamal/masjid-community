import {test} from "node:test";
import assert from "node:assert/strict";
import {resolveMosqueLocalTime,formatMosqueLocalInput} from "../staff-web/src/lib/zoned-schedule-time.ts";

function utc(local,zone){
 const answer=resolveMosqueLocalTime(local,zone);
 assert.equal(answer.ok,true,JSON.stringify(answer));
 return answer.date.toISOString();
}
test("unique mosque wall times resolve to actual UTC instants across DST",()=>{
 assert.equal(utc("2026-03-08T01:30","America/New_York"),"2026-03-08T06:30:00.000Z");
 assert.equal(utc("2026-03-08T03:30","America/New_York"),"2026-03-08T07:30:00.000Z");
 assert.equal(utc("2026-11-01T00:30","America/New_York"),"2026-11-01T04:30:00.000Z");
 assert.equal(utc("2026-11-01T02:30","America/New_York"),"2026-11-01T07:30:00.000Z");
 assert.equal(utc("2026-06-10T10:15","Asia/Kolkata"),"2026-06-10T04:45:00.000Z");
 assert.equal(utc("2026-06-10T10:15","Asia/Kathmandu"),"2026-06-10T04:30:00.000Z");
 assert.equal(utc("2026-06-10T10:15","Pacific/Kiritimati"),"2026-06-09T20:15:00.000Z");
});
test("do not silently guess repeated or nonexistent civil times",()=>{
 assert.deepEqual(resolveMosqueLocalTime("2026-03-08T02:30","America/New_York"),
  {ok:false,reason:"NONEXISTENT_LOCAL_TIME"});
 assert.deepEqual(resolveMosqueLocalTime("2026-11-01T01:30","America/New_York"),
  {ok:false,reason:"AMBIGUOUS_LOCAL_TIME"});
 assert.deepEqual(resolveMosqueLocalTime("2026-04-05T01:45","Australia/Lord_Howe"),
  {ok:false,reason:"AMBIGUOUS_LOCAL_TIME"});
});
test("malformed calendars and invalid IANA zones are not interpreted in device timezone",()=>{
 for(const local of ["2026-02-30T10:00","2026-13-01T08:00","2026-12-31T24:00",
  "2026-11-01T01:30Z","bad","2026-06-10T07:90"]){
  assert.deepEqual(resolveMosqueLocalTime(local,"America/New_York"),
   {ok:false,reason:"INVALID_LOCAL_TIME"});
 }
 assert.deepEqual(resolveMosqueLocalTime("2026-06-10T10:15","bad/timezone"),
  {ok:false,reason:"INVALID_ZONE"});
});
test("mosque civil fields display original saved instants without device-local conversion",()=>{
 assert.equal(formatMosqueLocalInput("2026-03-08T07:30:00Z","America/New_York"),
  "2026-03-08T03:30");
 assert.equal(formatMosqueLocalInput("2026-11-01T05:30:00Z","America/New_York"),
  "2026-11-01T01:30");
 assert.equal(formatMosqueLocalInput("2026-11-01T06:30:00Z","America/New_York"),
  "2026-11-01T01:30");
 assert.equal(formatMosqueLocalInput("bad","America/New_York"),"");
});

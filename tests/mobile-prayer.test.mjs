import {test} from "node:test";
import assert from "node:assert/strict";
import {nextPublishedPrayer} from "../masjid-mobile/src/nextPrayer.ts";

const day={localDate:"2026-10-29",fajr:"05:45",dhuhr:"12:15",asr:"15:30",maghrib:"18:00",isha:"19:15"};

test("selects next prayer in venue local time, not device time",()=>{
 assert.deepEqual(nextPublishedPrayer(day,"America/New_York",new Date("2026-10-29T15:00:00Z")),{name:"dhuhr",time:"12:15"});
});
test("does not advertise yesterday or tomorrow as the next published prayer",()=>{
 assert.equal(nextPublishedPrayer({...day,localDate:"2026-10-28"},"America/New_York",new Date("2026-10-29T15:00:00Z")),null);
 assert.equal(nextPublishedPrayer({...day,localDate:"2026-10-30"},"America/New_York",new Date("2026-10-29T15:00:00Z")),null);
});
test("honors timezone boundaries and daylight saving time",()=>{
 assert.equal(nextPublishedPrayer(day,"Asia/Riyadh",new Date("2026-10-29T22:00:00Z")),null);
 assert.deepEqual(nextPublishedPrayer({...day,localDate:"2026-03-08"},"America/New_York",new Date("2026-03-08T06:45:00Z")),{name:"fajr",time:"05:45"});
});
test("does not claim expired or currently starting prayers are upcoming",()=>{
 assert.equal(nextPublishedPrayer(day,"America/New_York",new Date("2026-10-30T00:00:00Z")),null);
 assert.deepEqual(nextPublishedPrayer(day,"America/New_York",new Date("2026-10-29T16:15:00Z")),{name:"asr",time:"15:30"});
});
test("rejects invalid schedule times and unknown timezones",()=>{
 assert.deepEqual(nextPublishedPrayer({...day,fajr:"25:99"},"America/New_York",new Date("2026-10-29T09:00:00Z")),{name:"dhuhr",time:"12:15"});
 assert.equal(nextPublishedPrayer(day,"Not/AZone",new Date("2026-10-29T15:00:00Z")),null);
 assert.equal(nextPublishedPrayer(day,undefined,new Date("2026-10-29T15:00:00Z")),null);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {civilDayStart,nextCivilDay} from "../staff-web/src/lib/civil-day.ts";

test("mosque-local civil days respect US spring-forward and fall-back durations",()=>{
 const spring=civilDayStart("2026-03-08","America/New_York");
 const springNext=civilDayStart("2026-03-09","America/New_York");
 assert.equal(spring.toISOString(),"2026-03-08T05:00:00.000Z");
 assert.equal(springNext.toISOString(),"2026-03-09T04:00:00.000Z");
 assert.equal((springNext-spring)/3600000,23);
 const fall=civilDayStart("2026-11-01","America/New_York");
 const fallNext=civilDayStart("2026-11-02","America/New_York");
 assert.equal(fall.toISOString(),"2026-11-01T04:00:00.000Z");
 assert.equal(fallNext.toISOString(),"2026-11-02T05:00:00.000Z");
 assert.equal((fallNext-fall)/3600000,25);
});
test("half-hour zones and month rollover are exact, not device-time approximations",()=>{
 assert.equal(civilDayStart("2026-03-08","Asia/Kolkata").toISOString(),
  "2026-03-07T18:30:00.000Z");
 assert.equal(civilDayStart("2026-03-08","UTC").toISOString(),
  "2026-03-08T00:00:00.000Z");
 assert.equal(nextCivilDay("2026-12-31"),"2027-01-01");
 assert.equal(nextCivilDay("2026-02-28"),"2026-03-01");
});
test("malformed civil dates and invalid IANA zones fail closed",()=>{
 assert.equal(civilDayStart("2026-02-30","America/New_York"),null);
 assert.equal(civilDayStart("2026-13-01","UTC"),null);
 assert.equal(civilDayStart("2026-03-08","not/a-zone"),null);
 assert.equal(nextCivilDay("2026-02-30"),null);
 assert.equal(civilDayStart("1999-99-99","UTC"),null);
});

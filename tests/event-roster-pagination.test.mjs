import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("private roster pages are checked after current host assignment",()=>{
 const code=read("staff-web/src/app/api/v1/events/check-in/route.ts");
 assert.match(code,/ROSTER_PAGE_SIZE=50/);
 assert.match(code,/eligibleHost\(org\.id,actor\.id\)/);
 assert.match(code,/const pivot=cursor\?await db\.eventRSVP\.findFirst/);
 assert.ok(code.indexOf("if(!assignment)throw new HttpError")<
  code.indexOf("const pivot=cursor?await db.eventRSVP.findFirst"),
  "authorization must run before any RSVP cursor lookup");
 assert.match(code,/where:\{AND:\[eligible,\{id:cursor\}\]\}/);
 assert.match(code,/createdAt:\{gt:pivot\.createdAt\}/);
 assert.match(code,/id:\{gt:pivot\.id\}/);
 assert.match(code,/ROSTER_CURSOR_UNAVAILABLE/);
 assert.match(code,/user:\{select:\{firstName:true,lastName:true\}\}/);
 assert.doesNotMatch(code,/take:300/);
});
test("host web UI loads private pages and ignores prior event responses",()=>{
 const code=read("staff-web/src/app/host/check-in/page.tsx");
 assert.match(code,/Load more confirmed attendees/);
 assert.match(code,/nextCursor/);
 assert.match(code,/rosterVersion\.current!==version/);
 assert.match(code,/selectedEventRef\.current!==requestedEvent/);
 assert.match(code,/setRoster\(old=>old\.map/);
 const testCode=read("staff-web/scripts/test-event-checkin.mjs");
 assert.match(testCode,/length:54/);
 assert.match(testCode,/ROSTER_CURSOR_UNAVAILABLE/);
 assert.match(testCode,/later-page attendee/);
 assert.match(testCode,/revoked host cannot resume a private roster page/);
});

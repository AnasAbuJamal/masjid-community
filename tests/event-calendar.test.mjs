import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(path,"utf8");

test("public and verified calendar handlers use the same non-attendee renderer",()=>{
 const publicRoute=read("staff-web/src/app/api/v1/events/[id]/calendar/route.ts");
 const memberRoute=read("staff-web/src/app/api/v1/events/calendar/route.ts");
 const renderer=read("staff-web/src/lib/event-calendar.ts");
 assert.match(publicRoute,/calendarResponse\(event\)/);
 assert.match(memberRoute,/requireMemberContext\(req\)/);
 assert.match(memberRoute,/calendarResponse\(event\)/);
 assert.match(memberRoute,/params\.getAll\("eventId"\)\.length!==1/);
 assert.match(renderer,/This does not reserve a place/);
 assert.match(renderer,/private, no-store/);
 assert.doesNotMatch(renderer,/["']ATTENDEE:/);
});
test("mobile calendar export authenticates with bearer and never opens a tokenized URL",()=>{
 const mobile=read("masjid-mobile/src/api.ts");
 const details=read("masjid-mobile/app/details/[kind]/[id].tsx");
 assert.match(mobile,/export async function apiCalendar/);
 assert.match(mobile,/Authorization":"Bearer "\+saved/);
 assert.match(mobile,/content\.startsWith\("BEGIN:VCALENDAR"\)/);
 assert.match(details,/apiCalendar\("events\/calendar\?eventId="/);
 assert.match(details,/Share\.share\(/);
});

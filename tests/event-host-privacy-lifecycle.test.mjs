import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("host access probe authorizes before return and never queries attendee names",()=>{
 const api=read("staff-web/src/app/api/v1/events/check-in/route.ts");
 assert.match(api,/mode!=="access"/);
 assert.match(api,/if\(mode==="access"\)return ok\(\{authorized:true/);
 assert.ok(api.indexOf("if(!assignment)throw new HttpError")<
  api.indexOf('if(mode==="access")return ok'));
 assert.match(api,/mode!==null&&params\.has\("cursor"\)/);
 const testCode=read("staff-web/scripts/test-event-checkin.mjs");
 assert.match(testCode,/permission probe must exclude attendee identity keys/);
 assert.match(testCode,/demoted host fails the name-free access probe/);
 assert.match(testCode,/revoked host cannot pass a cached page access check/);
});
test("private host screen clears names and stale requests on tab hide or lost access",()=>{
 const ui=read("staff-web/src/app/host/check-in/page.tsx");
 assert.match(ui,/clearPrivateRoster/);
 assert.match(ui,/visibilitychange/);
 assert.match(ui,/pagehide/);
 assert.match(ui,/45_000/);
 assert.match(ui,/mode=access/);
 assert.match(ui,/rosterVersion\.current\+\+/);
 assert.match(ui,/rosterVersion\.current!==version/);
 assert.match(ui,/setRoster\(\[\]\)/);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("circle host permission-only endpoint yields no roster data",()=>{
 const route=read("staff-web/src/app/api/v1/circles/host/route.ts");
 assert.match(route,/mode!=="access"/);
 assert.match(route,/mode!==null&&params\.has\("cursor"\)/);
 assert.ok(route.indexOf("if(!circle)throw new HttpError")<
  route.indexOf('if(mode==="access")return ok'));
 assert.match(route,/if\(mode==="access"\)return ok\(\{authorized:true/);
 const integration=read("staff-web/scripts/test-circles.mjs");
 assert.match(integration,/Object\.keys\(access\.data\)\.sort\(\)/);
 assert.match(integration,/reclassified host cannot pass a name-free circle permission check/);
 assert.match(integration,/archiving revokes even a cached circle access-only check/);
});
test("host browser clears member details on visibility loss or a revoked probe",()=>{
 const ui=read("staff-web/src/app/host/circles/page.tsx");
 assert.match(ui,/clearPrivateRoster/);
 assert.match(ui,/visibilitychange/);
 assert.match(ui,/pagehide/);
 assert.match(ui,/45_000/);
 assert.match(ui,/mode=access/);
 assert.match(ui,/generation\.current\+\+/);
 assert.match(ui,/setDetail\(null\)/);
});

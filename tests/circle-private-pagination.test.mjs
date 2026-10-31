import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("circle roster cursor resolves only after assigned host and eligible member verification",()=>{
 const code=read("staff-web/src/app/api/v1/circles/host/route.ts");
 assert.match(code,/ROSTER_PAGE_SIZE=25/);
 assert.ok(code.indexOf("if(!circle)throw new HttpError")<
  code.indexOf("const pivot=cursor?await db.circleMember.findFirst"),
  "host permission must precede all private roster cursor lookups");
 assert.match(code,/where:\{AND:\[eligible,\{id:cursor\}\]\}/);
 assert.match(code,/requestedAt:\{gt:pivot\.requestedAt\}/);
 assert.match(code,/id:\{gt:pivot\.id\}/);
 assert.match(code,/CIRCLE_CURSOR_UNAVAILABLE/);
 assert.match(code,/member:\{select:\{firstName:true,lastName:true\}\}/);
 assert.doesNotMatch(code,/members\.length<100/);
});
test("host screen safely appends eligible private pages and discards stale reads",()=>{
 const code=read("staff-web/src/app/host/circles/page.tsx");
 assert.match(code,/Load more circle members/);
 assert.match(code,/nextCursor/);
 assert.match(code,/selectedCircleRef\.current!==requestedCircle/);
 assert.match(code,/visibilitychange/);
 assert.match(code,/generation\.current!==version/);
 const integration=read("staff-web/scripts/test-circles.mjs");
 assert.match(integration,/length:55/);
 assert.match(integration,/CIRCLE_CURSOR_UNAVAILABLE/);
 assert.match(integration,/student-reclassified host/);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createScopedActionGate} from "../masjid-mobile/src/scoped-action-gate.ts";
import {gatheringLocalTime} from "../masjid-mobile/src/gathering-local-time.ts";

const read=path=>readFileSync(path,"utf8");

test("private inbox uses mosque verified timezone, not a device-local timestamp",()=>{
 const instant="2026-11-01T06:30:00.000Z";
 const eastern=gatheringLocalTime(instant,null,"America/New_York","en");
 const arabic=gatheringLocalTime(instant,null,"America/New_York","ar");
 const dubai=gatheringLocalTime(instant,null,"Asia/Dubai","en");
 assert.ok(eastern&&arabic&&dubai);
 assert.equal(eastern.source,"organization");
 assert.equal(eastern.timeZone,"America/New_York");
 assert.equal(arabic.timeZone,"America/New_York");
 assert.notEqual(eastern.text,dubai.text);
 assert.equal(gatheringLocalTime(instant,null,"Bad/Zone","en"),null);
 assert.equal(gatheringLocalTime("invalid",null,"America/New_York","ar"),null);
 assert.equal(gatheringLocalTime(instant,null,null,"ar"),null);
});

test("mark-as-read is scoped to one account and mosque and prevents double taps",async()=>{
 const gate=createScopedActionGate();
 gate.bind("account-1|mosque-1|messages");
 const first=gate.begin();
 assert.notEqual(first,null);
 assert.equal(gate.begin(),null);
 gate.bind("account-2|mosque-2|messages");
 let finishFirst;
 const pending=new Promise(resolve=>{finishFirst=resolve;});
 const second=gate.begin();
 finishFirst();
 await pending;
 assert.equal(gate.isCurrent(first),false);
 assert.equal(gate.finish(first),false);
 assert.equal(gate.isCurrent(second),true);
 assert.equal(gate.finish(second),true);
});

test("native read receipts require current session scope and a server confirmation",()=>{
 const screen=read("masjid-mobile/app/notifications.tsx");
 const server=read("staff-web/src/app/api/v1/notifications/route.ts");
 const patch=read("staff-web/src/app/api/v1/notifications/[id]/route.ts");
 assert.match(screen,/createScopedActionGate\(\)/);
 assert.match(screen,/gate\.current\.bind\(scope\)/);
 assert.match(screen,/gate\.current\.invalidate\(\)/);
 assert.match(screen,/gate\.current\.begin\(\)/);
 assert.match(screen,/if\(ticket===null\)return/);
 assert.match(screen,/gate\.current\.isCurrent\(ticket\)/);
 assert.match(screen,/gate\.current\.finish\(ticket\)/);
 assert.match(screen,/!pages\.items\.some\(n=>n\.id===id&&!n\.readAt\)/);
 assert.match(screen,/contextChanging\?"switching":"stable"/);
 assert.match(screen,/response\.id!==id\|\|response\.read!==true/);
 assert.match(screen,/await data\.refresh\(\)/);
 assert.match(screen,/disabled=\{!canMark\|\|!!busy\}/);
 assert.match(screen,/disabled=\{!canMark\|\|!!busy\|\|pages\.busy\}/);
 assert.match(patch,/userId:user\.id,organizationId:org\.id/);
 assert.match(patch,/readAt:null/);
 assert.match(patch,/return ok\(\{id,read:true\}\)/);
 assert.match(server,/organization:\{id:org\.id,name:org\.name,timeZone:org\.timeZone\}/);
});

test("native inbox refuses to substitute phone time and localizes time provenance",()=>{
 const screen=read("masjid-mobile/app/notifications.tsx");
 const lang=read("masjid-mobile/src/i18n.tsx");
 assert.match(screen,/gatheringLocalTime\(n\.createdAt,null,/);
 assert.match(screen,/data\.data\?\.organization\.timeZone,language/);
 assert.match(screen,/t\("inbox\.mosqueTime"\)/);
 assert.match(screen,/t\("inbox\.timeUnavailable"\)/);
 assert.doesNotMatch(screen,/new Date\(n\.createdAt\)\.toLocaleString/);
 assert.doesNotMatch(screen,/Date\.parse\(n\.createdAt\)/);
 for(const key of ["inbox.mosqueTime","inbox.timeUnavailable"]){
  assert.match(lang,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'));
 }
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseEmailQuietHours} from "../masjid-mobile/src/delivery-hours.ts";
import {createScopedActionGate} from "../masjid-mobile/src/scoped-action-gate.ts";

const read=path=>readFileSync(path,"utf8");

test("optional quiet hours require two whole local-clock hours and never device timestamps",()=>{
 assert.deepEqual(parseEmailQuietHours(false,"irrelevant","invalid"),{
  quietStartHour:null,quietEndHour:null
 });
 assert.deepEqual(parseEmailQuietHours(true,"22","7"),{
  quietStartHour:22,quietEndHour:7
 });
 assert.deepEqual(parseEmailQuietHours(true," 0 ","23"),{
  quietStartHour:0,quietEndHour:23
 });
 for(const [start,end] of [
  ["","7"],["22",""],["24","7"],["-1","7"],["8.5","9"],
  ["8","8"],["08","9"],["12foo","13"],["\\d","7"],["NaN","9"],
  ["22","08"],["999","7"]
 ]){
  assert.equal(parseEmailQuietHours(true,start,end),null,`${start} to ${end}`);
 }
});

test("an active mosque/account change invalidates an old email choice receipt",()=>{
 const gate=createScopedActionGate();
 gate.bind("member-a|version-5|stable");
 const first=gate.begin();
 assert.notEqual(first,null);
 assert.equal(gate.begin(),null,"rapid repeated save cannot send twice");
 gate.bind("member-b|version-6|switching");
 assert.equal(gate.isCurrent(first),false);
 const second=gate.begin();
 assert.notEqual(second,null);
 assert.equal(gate.finish(first),false);
 assert.equal(gate.isCurrent(second),true);
 assert.equal(gate.finish(second),true);
});

test("server saves both optional purposes atomically with one audit transaction",()=>{
 const route=read("staff-web/src/app/api/v1/me/preferences/route.ts");
 assert.match(route,/z\.tuple\(\[change,change\]\)/);
 assert.match(route,/v\.preferences\[0\]\.purpose!==v\.preferences\[1\]\.purpose/);
 assert.match(route,/const requestChange=z\.union\(\[change,batchChange\]\)/);
 assert.match(route,/const changes="preferences" in input\?input\.preferences:\[input\]/);
 assert.match(route,/updated=await db\.\$transaction\(async tx=>\{/);
 assert.match(route,/for\(const values of changes\)/);
 assert.match(route,/Prisma\.TransactionIsolationLevel\.Serializable/);
 assert.match(route,/await tx\.auditEvent\.create/);
 assert.match(route,/consentedAt:values\.enabled\?/);
 assert.match(route,/consentedAt:values\.enabled\?\s*\(existing\?\.enabled&&existing\.consentedAt\?undefined:now\):null/);
 assert.match(route,/return ok\("preferences" in input\?/);
 assert.match(route,/PREFERENCES_CHANGED/);
 assert.doesNotMatch(route,/purpose:z\.enum\(\["service"/);
});

test("native preferences use one batch PATCH, verified tenant receipt, and no stale other-mosque toggles",()=>{
 const screen=read("masjid-mobile/app/settings.tsx");
 assert.match(screen,/parseEmailQuietHours\(quiet,quietStart,quietEnd\)/);
 assert.match(screen,/const ticket=deliveryGate\.current\.begin\(\)/);
 assert.match(screen,/deliveryGate\.current\.isCurrent\(ticket\)/);
 assert.match(screen,/deliveryGate\.current\.finish\(ticket\)/);
 assert.match(screen,/deliveryGate\.current\.invalidate\(\)/);
 assert.match(screen,/contextVersion,user\?\.id\|\|"guest"/);
 assert.match(screen,/response\.organizationId!==expectedOrg/);
 assert.match(screen,/!Array\.isArray\(response\.preferences\)/);
 assert.match(screen,/JSON\.stringify\(\{preferences:choices\}\)/);
 assert.match(screen,/delivery\.data\?<\>/);
 assert.doesNotMatch(screen,/await api\("me\/preferences"/);
 assert.equal((screen.match(/api<SavedDelivery>\("me\/preferences"/g)||[]).length,1);
 assert.match(screen,/t\("settings\.deliveryFailed"\)/);
 const dictionary=read("masjid-mobile/src/i18n.tsx");
 for(const key of ["settings.deliveryFailed","settings.deliveryUnverified"])
  assert.match(dictionary,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),key);
});

test("disposable HTTP integration exercises invalid, duplicate and valid two-purpose saves",()=>{
 const smoke=read("staff-web/scripts/test-delivery-consent.mjs");
 assert.match(smoke,/duplicateBatch/);
 assert.match(smoke,/invalidBatch/);
 assert.match(smoke,/serviceBatch/);
 assert.match(smoke,/a rejected batch cannot withdraw only the first purpose/);
 assert.match(smoke,/batch opt-out clears consent while independent opt-in is saved/);
 assert.match(smoke,/prefIds\.push\(eventPref\.id\)/);
 assert.match(read(".github/workflows/verify.yml"),/node scripts\/test-delivery-consent\.mjs/);
});

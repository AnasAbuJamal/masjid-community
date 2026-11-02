import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createScopedActionGate} from "../masjid-mobile/src/scoped-action-gate.ts";

test("one action per live account/tenant/resource context, including rapid double taps",()=>{
 const gate=createScopedActionGate();
 assert.equal(gate.begin(),null,"no scope bound means no permission");
 gate.bind("member-1:mosque-1:event-1");
 const first=gate.begin();
 assert.equal(typeof first,"number");
 assert.equal(gate.begin(),null,"second tap must not dispatch another request");
 assert.equal(gate.isCurrent(first),true);
 assert.equal(gate.finish(first),true);
 assert.equal(gate.isCurrent(first),false);
 const second=gate.begin();
 assert.equal(typeof second,"number");
 assert.equal(gate.finish(first),false,"stale receipt cannot release the active lock");
 assert.equal(gate.isCurrent(second),true);
 assert.equal(gate.finish(second),true);
});

test("mosque or account switch invalidates a delayed receipt without releasing newer work",async()=>{
 const gate=createScopedActionGate();
 gate.bind("member-1:mosque-a:event-x");
 const old=gate.begin();
 let resolve;
 const pending=new Promise(r=>{resolve=r;});
 gate.bind("member-1:mosque-b:event-x");
 assert.equal(gate.isCurrent(old),false);
 const newTicket=gate.begin();
 assert.equal(gate.begin(),null);
 resolve("old server receipt");
 await pending;
 assert.equal(gate.finish(old),false,"stale completion must not unlock new request");
 assert.equal(gate.isCurrent(newTicket),true);
 assert.equal(gate.finish(newTicket),true);
});

test("scope A-to-B-to-A and unmount cannot revive an earlier receipt",()=>{
 const gate=createScopedActionGate();
 gate.bind("A");
 const old=gate.begin();
 gate.bind("B");
 gate.bind("A");
 assert.equal(gate.isCurrent(old),false);
 const newer=gate.begin();
 assert.equal(gate.finish(old),false);
 assert.equal(gate.isCurrent(newer),true);
 gate.invalidate();
 assert.equal(gate.isCurrent(newer),false);
 assert.equal(gate.begin(),null,"unmounted component cannot start an action");
 gate.bind("A");
 const fresh=gate.begin();
 assert.equal(gate.isCurrent(old),false);
 assert.equal(gate.isCurrent(fresh),true);
});

test("native gathering actions check current ownership before showing success",()=>{
 const details=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 const api=readFileSync("masjid-mobile/src/api.ts","utf8");
 assert.match(details,/createScopedActionGate/);
 assert.match(details,/actionGate\.current\.bind\(actionScope\)/);
 assert.match(details,/actionGate\.current\.begin\(\)/);
 assert.match(details,/actionGate\.current\.isCurrent\(ticket\)/);
 assert.match(details,/actionGate\.current\.finish\(ticket\)/);
 assert.match(details,/actionGate\.current\.invalidate\(\)/);
 assert.match(details,/contextChanging/);
 assert.match(details,/disabled=\{busy\|\|contextChanging/);
 assert.match(api,/const revision=authority\.version\(\)/);
 assert.match(api,/check\(revision\)/);
 for(const [name,start,end] of [
  ["perform"," async function perform(){"," async function shareCalendar(){"],
  ["calendar"," async function shareCalendar(){"," async function cancelEvent(){"],
  ["cancel"," async function cancelEvent(){"," const iconName="]
 ]){
  const section=details.slice(details.indexOf(start),details.indexOf(end));
  assert.ok(section.length>0,name+" handler should exist");
  assert.match(section,/const ticket=actionGate\.current\.begin\(\)/,name);
  assert.match(section,/actionGate\.current\.isCurrent\(ticket\)/,name);
  assert.match(section,/if\(actionGate\.current\.finish\(ticket\)\)setBusy\(false\)/,name);
  assert.match(section,/contextChanging/,name+" must block tenant transitions");
 }
 assert.match(details,/React\.useLayoutEffect\(\(\)=>\{/);
 assert.match(details,/setLetter\(" "\)/);
 assert.match(details,/setFrom\(" "\)/);
 assert.match(details,/setTo\(" "\)/);
});

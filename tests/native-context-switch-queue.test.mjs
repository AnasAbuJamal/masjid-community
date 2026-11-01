import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createLatestContextSwitchQueue} from "../masjid-mobile/src/context-switch-queue.ts";
const defer=()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});return {promise,resolve,reject};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
test("overlapping mosque switches reach the server in order; newest valid intent wins",async()=>{
 const queue=createLatestContextSwitchQueue(),first=defer(),calls=[];
 const a=queue.run(async()=>{calls.push("A begins");await first.promise;calls.push("A applied");return "A"});
 await tick();
 const b=queue.run(async()=>{calls.push("B begins");calls.push("B applied");return "B"});
 await tick();
 assert.deepEqual(calls,["A begins"],"new request must wait for in-flight server write");
 first.resolve();
 await assert.rejects(a,/superseded|replaced/i);
 assert.equal(await b,"B");
 assert.deepEqual(calls,["A begins","A applied","B begins","B applied"]);
});
test("intermediate queued mosque selection is never sent after a newer intent",async()=>{
 const queue=createLatestContextSwitchQueue(),first=defer(),calls=[];
 const a=queue.run(async()=>{calls.push("A");await first.promise;return "A"});
 await tick();
 const b=queue.run(async()=>{calls.push("B");return "B"});
 const c=queue.run(async()=>{calls.push("C");return "C"});
 first.resolve();
 await assert.rejects(a,/superseded|replaced/i);
 await assert.rejects(b,/superseded|replaced/i);
 assert.equal(await c,"C");
 assert.deepEqual(calls,["A","C"]);
});
test("failed first selection does not strand a newer valid selection",async()=>{
 const queue=createLatestContextSwitchQueue(),gate=defer(),calls=[];
 const a=queue.run(async()=>{calls.push("A");await gate.promise;throw new Error("network failed")});
 await tick();
 const b=queue.run(async()=>{calls.push("B");return "B"});
 gate.resolve();
 await assert.rejects(a,/network failed/);
 assert.equal(await b,"B");
 assert.deepEqual(calls,["A","B"]);
});
test("logout invalidates pending mosque selection before it reaches server",async()=>{
 const queue=createLatestContextSwitchQueue(),gate=defer(),calls=[];
 const a=queue.run(async()=>{calls.push("A");await gate.promise;return "A"});
 await tick();
 const b=queue.run(async()=>{calls.push("B");return "B"});
 queue.invalidate();
 gate.resolve();
 await assert.rejects(a,/superseded|replaced/i);
 await assert.rejects(b,/superseded|replaced/i);
 assert.deepEqual(calls,["A"]);
});
test("native provider suspends private resources until selected mosque is acknowledged",()=>{
 const session=readFileSync("masjid-mobile/src/session.tsx","utf8");
 const resource=readFileSync("masjid-mobile/src/useResource.ts","utf8");
 for(const token of [
  "const switchQueue=useRef(createLatestContextSwitchQueue())",
  "await switchQueue.current.run(async()=>",
  "setContextChanging(true)",
  "setContextChanging(false)",
  "switchQueue.current.invalidate()",
  "if(generation!==operation.current)throw sessionChanged()",
  "contextChanging,selectOrganization"
 ])assert.ok(session.includes(token),"Missing ordered context lifecycle: "+token);
 for(const token of [
  "const {contextVersion,contextChanging}=useSession()",
  'contextChanging&&!path.startsWith("public/")',
  "if(!path||suspended)return",
  '[path,key,suspended]',
  'suspended?"#switching":""'
 ])assert.ok(resource.includes(token),"Missing private-resource switch pause: "+token);
 const switchStart=session.indexOf(" const selectOrganization=async(");
 const switchEnd=session.indexOf(" return <Context.Provider",switchStart);
 const body=session.slice(switchStart,switchEnd);
 assert.ok(body.indexOf("setContextChanging(true)")<body.indexOf("await switchQueue.current.run("));
 assert.ok(body.indexOf("await apiPost(")<body.indexOf("setContextChanging(false)"));
});

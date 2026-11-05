import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createSessionExpiryGuard} from "../masjid-mobile/src/session-expiry.ts";
import {readBoundedCalendar} from "../masjid-mobile/src/calendar-stream.ts";
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {resolve,promise};}
function harness(){
 let version=4,clears=0;
 const pending=deferred();
 const guard=createSessionExpiryGuard({version:()=>version,
  clear:()=>{version++;clears++;return pending.promise}});
 return {guard,pending,status:()=>({version,clears})};
}
test("current authenticated 401 clears authority and private views before secure deletion finishes",()=>{
 const h=harness(),seen=[];
 h.guard.subscribe(()=>seen.push("session invalidated"));
 assert.equal(h.guard.expire({status:401,revision:4,authenticated:true,path:"me"}),true);
 assert.deepEqual(seen,["session invalidated"]);
 assert.deepEqual(h.status(),{version:5,clears:1});
 h.pending.resolve();
});
test("old and duplicate 401 responses cannot clear a newer session",()=>{
 const h=harness();let notices=0;
 h.guard.subscribe(()=>{notices++});
 assert.equal(h.guard.expire({status:401,revision:4,authenticated:true,path:"account"}),true);
 assert.equal(h.guard.expire({status:401,revision:4,authenticated:true,path:"schoolwork"}),false);
 assert.equal(h.status().clears,1);
 assert.equal(notices,1);
 h.pending.resolve();
});
test("guest/public errors and 403 do not sign out an authorized user",()=>{
 const h=harness();let notices=0;
 const off=h.guard.subscribe(()=>{notices++});
 for(const x of [
  {status:401,revision:4,authenticated:false,path:"me"},
  {status:403,revision:4,authenticated:true,path:"me"},
  {status:401,revision:4,authenticated:true,path:"public/announcements"},
  {status:401,revision:4,authenticated:true,path:"auth/login"},
  {status:401,revision:4,authenticated:true,path:"auth/register"},
  {status:401,revision:7,authenticated:true,path:"account"}
 ])assert.equal(h.guard.expire(x),false);
 assert.equal(h.status().clears,0);
 off();
 assert.equal(h.guard.expire({status:401,revision:4,authenticated:true,path:"account"}),true);
 assert.equal(notices,0,"unmounted provider must not receive expiry events");
 h.pending.resolve();
});
test("failed OS deletion cannot cause an unhandled rejection or restore local authority",async()=>{
 let version=1,seen=false;
 const guard=createSessionExpiryGuard({version:()=>version,
  clear:()=>{version++;return Promise.reject(Error("keychain delete failed"))}});
 guard.subscribe(()=>{seen=true});
 assert.equal(guard.expire({status:401,revision:1,authenticated:true,path:"account"}),true);
 assert.equal(version,2);assert.equal(seen,true);
 await new Promise(resolve=>setImmediate(resolve));
});
test("both native transports and guest screen receive session expiry handling",()=>{
 const api=readFileSync("masjid-mobile/src/api.ts","utf8");
 const session=readFileSync("masjid-mobile/src/session.tsx","utf8");
 const screen=readFileSync("masjid-mobile/app/(tabs)/profile.tsx","utf8");
 const i18n=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.equal(api.split("expiry.expire({status:response.status,revision,authenticated:!!saved,path})").length-1,2);
 for(const s of ["onSessionExpired=expiry.subscribe",
  'createSessionExpiryGuard({version:authority.version,clear:authority.clear}'])
  assert.ok(api.includes(s),s);
 for(const s of ["useEffect(()=>onSessionExpired(","setSessionExpired(true)",
  "setSessionExpired(false)","switchQueue.current.invalidate()",
  "setContextChanging(false)","setContextVersion(v=>v+1)"])
  assert.ok(session.includes(s),s);
 assert.ok(screen.includes('accessibilityRole="alert"'));
 assert.ok(screen.includes('t("profile.sessionExpired")'));
 assert.ok(i18n.includes('"profile.sessionExpired":{en:'));
});

test("calendar export streams exact byte limit without unbounded buffering",async()=>{
 const body="BEGIN:VCALENDAR\\nEND:VCALENDAR";
 const response=new Response(new ReadableStream({start(c){
  c.enqueue(new TextEncoder().encode(body.slice(0,10)));
  c.enqueue(new TextEncoder().encode(body.slice(10)));
  c.close();
 }}));
 assert.equal(await readBoundedCalendar(response,new TextEncoder().encode(body).length),body);
});
test("oversized calendar export is cancelled before reading the rest",async()=>{
 let cancelled=false,reads=0;
 const response=new Response(new ReadableStream({
  pull(c){reads++;c.enqueue(new Uint8Array(100));},
  cancel(){cancelled=true;}
 }));
 await assert.rejects(readBoundedCalendar(response,64),/too large/);
 assert.equal(cancelled,true);
 assert.ok(reads<=2,"reader must not drain the oversized response");
});
test("calendar stream rejects malformed UTF-8 including split sequences",async()=>{
 const response=new Response(new ReadableStream({start(c){
  c.enqueue(new Uint8Array([0x42,0xc3]));
  c.enqueue(new Uint8Array([0x28]));
  c.close();
 }}));
 await assert.rejects(readBoundedCalendar(response,64),/valid UTF-8/);
});
test("native calendar transport uses bounded streaming and generation recheck",()=>{
 const api=readFileSync("masjid-mobile/src/api.ts","utf8");
 assert.ok(api.includes("await readBoundedCalendar(response,65536)"));
 assert.ok(api.includes('import {readBoundedCalendar} from "./calendar-stream"'));
 assert.ok(!api.includes("await response.text()"));
});

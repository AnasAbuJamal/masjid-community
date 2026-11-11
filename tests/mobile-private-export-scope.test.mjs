import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPrivateExportAction} from "../masjid-mobile/src/private-export.ts";

const expected={organizationId:"mosque-a",email:"member@example.test"};
const receipt=()=>({organization:{id:expected.organizationId,name:"Synthetic mosque"},
 account:{email:expected.email},scope:"Limited current mosque export",complete:false,
 truncatedCategories:[],categoryWindowComplete:true,exclusions:["student and guardianship records"]});
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function setup(){const action=createPrivateExportAction();action.bind("member-a|mosque-a|1");return action;}

test("export validates its owner and mosque before opening one sharing sheet",async()=>{
 const action=setup(),value=receipt(),shared=[];
 assert.equal(await action.run(action.capture(),expected,async()=>value,async v=>shared.push(v)),"shared");
 assert.deepEqual(shared,[value]);
});

test("stale confirmation cannot dispatch with a newer account, mosque or session",async()=>{
 for(const scope of ["member-b|mosque-a|2","member-a|mosque-b|2","member-a|mosque-a|2",null]){
  const action=setup(),intent=action.capture();action.bind(scope);
  let requests=0,shares=0;
  assert.equal(await action.run(intent,expected,async()=>{requests++;return receipt();},async()=>{shares++;}),"discarded");
  assert.equal(requests,0);assert.equal(shares,0);
 }
});

test("pending export is discarded on switch, return to the same mosque, or unmount",async()=>{
 for(const invalidate of [a=>a.bind("member-a|mosque-b|2"),a=>{a.bind("other");a.bind("member-a|mosque-a|1");},a=>a.invalidate()]){
  const action=setup(),pending=deferred();let shares=0;
  const request=action.run(action.capture(),expected,()=>pending.promise,async()=>{shares++;});
  invalidate(action);pending.resolve(receipt());
  assert.equal(await request,"discarded");assert.equal(shares,0);
 }
});

test("duplicate taps do not issue a second export or sharing operation",async()=>{
 const action=setup(),intent=action.capture(),pending=deferred();let requests=0,shares=0;
 const request=()=>{requests++;return pending.promise;};const share=async()=>{shares++;};
 const first=action.run(intent,expected,request,share);
 assert.equal(await action.run(intent,expected,request,share),"busy");
 pending.resolve(receipt());assert.equal(await first,"shared");
 assert.equal(requests,1);assert.equal(shares,1);
});

test("lock remains held while the native share sheet is open",async()=>{
 const action=setup(),intent=action.capture(),sheet=deferred();let requests=0;
 const request=async()=>{requests++;return receipt();};
 const first=action.run(intent,expected,request,()=>sheet.promise);
 await Promise.resolve();
 assert.equal(await action.run(intent,expected,request,async()=>{}),"busy");
 sheet.resolve();assert.equal(await first,"shared");assert.equal(requests,1);
});

test("unverified export identities and malformed limited-export metadata never reach sharing",async()=>{
 const invalid=[null,{}, {...receipt(),organization:{id:"foreign",name:"Other"}},
  {...receipt(),account:{email:"another@example.test"}},
  {...receipt(),complete:true},{...receipt(),scope:""},
  {...receipt(),truncatedCategories:"donations"},
  {...receipt(),truncatedCategories:[12]},
  {...receipt(),truncatedCategories:["donations"],categoryWindowComplete:true},
  {...receipt(),categoryWindowComplete:false},
  {...receipt(),exclusions:null}];
 for(const value of invalid){
  const action=setup();let shares=0;
  await assert.rejects(action.run(action.capture(),expected,async()=>value,async()=>{shares++;}),/Unverified private export/);
  assert.equal(shares,0);
 }
 const action=setup();let requests=0;
 await assert.rejects(action.run(action.capture(),{organizationId:"",email:""},async()=>{requests++;return receipt();},async()=>{}),/Unverified private export/);
 assert.equal(requests,0);
});

test("limited export explicitly preserves truncation warnings",async()=>{
 const action=setup(),value={...receipt(),truncatedCategories:["donations"],categoryWindowComplete:false};
 let received;
 assert.equal(await action.run(action.capture(),expected,async()=>value,async v=>{received=v;}),"shared");
 assert.deepEqual(received.truncatedCategories,["donations"]);
});

test("late failure from an obsolete scope cannot unlock a newer export",async()=>{
 const action=setup(),old=deferred(),current=deferred();let shares=0;
 const first=action.run(action.capture(),expected,()=>old.promise,async()=>{shares++;});
 action.bind("member-a|mosque-a|2");
 const intent=action.capture(),second=action.run(intent,expected,()=>current.promise,async()=>{shares++;});
 old.reject(new Error("Synthetic old request failure"));
 assert.equal(await first,"discarded");
 assert.equal(await action.run(intent,expected,async()=>receipt(),async()=>{}),"busy");
 current.resolve(receipt());assert.equal(await second,"shared");assert.equal(shares,1);
});

test("current request and share failures propagate and allow an explicit retry",async()=>{
 for(const shareFails of [false,true]){
  const action=setup(),intent=action.capture();
  await assert.rejects(action.run(intent,expected,async()=>{if(!shareFails)throw new Error("Synthetic failure");return receipt();},async()=>{throw new Error("Synthetic failure");}),/Synthetic failure/);
  assert.equal(await action.run(intent,expected,async()=>receipt(),async()=>{}),"shared");
 }
});

test("a dismissed old share sheet cannot report success into a newer scope",async()=>{
 const action=setup(),intent=action.capture(),sheet=deferred();
 const first=action.run(intent,expected,async()=>receipt(),()=>sheet.promise);
 await Promise.resolve();
 action.bind("member-b|mosque-a|2");sheet.resolve();
 assert.equal(await first,"discarded");assert.equal(action.isCurrent(intent),false);
 assert.equal(await action.run(action.capture(),expected,async()=>receipt(),async()=>{}),"shared");
});

test("a share-sheet failure after unmount is suppressed",async()=>{
 const action=setup(),sheet=deferred();
 const first=action.run(action.capture(),expected,async()=>receipt(),()=>sheet.promise);
 await Promise.resolve();action.invalidate();sheet.reject(new Error("Synthetic OS failure"));
 assert.equal(await first,"discarded");assert.equal(action.capture(),null);
});

test("Settings captures consent scope and clears credentials before any export dispatch",()=>{
 const screen=readFileSync("masjid-mobile/app/settings.tsx","utf8");
 assert.match(screen,/createPrivateExportAction/);
 assert.match(screen,/privateExport\.current\.bind\(exportScope\)/);
 assert.match(screen,/privateExport\.current\.invalidate\(\)/);
 assert.match(screen,/const intent=privateExport\.current\.capture\(\)/);
 assert.match(screen,/exportData\(intent,expected\)/);
 assert.match(screen,/setExportPassword\(""\);\s*const outcome=await privateExport\.current\.run/);
 assert.match(screen,/if\(privateExport\.current\.isCurrent\(intent\)\)setBusy\(false\)/);
 assert.match(screen,/contextChanging\|\|exportScope===null/);
});

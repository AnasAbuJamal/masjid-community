import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {memberSurfaceScope,allowPilotContent} from "../masjid-mobile/src/searchScope.ts";

const second={selectedOrganizationId:"second",selectedActive:true,organizations:[
 {id:"home",memberWorkspace:"pilot"},
 {id:"second",memberWorkspace:"limited_member_worship_gather"}
]};
test("direct legacy flow is never authorized by selecting a different mosque",()=>{
 assert.equal(allowPilotContent(memberSurfaceScope(second,true)),false);
 assert.equal(allowPilotContent(memberSurfaceScope(null,true)),false);
 assert.equal(allowPilotContent(memberSurfaceScope({...second,selectedActive:false},true)),false);
 assert.equal(allowPilotContent(memberSurfaceScope({...second,selectedOrganizationId:"home"},true)),true);
 assert.equal(allowPilotContent(memberSurfaceScope(null,false)),true);
});
test("deep-link entry points must not fetch default-mosque records in foreign context",()=>{
 for(const file of [
  "app/giving/[id].tsx","app/care/request.tsx",
  "app/school/apply/[programId].tsx","app/finance/transparency.tsx",
  "app/circles.tsx","app/contact.tsx"
 ]){
  const code=readFileSync("masjid-mobile/"+file,"utf8");
  assert.match(code,/usePilotSurface\(\)/,"member scope hook missing from "+file);
  assert.match(code,/MemberScopeNotice/,"no safe disabled-state explanation in "+file);
 }
 for(const [file,guard] of [
  ["app/giving/[id].tsx",/allowed\?"public\/campaigns":null/],
  ["app/care/request.tsx",/allowed\?"care":null/],
  ["app/school/apply/[programId].tsx",/allowed\?"public\/programs":null/],
  
  ["app/circles.tsx",/allowed\?"circles":null/]
 ]){
  assert.match(readFileSync("masjid-mobile/"+file,"utf8"),guard);
 }
});

test("financial transparency selects published budget ownership without home fallback",()=>{
 const code=readFileSync("masjid-mobile/app/finance/transparency.tsx","utf8");
 assert.match(code,/const enabled=surface\.allowed\|\|surface\.scope==="limited"/);
 assert.match(code,/const selected=surface\.scope==="pilot"\|\|surface\.scope==="limited"/);
 assert.match(code,/const path=enabled\?\(selected\?"organizations\/view\?resource=financials":"public\/financials"\):null/);
 assert.match(code,/!enabled\?<MemberScopeNotice/);
});

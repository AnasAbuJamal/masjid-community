import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {memberSurfaceScope,allowPilotContent,searchScope} from "../masjid-mobile/src/searchScope.ts";

const active={selectedOrganizationId:"second",selectedActive:true,organizations:[
 {id:"first",memberWorkspace:"pilot"},
 {id:"second",memberWorkspace:"limited_member_worship_gather"}
]};
test("foreign, unresolved and inactive selections never enable pilot program or care data",()=>{
 for(const [c,expected] of [[active,"limited"],[null,"loading"],
  [{...active,selectedActive:false},"inactive"],
  [{...active,organizations:[]},"inactive"]]){
  const scope=memberSurfaceScope(c,true);
  assert.equal(scope,expected);
  assert.equal(allowPilotContent(scope),false);
 }
 assert.equal(allowPilotContent(memberSurfaceScope(active,false)),true,
  "unauthenticated guest can browse the deliberately public pilot site");
 assert.equal(allowPilotContent(memberSurfaceScope({...active,selectedOrganizationId:"first"},true)),true);
 assert.equal(searchScope({...active,selectedActive:false},true),"unknown",
  "revoked foreign member cannot query even selected gathering catalog");
});
test("unsupported native surfaces wire their data hooks through current member context",()=>{
 const source=["app/(tabs)/care.tsx","app/(tabs)/school.tsx",
  "app/(tabs)/discover.tsx","app/details/[kind]/[id].tsx"];
 for(const file of source){
  const contents=readFileSync("masjid-mobile/"+file,"utf8");
  assert.match(contents,/memberSurfaceScope\(context\.data/);
  assert.match(contents,/MemberScopeNotice/);
 }
 const care=readFileSync("masjid-mobile/app/(tabs)/care.tsx","utf8");
 assert.match(care,/allowed\?"care":null/);
 const school=readFileSync("masjid-mobile/app/(tabs)/school.tsx","utf8");
 assert.match(school,/allowed\?"public\/programs":null/);
 const detail=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 assert.match(detail,/pilotContent\?"public\//);
});

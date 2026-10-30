import {test} from "node:test";
import assert from "node:assert/strict";
import {searchScope,scopedSearchPath,memberSurfaceScope,allowPilotContent} from "../masjid-mobile/src/searchScope.ts";

const home={selectedOrganizationId:"home",selectedActive:true,
 organizations:[{id:"home",memberWorkspace:"pilot"},{id:"foreign",memberWorkspace:"limited_member_gather"}]};
const foreign={...home,selectedOrganizationId:"foreign"};

test("verified member search never falls back to the home mosque while context is unresolved",()=>{
 assert.equal(searchScope(null,true),"unknown");
 assert.equal(scopedSearchPath("mosque","all","unknown"),null);
 assert.equal(searchScope({...foreign,selectedActive:false},true),"unknown");
 assert.equal(memberSurfaceScope({...foreign,selectedActive:false},true),"inactive");
 assert.equal(allowPilotContent("inactive"),false);
});
test("other mosque searches ONLY supported published categories",()=>{
 const scope=searchScope(foreign,true);
 assert.equal(scope,"published_selected");
 assert.equal(scopedSearchPath("  Friday prayer  ","events",scope),
  "organizations/search?q=Friday%20prayer&kind=events");
 assert.equal(scopedSearchPath("a","articles",scope),null);
 assert.equal(scopedSearchPath("مدرسة","all",scope),
  "organizations/search?q="+encodeURIComponent("مدرسة")+"&kind=all");
 assert.equal(scopedSearchPath("newsletter","announcements",scope),
  "organizations/search?q=newsletter&kind=announcements");
 assert.equal(scopedSearchPath("housing","jobs",scope),
  "organizations/search?q=housing&kind=all",
  "unsupported client categories must not be supplied to the private search endpoint");
});
test("home and guest searches retain the original public categories",()=>{
 assert.equal(searchScope(home,true),"public");
 assert.equal(searchScope(null,false),"public");
 assert.equal(scopedSearchPath("food drive","campaigns","public"),
  "public/search?q=food%20drive&kind=campaigns");
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {searchScope,scopedSearchPath} from "../masjid-mobile/src/searchScope.ts";

const home={selectedOrganizationId:"home",selectedActive:true,
 organizations:[{id:"home",memberWorkspace:"pilot"},{id:"foreign",memberWorkspace:"limited_member_gather"}]};
const foreign={...home,selectedOrganizationId:"foreign"};

test("verified member search never falls back to the home mosque while context is unresolved",()=>{
 assert.equal(searchScope(null,true),"unknown");
 assert.equal(scopedSearchPath("mosque","all","unknown"),null);
 assert.equal(searchScope({...foreign,selectedActive:false},true),"gatherings_only");
});
test("other mosque searches ONLY published gatherings regardless of chosen old category",()=>{
 const scope=searchScope(foreign,true);
 assert.equal(scope,"gatherings_only");
 assert.equal(scopedSearchPath("  Friday prayer  ","jobs",scope),
  "events/catalog?q=Friday%20prayer");
 assert.equal(scopedSearchPath("a","jobs",scope),null);
 assert.equal(scopedSearchPath("مدرسة","all",scope),
  "events/catalog?q="+encodeURIComponent("مدرسة"));
});
test("home and guest searches retain the original public categories",()=>{
 assert.equal(searchScope(home,true),"public");
 assert.equal(searchScope(null,false),"public");
 assert.equal(scopedSearchPath("food drive","campaigns","public"),
  "public/search?q=food%20drive&kind=campaigns");
});

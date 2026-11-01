import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 searchTermProblem,searchScope,scopedSearchPath
} from "../masjid-mobile/src/searchScope.ts";

test("Arabic and Latin published searches share the same strict server grammar",()=>{
 for(const query of [
  "تعليم العربية","القرآن 2026","Community class",
  "Friday's gathering","Qur’an study","Arabic-Literacy"
 ]){
  assert.equal(searchTermProblem(query),null,query);
 }
 assert.equal(searchTermProblem(""),"short");
 assert.equal(searchTermProblem("  a  "),"short");
 assert.equal(searchTermProblem("x".repeat(80)),null);
 assert.equal(searchTermProblem("x".repeat(81)),"long");
 for(const invalid of ["children@example.org","name%20OR%201=1",
  "topic/tag","<script>","🚀","hello\tworld&"]) {
  assert.equal(searchTermProblem(invalid),"characters",invalid);
 }
});

test("invalid search terms never generate a network request",()=>{
 const empty={all:scopedSearchPath(" a ","all","public"),
  long:scopedSearchPath("X".repeat(81),"all","public"),
  invalid:scopedSearchPath("Hi!","events","published_selected"),
  unknown:scopedSearchPath("Arabic","all","unknown")};
 assert.deepEqual(empty,{all:null,long:null,invalid:null,unknown:null});
 const guest=scopedSearchPath("  تعليم العربية  ","events","public");
 assert.ok(guest);
 const url=new URL("https://example.invalid/"+guest);
 assert.equal(url.pathname,"/public/search");
 assert.equal(url.searchParams.get("q"),"تعليم العربية");
 assert.equal(url.searchParams.get("kind"),"events");
 assert.equal(url.searchParams.has("organizationId"),false);
 const member=scopedSearchPath("school","programs","published_selected");
 assert.equal(new URL("https://example.invalid/"+member).searchParams.get("kind"),"all",
  "selected mosque cannot request unsupported categories");
});

test("member context must be confirmed before selected-mosque search",()=>{
 assert.equal(searchScope(null,true),"unknown");
 assert.equal(searchScope({
  selectedOrganizationId:"a",selectedActive:false,
  organizations:[{id:"a",memberWorkspace:"pilot"}]
 },true),"unknown");
 assert.equal(searchScope({
  selectedOrganizationId:"b",selectedActive:true,
  organizations:[{id:"a",memberWorkspace:"pilot"}]
 },true),"unknown");
 assert.equal(searchScope({
  selectedOrganizationId:"b",selectedActive:true,
  organizations:[{id:"b",memberWorkspace:"limited"}]
 },true),"published_selected");
 assert.equal(searchScope(null,false),"public");
});

test("native search translates filters, hides older queries and checks response mosque ID",()=>{
 const screen=readFileSync("masjid-mobile/app/search.tsx","utf8");
 const translations=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(screen,/useLanguage\(\)/);
 assert.match(screen,/searchTermProblem\(query\)/);
 assert.match(screen,/const settling=term!==query\.trim\(\)/);
 assert.match(screen,/results\.data\.organization\?\.id!==context\.data\?\.selectedOrganizationId/);
 assert.match(screen,/supportedKind\(x\.kind\)/);
 assert.match(screen,/flexDirection:isRTL\?"row-reverse":"row"/);
 assert.match(screen,/accessibilityRole="alert"/);
 assert.match(screen,/const choices:Category\[\]=limited/);
 assert.match(screen,/\["all","events","announcements","articles"\]/);
 assert.doesNotMatch(screen,/subtitle=\{item\.kind\+" · "/);
 for(const key of [
  "back","eyebrow","title","subtitlePublic","subtitleSelected",
  "inputPublic","inputSelected","limited","inactive","switch",
  "verifying","enterPublic","enterSelected","tooLong","invalidCharacters",
  "contextMismatch","kind.all","kind.events","kind.articles",
  "kind.announcements","kind.programs","kind.jobs","kind.campaigns",
  "kind.volunteers","kind.construction","kind.rentals","kind.proposals"
 ]){
  assert.match(translations,
   new RegExp('"search\\.'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),
   "missing English/Arabic entry "+key);
 }
});

test("guest public search denies duplicate/foreign filters and fixes tenant selection",()=>{
 const route=readFileSync("staff-web/src/app/api/v1/public/search/route.ts","utf8");
 assert.match(route,/params\.getAll\("q"\)\.length>1/);
 assert.match(route,/params\.getAll\("kind"\)\.length>1/);
 assert.match(route,/organization\.findFirst\(\{orderBy:\{createdAt:"asc"\}\}\)/);
 assert.match(route,/status:"published"/);
 assert.match(route,/publishedAt:\{lte:now\}/);
 const pipeline=readFileSync(".github/workflows/verify.yml","utf8");
 assert.ok(pipeline.includes("node scripts/test-public-search-tenant.mjs"));
});

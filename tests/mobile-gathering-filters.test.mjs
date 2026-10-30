import {test} from "node:test";
import assert from "node:assert/strict";
import {gatheringCatalogPath,gatheringFilterError} from "../masjid-mobile/src/gatheringFilters.ts";

const base={query:"",fromDay:"",toDay:"",venueId:"",
 category:"",audience:"",accessibility:""};
test("gathering query encodes reviewed categories and scoped venue without tenant hints",()=>{
 const path=gatheringCatalogPath("events/catalog",{...base,
  query:"  Arabic / literacy  ",category:"workshop",audience:"families",
  accessibility:"step_free",venueId:"verified-venue-id"});
 const url=new URL("https://example.invalid/"+path);
 assert.equal(url.searchParams.get("q"),"Arabic / literacy");
 assert.equal(url.searchParams.get("category"),"workshop");
 assert.equal(url.searchParams.get("audience"),"families");
 assert.equal(url.searchParams.get("venueId"),"verified-venue-id");
 assert.equal(url.searchParams.get("accessibility"),"step_free");
 assert.equal(url.searchParams.get("organizationId"),null);
});
test("inclusive device-local date range produces real exclusive UTC instants",()=>{
 const path=gatheringCatalogPath("public/events",{...base,
  fromDay:"2032-11-05",toDay:"2032-11-05"});
 const url=new URL("https://example.invalid/"+path);
 const start=new Date(url.searchParams.get("from"));
 const end=new Date(url.searchParams.get("to"));
 assert.ok(start.getTime()>0);
 assert.ok(end.getTime()>start.getTime());
 assert.equal(start.getFullYear(),2032);
 assert.equal(start.getMonth(),10);
 assert.equal(start.getDate(),5);
 assert.equal(end.getDate(),6);
});
test("malformed and reversed dates block the request instead of broadening it",()=>{
 for(const filters of [
  {...base,fromDay:"2032-02-30"},
  {...base,toDay:"2032-11-99"},
  {...base,fromDay:"2032-11-06",toDay:"2032-11-05"},
  {...base,query:"x".repeat(81)}
 ]){
  assert.ok(gatheringFilterError(filters));
  assert.equal(gatheringCatalogPath("events/catalog",filters),null);
 }
 assert.equal(gatheringCatalogPath("events/catalog",base),"events/catalog");
});

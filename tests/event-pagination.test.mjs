import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("published keyset pagination binds every cursor to tenant and filter",()=>{
 const source=read("staff-web/src/lib/gathering-filters.ts");
 assert.match(source,/GATHERING_PAGE_SIZE=25/);
 assert.match(source,/parts\.cursor\?await db\.event\.findFirst/);
 assert.match(source,/where:\{AND:\[base,\{id:parts\.cursor\}\]\}/);
 assert.match(source,/startAt:\{gt:pivot\.startAt\}/);
 assert.match(source,/id:\{gt:pivot\.id\}/);
 assert.match(source,/CURSOR_UNAVAILABLE/);
 assert.match(source,/params\.getAll\(k\)\.length>1/);
});
test("both guest and verified catalogs reuse the exact same pagination boundary",()=>{
 for(const path of [
  "staff-web/src/app/api/v1/events/catalog/route.ts",
  "staff-web/src/app/api/v1/public/[resource]/route.ts"
 ]){
  assert.match(read(path),/publishedGatheringPage\(org\.id,parts\)/,path);
 }
 assert.match(read("staff-web/scripts/test-gather.mjs"),/length:55/);
 assert.match(read("staff-web/scripts/test-tenant-context.mjs"),/foreign-session cursor/);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {mergeGatheringPages,gatheringNextPagePath} from "../masjid-mobile/src/gatheringPagination.ts";
import {readFileSync} from "node:fs";

test("keyset continuation encodes opaque ID without rewriting scoped filters",()=>{
 const path=gatheringNextPagePath("events/catalog?category=other&q=Friday","cuid_special-id");
 assert.equal(path,"events/catalog?category=other&q=Friday&cursor=cuid_special-id");
 assert.equal(gatheringNextPagePath("public/events","opaque id/?"),
  "public/events?cursor=opaque%20id%2F%3F");
});
test("pages dedupe IDs on same-time record reordering",()=>{
 const list=mergeGatheringPages([{id:"a"}],[{id:"b"},{id:"c"}],[{id:"c"},{id:"d"},{id:"b"}]);
 assert.deepEqual(list.map(x=>x.id),["b","c","d"]);
});
test("mobile resets pagination on context, filters and first-page changes",()=>{
 const hook=readFileSync("masjid-mobile/src/useGatheringPages.ts","utf8");
 const screen=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 assert.match(hook,/const key=\(path\|\|""\)\+"#"\+contextVersion/);
 assert.match(hook,/\},\[key,first\]\)/);
 assert.match(hook,/generation\.current!==startingGeneration/);
 assert.match(hook,/first\.organization\?\.id!==page\.organization\?\.id/);
 assert.match(screen,/t\(paged\.busy\?"detail\.loadingMore":"detail\.loadMore"\)/);
 assert.match(screen,/t\("detail\.refreshList"\)/);
 const locale=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(locale,/"detail\.loadMore":\{en:"Load more published gatherings",ar:".+"\}/);
 assert.match(locale,/"detail\.refreshList":\{en:"Refresh list to restart",ar:".+"\}/);
});

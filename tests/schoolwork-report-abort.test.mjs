import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("private report requests are aborted on refresh and unmount",()=>{
 const source=readFileSync("staff-web/src/app/admin/schoolwork/page.tsx","utf8");
 for(const guard of [
  "const reviewController=useRef<AbortController|null>(null)",
  "reviewController.current?.abort();",
  "reviewController.current=controller;",
  'fetch("/api/v1/schoolwork",{cache:"no-store",signal:controller.signal})',
  'reportPage<ReviewItem>("draft",undefined,controller.signal)',
  'reportPage<PublishedItem>("published",undefined,controller.signal)',
  'reportPage<ReviewItem>("draft",cursor,controller.signal)',
  'reportPage<PublishedItem>("published",cursor,controller.signal)',
  "if(epoch!==reviewEpoch.current||controller.signal.aborted)return;",
  "reviewEpoch.current++;reviewController.current?.abort();reviewController.current=null",
  "if(epoch===reviewEpoch.current&&!controller.signal.aborted)"
 ])assert.ok(source.includes(guard),"Missing private report request safeguard: "+guard);
 assert.match(source,/fetch\("\/api\/v1\/admin\/school-reports\?"\+qs\.toString\(\),\{cache:"no-store",signal\}\)/);
});

test("private report archive rejects malformed or incomplete pagination metadata",()=>{
 const source=readFileSync("staff-web/src/app/admin/schoolwork/page.tsx","utf8");
 for(const guard of [
  'result.items.length>50',
  'result.pageSize!==50',
  'typeof result.complete!=="boolean"',
  'result.complete?result.nextCursor!==null',
  'typeof result.nextCursor!=="string"',
  '!/^[-_A-Za-z0-9]{8,128}$/.test(result.nextCursor)',
  'typeof item.summary!=="string"',
  'typeof item.id!=="string"',
  'typeof item.id!=="string"'
 ])assert.ok(source.includes(guard),"Missing private archive response validation: "+guard);
});

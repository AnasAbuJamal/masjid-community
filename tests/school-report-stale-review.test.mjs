import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// F-019: old private pages must not repopulate the review UI after a
// new auth read (including a failed read) or component unmount.
test("school report history invalidates stale private responses",()=>{
 const src=readFileSync("staff-web/src/app/admin/schoolwork/page.tsx","utf8");
 assert.match(src,/const reviewEpoch=useRef\(0\)/);
 assert.match(src,/const epoch=\+\+reviewEpoch\.current;[\s\S]*?setPageLoading\(null\)/);
 assert.match(src,/return \(\)=>\{reviewEpoch\.current\+\+;reviewController\.current\?\.abort\(\);reviewController\.current=null\}/);
 const refresh=src.slice(src.indexOf(" const refresh=useCallback"),src.indexOf(" const chosen="));
 assert.match(refresh,/if\(epoch!==reviewEpoch\.current\)return;\s*setClasses\(/);
 assert.match(refresh,/catch\(e\)\{\s*if\(epoch!==reviewEpoch\.current\)return;\s*setClasses\(\[\]\)/);
 const load=src.slice(src.indexOf(" async function loadMore("),src.indexOf(" async function reviewReport("));
 assert.equal(load.match(/if\(epoch!==reviewEpoch\.current\|\|controller\.signal\.aborted\)return;/g)?.length,2);
 assert.match(load,/if\(epoch===reviewEpoch\.current&&!controller\.signal\.aborted\)\s*setError\(/);
 assert.match(load,/finally\{if\(epoch===reviewEpoch\.current&&!controller\.signal\.aborted\)setPageLoading\(null\);\}/);
});

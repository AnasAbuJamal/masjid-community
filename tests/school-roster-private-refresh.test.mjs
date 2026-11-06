// Regression contract for private school roster reauthorization.
// This source test runs without a database or privileged school records.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../staff-web/src/app/admin/school/page.tsx",import.meta.url),"utf8");
const expect=(re,message)=>assert.match(source,re,message);
expect(/const requestVersion=useRef\(0\)/,"refreshes must have a monotonic request generation");
expect(/activeRequest\.current\?\.abort\(\)/,"old in-flight private requests must be cancelled");
expect(/setData\(null\);\s*setNotice\("?"\);\s*setError\("?"\)/,"clear previous private roster before reauthorizing");
expect(/signal:controller\.signal/,"fetch must be abortable");
expect(/!mounted\.current\|\|controller\.signal\.aborted\|\|version!==requestVersion\.current/g,"success and error paths must both reject stale responses");
expect(/if\(!res\.ok\)throw new Error/,"unauthorized refresh must not populate the roster");
expect(/catch\(e\)\{[\s\S]*?setData\(null\);\s*setError\(/,"failed current refresh must keep private roster cleared");
expect(/return \(\)=>\{\s*mounted\.current=false;\s*\+\+requestVersion\.current;\s*activeRequest\.current\?\.abort\(\)/,"unmount must invalidate and abort private reads");
console.log("School roster privacy refresh source guards verified.");

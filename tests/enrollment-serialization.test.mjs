import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("child application authorization, program scope and duplicate check are transactional",()=>{
 const s=read("staff-web/src/app/api/v1/enrollment/route.ts");
 assert.match(s,/\$transaction\(async tx=>/);
 assert.match(s,/tx\.user\.findFirst\(/);
 assert.match(s,/tx\.schoolProgram\.findFirst\(/);
 assert.match(s,/tx\.enrollmentApplication\.findFirst\(/);
 assert.match(s,/tx\.enrollmentApplication\.create\(/);
 assert.match(s,/isolationLevel:Prisma\.TransactionIsolationLevel\.Serializable/);
 assert.match(s,/APPLICATION_CHANGED/);
 assert.match(s,/\.strict\(\)/);
});
test("isolated CI submits a concurrent duplicate and expects one pending row",()=>{
 const s=read("staff-web/scripts/test-school-scope.mjs");
 assert.match(s,/concurrencyLabel="CI-Race-"/);
 assert.match(s,/Promise\.all\(\[/);
 assert.match(s,/parallel\.map\(x=>x\.status\)\.sort\(\),\[201,409\]/);
 assert.match(s,/serialized duplicate detection persisted exactly one pending application/);
});

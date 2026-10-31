import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("student reclassification revokes previously approved circle-private reads",()=>{
 const source=read("staff-web/src/app/api/v1/circles/mine/route.ts");
 assert.match(source,/if\(member\.role==="student"\)/);
 assert.match(source,/ADULT_ONLY/);
 const integration=read("staff-web/scripts/test-circles.mjs");
 assert.match(integration,/reclassified student cannot read private updates/);
 assert.match(integration,/blockedMine\.error\.code,"ADULT_ONLY"/);
});
test("new circles check host eligibility inside serializable audit transaction",()=>{
 const source=read("staff-web/src/app/api/v1/admin/circles/route.ts");
 assert.match(source,/tx\.user\.findFirst\(/);
 assert.match(source,/isolationLevel:Prisma\.TransactionIsolationLevel\.Serializable/);
 assert.match(source,/tx\.auditEvent\.create\(/);
 assert.match(source,/\.strict\(\)/);
});

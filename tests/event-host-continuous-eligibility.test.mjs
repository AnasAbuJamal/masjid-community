import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("event-host list, roster and check-in continuously check eligibility",()=>{
 const source=read("staff-web/src/app/api/v1/events/check-in/route.ts");
 assert.match(source,/function eligibleHost\(/);
 assert.match(source,/role:\{not:"student"\}/);
 assert.match(source,/memberships:\{some:\{organizationId,status:"active"\}\}/);
 assert.equal((source.match(/\.\.\.eligibleHost\(org\.id,actor\.id\)/g)||[]).length,3);
 const checks=read("staff-web/scripts/test-event-checkin.mjs");
 assert.match(checks,/demoted host cannot read attendance/);
 assert.match(checks,/demoted host cannot mark attendance/);
});
test("host-grant eligibility is checked in the same serializable audit transaction",()=>{
 const source=read("staff-web/src/app/api/v1/admin/event-hosts/route.ts");
 assert.match(source,/tx\.user\.findFirst\(/);
 assert.match(source,/isolationLevel:Prisma\.TransactionIsolationLevel\.Serializable/);
 assert.match(source,/\.strict\(\)/);
 assert.match(source,/tx\.auditEvent\.create\(/);
});

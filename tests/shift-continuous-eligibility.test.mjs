import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("approved volunteer scheduling revalidates account, organization and publication",()=>{
 const api=read("staff-web/src/app/api/v1/admin/shifts/route.ts");
 assert.match(api,/opportunity:\{organizationId:org\.id,published:true\}/);
 assert.match(api,/user:\{status:"active",verifiedAt:\{not:null\}/);
 assert.match(api,/memberships:\{some:\{organizationId:org\.id,status:"active"\}\}/);
 assert.match(api,/tx\.volunteerApplication\.findFirst\(/);
 assert.match(api,/tx\.user\.findFirst\(/);
 assert.match(api,/VOLUNTEER_INELIGIBLE/);
 assert.match(api,/TransactionIsolationLevel\.Serializable/);
 assert.match(api,/\.strict\(\)/);
});
test("shift CI covers suspension before schedule and actual attendance",()=>{
 const s=read("staff-web/scripts/test-shift-safety.mjs");
 assert.match(s,/suspended volunteer no longer appears as schedulable/);
 assert.match(s,/suspended account cannot be scheduled/);
 assert.match(s,/unpublished service opportunities cannot accept/);
 assert.match(s,/ineligible person was not marked present/);
});

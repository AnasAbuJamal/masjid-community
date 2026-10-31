import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("guardian link needs explicit evidence category and current account ownership checks",()=>{
 const s=read("staff-web/src/app/api/v1/admin/school/route.ts");
 assert.match(s,/verificationConfirmed:z\.literal\(true\)/);
 assert.match(s,/verificationBasis:z\.enum/);
 assert.match(s,/tx\.student\.findFirst\(/);
 assert.match(s,/tx\.user\.findFirst\(/);
 assert.match(s,/GUARDIAN_REVOKED/);
 assert.match(s,/action:"school\.guardian\.verified"/);
 assert.match(s,/reviewStage:"single_admin_pilot"/);
 assert.match(s,/isolationLevel:Prisma\.TransactionIsolationLevel\.Serializable/);
});
test("staff UI requires deliberate verification and CI checks idempotent audited creation",()=>{
 const ui=read("staff-web/src/app/admin/school/page.tsx");
 assert.match(ui,/guardianConfirmed/);
 assert.match(ui,/Evidence category reviewed/);
 const ci=read("staff-web/scripts/test-school-scope.mjs");
 assert.match(ci,/denied guardian-link validation does not mutate child access/);
 assert.match(ci,/idempotent guardian recheck must not falsely record another approval/);
 assert.match(ci,/verified non-student|verificationConfirmed:true/);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("approved volunteer scheduling revalidates account, organization and publication",()=>{
 const api=read("staff-web/src/app/api/v1/admin/shifts/route.ts");
 assert.match(api,/opportunity:\{organizationId:org\.id,published:true\}/);
 assert.match(api,/user:\{status:"active",role:\{not:"student"\},verifiedAt:\{not:null\}/);
 assert.equal((api.match(/role:\{not:"student"\}/g)||[]).length,3,
  "current-role exclusion applies to list, scheduling and check-in");
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
 assert.match(s,/student-role accounts never appear as eligible volunteers/);
 assert.match(s,/student role blocks arrival despite a still-approved historical application/);
});
test("staff attendance corrections are reasoned, scoped, version-aware and tested",()=>{
 const api=read("staff-web/src/app/api/v1/admin/shifts/route.ts");
 assert.match(api,/kind:z.literal\("correct"\)/);
 assert.match(api,/reason:z.string\(\).trim\(\).min\(12\).max\(500\)/);
 assert.match(api,/opportunity:\{organizationId:org.id\}/);
 assert.match(api,/correctedAt\.getTime\(\)/);
 assert.match(api,/checkedInAt:shift.checkedInAt/);
 assert.match(api,/CORRECTION_WINDOW_CLOSED/);
 assert.match(api,/COMPLETED_SHIFT/);
 assert.match(api,/previousCheckedInAt/);
 assert.match(api,/notifyUser\(tx,org.id,shift.userId,"Volunteer attendance corrected"/);
 const ui=read("staff-web/src/app/admin/volunteers/page.tsx");
 assert.match(ui,/Save audited correction/);
 assert.match(ui,/Keep original record/);
 assert.match(ui,/clearPrivateShifts/);
 assert.match(ui,/visibilitychange/);
 assert.match(ui,/pagehide/);
 assert.match(ui,/45_000/);
 assert.match(ui,/generation.current\+\+/);
 assert.match(ui,/version!==generation.current\|\|document.hidden/);
 assert.match(ui,/setApps\(\[\]\);setShifts\(\[\]\)/);
 assert.match(ui,/cache:"no-store"/);
 assert.doesNotMatch(api,/user:\{select:\{firstName:true,lastName:true,email:true\}\}/);
 const integration=read("staff-web/scripts/test-shift-safety.mjs");
 assert.match(integration,/corrections require an actual reason/);
 assert.match(integration,/foreign shift correction denied/);
 assert.match(integration,/completed shift can have a reasoned time-only correction/);
 assert.match(integration,/a mistaken uncompleted check-in with reason/);
});


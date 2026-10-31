import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("teacher deadlines are explicitly mosque-local and DST-validated",()=>{
 const src=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 const ui=read("staff-web/src/app/admin/schoolwork/page.tsx");
 for(const token of ["assignment-local","resolveMosqueLocalTime(input.dueLocal,org.timeZone)",
  "Select a unique valid deadline","timeZone:org.timeZone"]){
  assert.ok(src.includes(token),token);
 }
 for(const token of ['kind:"assignment-local"',"dueLocal:dueAt",
  "disabled={busy||!classId","mosque-local","displayDue(a.dueAt)"]){
  assert.ok(ui.includes(token),token);
 }
 assert.ok(!ui.includes("new Date(dueAt).toISOString()"));
 const test=read("staff-web/scripts/test-schoolwork-submissions.mjs");
 for(const token of ["AMBIGUOUS_LOCAL_TIME","NONEXISTENT_LOCAL_TIME",
  "2032-06-10T14:15:00.000Z"]){
  assert.ok(test.includes(token),token);
 }
});
test("students see verified mosque due date or explicitly marked UTC fallback",()=>{
 const route=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 const screen=read("masjid-mobile/app/school/work.tsx");
 assert.ok(route.includes('mode:"family",organization:{name:org.name,timeZone:org.timeZone}'));
 assert.ok(screen.includes("result.data?.organization?.timeZone"));
 assert.ok(screen.includes('date.toISOString()+" (UTC)"'));
 assert.ok(screen.includes('t("schoolwork.due")'));
});

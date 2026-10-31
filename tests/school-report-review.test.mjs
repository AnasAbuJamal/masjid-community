import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("all student progress reports require independent authorized publication",()=>{
 const route=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 for(const token of ["REPORT_REVIEW_REQUIRED","export async function PATCH",
  'requireVerified(req,["admin"])','INDEPENDENT_REVIEW_REQUIRED',
  'status:"draft"','school.report.publish','school.report.reject',
  'REPORT_STUDENT_INACTIVE','REPORT_AUTHOR_UNASSIGNED',
  'Prisma.TransactionIsolationLevel.Serializable',
  'publishedAt:published?new Date():null','status:published?"published":"archived"']){
  assert.ok(route.includes(token),token);
 }
 assert.ok(route.includes('status:"published",classSection:{program:{organizationId:org.id}}'),
  "family summaries must remain published-only");
 assert.ok(route.includes('user.role==="admin"?await db.studentReport.findMany'));
 assert.ok(route.includes('take:50'));
 assert.ok(!route.includes('status:input.published?"published":"draft"'));
});
test("teacher form saves private drafts and admin has a distinct review queue",()=>{
 const ui=read("staff-web/src/app/admin/schoolwork/page.tsx");
 assert.ok(ui.includes('summary:instructions,published:false'));
 assert.ok(ui.includes('pendingReports.map'));
 assert.ok(ui.includes('item.selfAuthored'));
 assert.ok(ui.includes('window.confirm('));
 assert.ok(ui.includes('reviewReport(item,"publish-report")'));
 assert.ok(ui.includes('reviewReport(item,"reject-report")'));
 assert.ok(read(".github/workflows/verify.yml").includes("test-school-report-review.mjs"));
});

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

test("published reports can be independently retracted without leaking child narratives",()=>{
 const api=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 const ui=read("staff-web/src/app/admin/schoolwork/page.tsx");
 for(const token of ['"retract-report"','"privacy-concern"','"safeguarding-review"',
  'if(isRetraction){','status:"published",student:schoolStudentScope(org.id)',
  'id:report.id,status:"published"','action:"school.report.retract"',
  'await notifyUser(tx,org.id,userId','approvedAt:{not:null},revokedAt:null',
  'status:"archived" as const']){
  assert.ok(api.includes(token),"Missing safe report withdrawal policy: "+token);
 }
 for(const token of ['publishedReports.map','item.selfAuthored','retractReport(item)',
  'action:"retract-report"','window.confirm(']){
  assert.ok(ui.includes(token),"Missing independent staff UI: "+token);
 }
 const ci=read("staff-web/scripts/test-school-report-review.mjs");
 for(const token of ['publishedQueue','recipientNotices.length,1','retracted.data.notificationsQueued',
  'updatedReport.publishedAt','school.report.retract']){
  assert.ok(ci.includes(token),"Missing integration evidence: "+token);
 }
});

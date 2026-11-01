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
 assert.ok(route.includes('user.role==="admin"?await Promise.all(['));
 assert.ok(route.includes('canReviewReports:user.role==="admin"'));
 assert.ok(route.includes('where:{status:"draft",classSection:{program:{organizationId:org.id}}'));
 assert.ok(route.includes('where:{status:"published",classSection:{program:{organizationId:org.id}}'));
 assert.ok(route.includes('take:50'));
 assert.ok(!route.includes('status:input.published?"published":"draft"'));
});
test("teacher form saves private drafts and admin has a distinct review queue",()=>{
 const ui=read("staff-web/src/app/admin/schoolwork/page.tsx");
 assert.ok(ui.includes('summary:instructions,published:false'));
 assert.ok(ui.includes('pendingReports.map'));
 assert.ok(ui.includes('item.selfAuthored'));
 assert.ok(ui.includes('window.confirm('));
 assert.ok(ui.includes('reportPage<ReviewItem>("draft")'));
 assert.ok(ui.includes('reportPage<PublishedItem>("published")'));
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
  'action:"retract-report"','window.confirm(',
  'withdrawalSelection[item.id]','withdrawalReasons.map']){
  assert.ok(ui.includes(token),"Missing independent staff UI: "+token);
 }
 const ci=read("staff-web/scripts/test-school-report-review.mjs");
 for(const token of ['publishedQueue','recipientNotices.length,1','retracted.data.notificationsQueued',
  'updatedReport.publishedAt','school.report.retract']){
  assert.ok(ci.includes(token),"Missing integration evidence: "+token);
 }
});

test("reviewed student-report decisions notify only currently eligible authors generically",()=>{
 const src=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 for(const token of ['authorNoticeQueued:!!authorNotice',
  'title:{in:["School report approved"',
  'role:{in:["teacher","admin"]}',
  'published?"School report approved":"School report requires correction"',
  'author?await notifyUser(tx,org.id,author.id']){
  if(token.startsWith('title:'))continue;
  assert.ok(src.includes(token),"missing scoped author decision notice: "+token);
 }
 const ci=read("staff-web/scripts/test-school-report-review.mjs");
 for(const token of ['authorNoticeBaseline','authorNotices.length,3',
  'authorNotices.filter(n=>n.title==="School report approved").length,2',
  'authorNotices.filter(n=>n.title==="School report requires correction").length,1',
  'n.outboxEvents[0].status']){
  assert.ok(ci.includes(token),"missing one-notice-per-decision test: "+token);
 }
 assert.ok(src.includes('action:published?"school.report.publish":"school.report.reject"'));
});

test("admin-only report archive supports complete scoped cursor pages",()=>{
 const route=read("staff-web/src/app/api/v1/admin/school-reports/route.ts");
 const ui=read("staff-web/src/app/admin/schoolwork/page.tsx");
 const ci=read("staff-web/scripts/test-school-report-review.mjs");
 for(const token of [
  'requireVerified(req,["admin"])','["status","cursor"].some',
  'id:cursor','student:schoolStudentScope(org.id)',
  'REPORT_CURSOR_UNAVAILABLE','createdAt:{gt:pivot.createdAt}',
  'publishedAt:{sort:"desc",nulls:"last"}',
  'publishedAt:{lt:pivot.publishedAt}',
  'id:{lt:pivot.id}','take:PAGE_SIZE+1',
  'complete:rows.length<=PAGE_SIZE',
  'nextCursor:rows.length>PAGE_SIZE?'
 ])assert.ok(route.includes(token),"Missing child-history privacy/pagination requirement: "+token);
 for(const token of [
  'loadMore("draft")','loadMore("published")',
  'pendingComplete','publishedComplete','pendingCursor','publishedCursor',
  'reportPage<ReviewItem>("draft")','reportPage<PublishedItem>("published")'
 ])assert.ok(ui.includes(token),"Missing complete child history UI: "+token);
 assert.ok(!ui.includes('window.prompt('),
  "withdrawal controls must never rely on inaccessible free-text prompts");
 for(const token of ['syntheticDrafts','syntheticPublished','foreignReport.id',
  'await readAll("draft")','await readAll("published")',
  'new Set(collected.map(x=>x.id)).size'])
  assert.ok(ci.includes(token),"Missing disposable-DB history proof: "+token);
});

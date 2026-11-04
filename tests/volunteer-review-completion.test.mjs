import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const api=readFileSync('staff-web/src/app/api/v1/admin/route.ts','utf8');
const ui=readFileSync('staff-web/src/app/admin/page.tsx','utf8');
test('volunteer decisions persist bounded reason and attributable audit in transaction',()=>{
 assert.match(api,/reason:z\.string\(\)\.trim\(\)\.min\(5\)\.max\(1000\)/);
 assert.match(api,/decisionReason:input.reason,reviewedAt,reviewedById:user.id/);
 assert.match(api,/tx.auditEvent.create/);
 assert.match(api,/reason:input.reason/);
});
test('volunteer queue is scoped, bounded and traversable without display slicing',()=>{
 assert.match(api,/applicationPage/);
 assert.match(api,/applicationsLimit/);
 assert.match(api,/cursor\.organizationId!==org.id/);
 assert.match(api,/id:\{gt:afterId\}/);
 assert.doesNotMatch(api,/volunteerApplication.findMany\(\{where:\{opportunity:\{organizationId:org.id\}\},take:15/);
 assert.doesNotMatch(ui,/applications.slice\(0,8\)/);
 assert.match(ui,/applicationPage.nextCursor/);
 assert.match(ui,/minLength=\{5\}/);
});

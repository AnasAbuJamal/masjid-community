import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("operational support is a dedicated bounded, time-limited and audited capability",()=>{
 const route=read("staff-web/src/app/api/v1/admin/support/route.ts");
 const schema=read("staff-web/prisma/schema.prisma");
 const grant=read("staff-web/src/app/api/v1/admin/team/route.ts");
 const migration=read("staff-web/prisma/migrations/20261101130000_support_register/migration.sql");
 const view=read("staff-web/src/app/admin/support/page.tsx");
 const integration=read("staff-web/scripts/test-support-cases.mjs");
 for(const v of ['requireVerified(req,["staff"])','!user.mfaEnabled||!user.mfaVerified',
  'capability:"support_manage"','expiresAt:{gt:new Date()}',
  'appendIntegrityAudit(tx,','action:"support.case.read"',
  'action:"support.case.list"','action:"support.note.record"',
  'action:"support.case.status"','organizationId:org.id',
  'nextCursor:rows.length>PAGE_SIZE','take:PAGE_SIZE+1']){
  assert.ok(route.includes(v),"Missing support privacy requirement: "+v);
 }
 assert.ok(schema.includes('support_manage'));
 assert.ok(schema.includes('model SupportCaseNote {'));
 assert.ok(!schema.slice(schema.indexOf('model SupportCase {')).includes('body String'));
 assert.ok(migration.includes('CHECK ("category" IN'));
 assert.ok(migration.includes('CHECK ("status" IN'));
 assert.ok(migration.includes('CHECK ("code" IN'));
 assert.ok(grant.includes('const maxDays=support?7:30'));
 assert.ok(view.includes('Load 50 older cases'));
 assert.ok(view.includes('Load 50 older investigation notes'));
 assert.ok(!view.includes('<textarea'));
 for(const token of ['expiresAt:new Date(Date.now()-1000)',
  'new Set(notes.map(x=>x.id)).size','foreignNote.id',
  'kind:"revoke"','x.action==="support.case.read"']){
  assert.ok(integration.includes(token),"Missing disposable CI support proof: "+token);
 }
});

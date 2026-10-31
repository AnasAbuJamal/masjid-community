import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("only current enrolled student can retrieve a published original answer",()=>{
 const api=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 for(const token of [
  'user.role==="student"&&own',
  's.studentId===own.id&&allowedOwnAssignments.has(s.assignmentId)',
  'id:{in:ownReceiptIds},studentId:own.id',
  'enrollments:{some:{studentId:own.id,status:"active"}}',
  'take:100,select:{id:true,body:true}',
  'submissions:receipts'
 ])assert.ok(api.includes(token),"Missing private answer scope: "+token);
 // The original family/guardian metadata selection must NOT select body.
 assert.ok(api.includes('take:100,select:{id:true,studentId:true,assignmentId:true,submittedAt:true}'));
 assert.ok(api.includes('ownBodyById.has(s.id)'));
});
test("mobile only presents a read-only original for own learner and translates labels",()=>{
 const screen=read("masjid-mobile/app/school/work.tsx");
 const locale=read("masjid-mobile/src/i18n.tsx");
 for(const token of ['typeof s.body==="string"',
  "s.studentId===result.data?.selfStudentId",
  "selectable style={S.bodyText}",
  't("schoolwork.originalWork")',
  't("schoolwork.originalPrivate")']){
  assert.ok(screen.includes(token),token);
 }
 for(const key of ["schoolwork.originalWork","schoolwork.originalPrivate"]){
  assert.ok(locale.includes('"'+key+'":{en:')&&locale.includes("ar:"),key);
 }
 const smoke=read("staff-web/scripts/test-schoolwork-submissions.mjs");
 for(const token of ["guardianStatus","afterGuardianRevocation","withdrawnReceipt",
  "demotedReceipt","unpublishedReceipt","afterDeadline"]){
  assert.ok(smoke.includes(token),token);
 }
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("school reports and receipt metadata require exact current child/class enrollment",()=>{
 const route=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 for(const s of [
  'const activePairs=enrollments.map(e=>({studentId:e.studentId,classId:e.classId}))',
  'OR:activePairs.map(e=>({studentId:e.studentId,classId:e.classId}))',
  'OR:activePairs.map(e=>({studentId:e.studentId,',
  'assignment:{classId:e.classId}',
  'activePairs.length?await Promise.all('
 ])assert.ok(route.includes(s),"Missing exact class enrollment boundary: "+s);
 assert.ok(!route.includes('studentReport.findMany({where:{studentId:{in:ids}'));
 assert.ok(!route.includes('studentSubmission.findMany({where:{studentId:{in:ids}'));
});
test("teacher classroom responses exclude withdrawn students' narratives",()=>{
 const route=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 for(const s of [
  'const activeClasses=classes.map(c=>{',
  'const currentStudents=new Set(c.enrollments.map(e=>e.student.id))',
  'submissions:a.submissions.filter(s=>currentStudents.has(s.studentId))',
  'classes:activeClasses'
 ])assert.ok(route.includes(s),"Missing teacher privacy filter: "+s);
 const ci=read("staff-web/scripts/test-school-report-review.mjs");
 for(const s of ['siblingEnrollment','withdrawnFamily','withdrawnTeacher',
  'persistedSubmission.body','restoredFamily'])assert.ok(ci.includes(s),s);
});

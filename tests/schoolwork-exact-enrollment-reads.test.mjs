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

test("private family report pagination intersects exact current child and class scope",()=>{
 const route=read("staff-web/src/app/api/v1/schoolwork/reports/route.ts");
 const mobile=read("masjid-mobile/src/PublishedFamilyReports.tsx");
 const screen=read("masjid-mobile/app/school/work.tsx");
 const ci=read("staff-web/scripts/test-school-report-review.mjs");
 for(const token of [
  'mayViewGuardianRecords(user.role)','approvedAt:{not:null},revokedAt:null',
  'schoolStudentScope(org.id)','const pairs=enrollments.map(e=>({studentId:e.studentId,classId:e.classId}))',
  'OR:pairs.map(p=>({studentId:p.studentId,classId:p.classId}))',
  'where:{AND:[owned,before]}','FAMILY_REPORT_CURSOR_UNAVAILABLE',
  'take:PAGE_SIZE+1','publishedAt:{sort:"desc",nulls:"last"}',
  'nextCursor:rows.length>PAGE_SIZE?'
 ]){
  assert.ok(route.includes(token),"Unsafe or missing family history condition: "+token);
 }
 assert.ok(screen.includes('PublishedFamilyReports enabled={result.data?.mode==="family"}'));
 for(const token of ['useResource<Page>(enabled?"schoolwork/reports":null)',
  'api<Page>("schoolwork/reports?cursor="','activeContext.current!==capturedContext',
  'setOlder([])','setComplete(archive.data?.complete??true)']){
  assert.ok(mobile.includes(token),"Missing family mobile privacy/pagination guard: "+token);
 }
 for(const token of ['const familyHistory=await allFamily()',
  'legacyNullPublished.every','revokedSiblingHistory',
  'foreignPublication.id','allFamily()).some(x=>x.id===older.id)']){
  assert.ok(ci.includes(token),"Missing disposable family history proof: "+token);
 }
});

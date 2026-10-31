import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("role policy allows own student account but not historical guardian access",()=>{
 const policy=read("staff-web/src/lib/school-role-policy.ts");
 assert.match(policy,/role!=="student"/);
 assert.match(policy,/role==="teacher"\|\|role==="admin"/);
 for(const name of ["students","me","schoolwork","invoices"]){
  const code=read("staff-web/src/app/api/v1/"+name+"/route.ts");
  assert.match(code,/mayViewGuardianRecords\(/,name);
 }
 for(const name of ["students","me"]){
  const code=read("staff-web/src/app/api/v1/"+name+"/route.ts");
  assert.match(code,/mayViewTeacherRosters\(/,name);
 }
});
test("synthetic school CI covers demoted teaching and student guardian records",()=>{
 const ci=read("staff-web/scripts/test-school-scope.mjs");
 assert.match(ci,/former teacher cannot read student names/);
 assert.match(ci,/student-reclassified guardian cannot see a linked child's school profile/);
 assert.match(ci,/student-reclassified guardian loses private child invoice visibility/);
 assert.match(ci,/former guardian link cannot expose child reports/);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("student submissions are scoped and immutable within a serializable transaction",()=>{
 const src=read("staff-web/src/app/api/v1/schoolwork/route.ts");
 assert.match(src,/user\.role!=="student"/);
 assert.match(src,/db\.\$transaction\(async tx=>\{/);
 assert.match(src,/schoolStudentScope\(org\.id\)/);
 assert.match(src,/published:true/);
 assert.match(src,/status:"active"/);
 assert.match(src,/SUBMISSION_FINAL/);
 assert.match(src,/DUE_DATE_PASSED/);
 assert.match(src,/SUBMISSION_CHANGED/);
 assert.match(src,/Prisma\.TransactionIsolationLevel\.Serializable/);
 assert.match(src,/school\.submission\.create/);
 assert.doesNotMatch(src,/studentSubmission\.upsert/);
});
test("native learner sees explicit bilingual final-submit policy",()=>{
 const mobile=read("masjid-mobile/app/school/work.tsx");
 const locale=read("masjid-mobile/src/i18n.tsx");
 assert.match(mobile,/schoolwork\.finalHint/);
 assert.match(mobile,/schoolwork\.submitted/);
 assert.match(mobile,/disabled=\{busy\|\|!body\.trim\(\)\}/);
 for(const key of ["schoolwork.finalHint","schoolwork.submitted","schoolwork.submitError"]){
  assert.ok(locale.includes('"'+key+'":{en:')&&locale.includes('ar:'),key);
 }
 assert.match(read(".github/workflows/verify.yml"),/test-schoolwork-submissions\.mjs/);
});

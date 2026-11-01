import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("schoolwork screen translates interface labels in English and Arabic",()=>{
 const ui=read("masjid-mobile/app/school/work.tsx");
 const familyArchive=read("masjid-mobile/src/PublishedFamilyReports.tsx");
 const completeUi=ui+"\\n"+familyArchive;
 const lang=read("masjid-mobile/src/i18n.tsx");
 const keys=[
  "schoolwork.back","schoolwork.eyebrow","schoolwork.title",
  "schoolwork.subtitle","schoolwork.classAssignments",
  "schoolwork.published","schoolwork.draft","schoolwork.teacherPortal",
  "schoolwork.yourSubmission","schoolwork.submitAssignment",
  "schoolwork.writeSubmission","schoolwork.publishedReports"
 ];
 for(const key of keys){
  assert.ok(completeUi.includes('"'+key+'"'),"missing localized UI key "+key);
  assert.ok(lang.includes('"'+key+'":{en:')&&lang.includes('ar:'),
   "missing bilingual dictionary entry "+key);
 }
 assert.ok(ui.includes('t("settings.cancel")'));
 assert.ok(!ui.includes('label="Submit assignment"'));
 assert.ok(!ui.includes('title="Learning in progress."'));
 assert.ok(!completeUi.includes('>Published progress reports</Text>'));
 // Published child content is never automatically translated/rewritten.
 assert.ok(ui.includes('{a.instructions}'));
 assert.ok(familyArchive.includes('{r.summary}'));
 assert.ok(ui.includes('PublishedFamilyReports'));
 assert.ok(ui.includes('{s.body}'));
});
test("RTL schoolwork and unpublished drafts are scoped to the current session",()=>{
 const ui=read("masjid-mobile/app/school/work.tsx");
 for(const token of [
  'const {t,language,isRTL}=useLanguage()',
  'const {contextVersion}=useSession()',
  'const align=isRTL?"right":"left"',
  'activeContext.current=contextVersion',
  'setExpanded("");setBody("");setBusy(false);setError("");setNotice("");',
  'activeContext.current!==sendingContext',
  'activeContext.current===sendingContext',
  'textAlign:align',
  'accessibilityRole="alert"'
 ])assert.ok(ui.includes(token),"missing privacy/RTL behavior: "+token);
 assert.ok(read("masjid-mobile/src/useResource.ts").includes('const key=(path||"")+"#"+contextVersion'));
});

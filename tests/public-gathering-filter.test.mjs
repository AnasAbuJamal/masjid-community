import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("public gathering HTML filters never choose a tenant and fail closed",()=>{
 const page=read("staff-web/src/app/visit/page.tsx");
 assert.match(page,/publishedGatheringPage\(organization\.id,gatheringFilters\(gatherParams\)\)/);
 assert.match(page,/filterInvalid/);
 assert.match(page,/role="alert"/);
 assert.match(page,/const safeEvents=eventPage\.items/);
 assert.match(page,/gatherCursor/);
 assert.match(page,/t\("moreGatherings"\)/);
 assert.match(read("staff-web/src/lib/visit-i18n.ts"),/Next 25 published gatherings/);
 assert.match(page,/GATHERING_ACCESSIBILITY/);
 assert.match(page,/name="gatherVenue"/);
 assert.match(read("staff-web/scripts/test-public.mjs"),/CI_WEB_FILTERED_GATHERING/);
});
test("Arabic visitor interface switches RTL without changing gathering privacy or filters",()=>{
 const page=read("staff-web/src/app/visit/page.tsx");
 const detail=read("staff-web/src/app/visit/content/[kind]/[id]/page.tsx");
 const css=read("staff-web/src/app/visit/visit.css");
 const smoke=read("staff-web/scripts/test-public.mjs");
 for(const needed of ['const lang=visitLanguage(search.lang)','lang={lang}',
  'dir={lang==="ar"?"rtl":"ltr"}','changeLanguage("ar")',
  'name="lang" value="ar"','visitFacet(lang,"category",x)',
  'visitDate(item.startAt','href(`/visit/content/gatherings/']){
  assert.ok(page.includes(needed),"Missing bilingual published-only guest UI: "+needed);
 }
 assert.ok(detail.includes('visitLanguage((await searchParams).lang)'));
 assert.ok(detail.includes('t("detailCalendarWarn")'));
 assert.ok(detail.includes('dir="auto"'));
 assert.ok(css.includes('.visit[dir="rtl"]'));
 for(const needed of ['const arabic=await fetch','const arabicDetail=await fetch',
  'const arabicFiltered=await fetch','const arabicNext=',
  'name="lang" value="ar"']){
  assert.ok(smoke.includes(needed),"Missing Arabic HTTP smoke: "+needed);
 }
});

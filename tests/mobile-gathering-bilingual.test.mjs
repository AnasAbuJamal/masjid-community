import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 gatheringFilterLabelKey,gatheringContentLabelKey,gatheringContentSubtitleKey
} from "../masjid-mobile/src/gathering-presentation.ts";
import {
 CATEGORIES,AUDIENCES,ACCESSIBILITY,gatheringFilterProblem,
 gatheringFilterError,gatheringCatalogPath
} from "../masjid-mobile/src/gatheringFilters.ts";

test("every server-defined gathering filter value maps to a stable translation key",()=>{
 const translation=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 for(const [group,values] of [
  ["category",CATEGORIES],["audience",AUDIENCES],["accessibility",ACCESSIBILITY]
 ]){
  for(const [value] of values){
   const key=gatheringFilterLabelKey(group,value);
   assert.notEqual(key,"detail.filterUnknown",group+":"+value);
   assert.ok(translation.includes('"'+key+'":{en:'),key);
   assert.match(translation,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'));
  }
 }
 assert.equal(gatheringFilterLabelKey("accessibility","unknown_feature"),"detail.filterUnknown",
  "an unknown accessibility code cannot claim a confirmed accommodation");
 assert.equal(gatheringFilterLabelKey("audience","not-a-target"),"detail.filterUnknown");
});

test("each published content category has bilingual labels and subtitles",()=>{
 const translation=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 for(const kind of ["events","announcements","campaigns","volunteers","programs",
  "jobs","proposals","rentals","articles","construction"]){
  for(const key of [gatheringContentLabelKey(kind),gatheringContentSubtitleKey(kind)]){
   assert.match(translation,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),key);
  }
 }
 assert.equal(gatheringContentLabelKey("unsupported"),"detail.titleDefault");
 assert.equal(gatheringContentSubtitleKey("unsupported"),"detail.published");
});

test("filter error codes preserve actual network-guard behavior and messages",()=>{
 const basic={query:"",fromDay:"",toDay:"",venueId:"",
  category:"",audience:"",accessibility:""};
 for(const [change,code,message] of [
  [{query:"a".repeat(81)},"long","Search is limited to 80 characters."],
  [{fromDay:"2032-02-30"},"start","Use YYYY-MM-DD for the start date."],
  [{toDay:"2032-12-40"},"end","Use YYYY-MM-DD for the end date."],
  [{fromDay:"2032-11-20",toDay:"2032-11-01"},"order","End date must be on or after start date."]
 ]){
  const f={...basic,...change};
  assert.equal(gatheringFilterProblem(f),code);
  assert.equal(gatheringFilterError(f),message);
  assert.equal(gatheringCatalogPath("public/events",f),null);
 }
 assert.equal(gatheringFilterProblem(basic),null);
 assert.equal(gatheringCatalogPath("public/events",basic),"public/events");
});

test("gathering native screen presents important booking statuses without English-only literals",()=>{
 const screen=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 const dictionary=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(screen,/gatheringFilterLabelKey\("accessibility",x\)/);
 assert.match(screen,/gatheringFilterLabelKey\("category",item\.category\)/);
 assert.match(screen,/gatheringFilterLabelKey\("audience",item\.audience\)/);
 assert.match(screen,/gatheringFilterProblem\(filters\)/);
 assert.match(screen,/t\(filterErrorKey\)/);
 assert.match(screen,/flexDirection:isRTL\?"row-reverse":"row"/);
 assert.match(screen,/t\("detail\.accessibilityUnverified"\)/);
 assert.match(screen,/t\("detail\.cancellationDefault"\)/);
 assert.match(screen,/t\("detail\.registration"\)/);
 assert.match(screen,/t\("detail\.calendarShared"\)/);
 assert.match(screen,/t\("detail\.rsvpExpired"\)/);
 assert.match(screen,/t\("detail\.cancelExpired"\)/);
 assert.match(screen,/t\("detail\.shareCalendar"\)/);
 assert.match(screen,/t\("detail\.leftList"\)/);
 assert.match(screen,/t\("detail\.loadMore"\)/);
 assert.doesNotMatch(screen,/label="RSVP to event"/);
 assert.doesNotMatch(screen,/label="Cancel my reservation"/);
 assert.doesNotMatch(screen,/>Accessibility features are not verified for this gathering\.</);
 for(const key of ["detail.rsvp","detail.waitlisted","detail.confirmed",
  "detail.checkedIn","detail.cancelReservation","detail.joinWaitlist",
  "detail.full","detail.noWaitlist","detail.filterDisclaimer"]){
  assert.ok(dictionary.includes('"'+key+'":{en:'),key);
 }
});

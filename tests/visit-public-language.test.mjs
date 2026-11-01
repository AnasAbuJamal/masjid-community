import {test} from "node:test";
import assert from "node:assert/strict";
import {visitLanguage,visitHref,visitText,visitDate,visitLocalDay,visitFacet} from "../staff-web/src/lib/visit-i18n.ts";
test("untrusted language selection accepts only exact Arabic, otherwise English",()=>{
 assert.equal(visitLanguage(undefined),"en");
 assert.equal(visitLanguage("ar"),"ar");
 assert.equal(visitLanguage("ar-EG"),"en");
 assert.equal(visitLanguage(["ar","en"]),"en");
});
test("language links retain venue, search filters, cursor, anchor and deep-links",()=>{
 const source="/visit?venue=venue_safe&gatherQ=food&gatherCursor=cursor_456#gatherings";
 const arabic=visitHref(source,"ar");
 assert.equal(arabic,"/visit?venue=venue_safe&gatherQ=food&gatherCursor=cursor_456&lang=ar#gatherings");
 assert.equal(visitHref(arabic,"en"),source);
 assert.equal(visitHref("/visit/content/learning/abc123456","ar"),"/visit/content/learning/abc123456?lang=ar");
 assert.throws(()=>visitHref("//outside.invalid","ar"),/internal/);
 assert.throws(()=>visitHref("https://outside.invalid","ar"),/internal/);
});
test("public interface, prayer and emergency labels have actual Arabic text",()=>{
 assert.equal(visitText("ar","prayerTimes"),"مواقيت الصلاة");
 assert.equal(visitText("en","prayerTimes"),"Prayer times");
 assert.equal(visitText("ar","emergencyWhatToDo"),"ما الذي يجب فعله:");
 assert.equal(visitText("ar","moreGatherings"),"الـ 25 فعالية المنشورة التالية");
 assert.equal(visitText("ar","originalContent"),"تُعرض نصوص المسجد المنشورة بلغتها الأصلية.");
 assert.equal(visitFacet("ar","category","workshop"),"ورشة عمل");
 assert.equal(visitFacet("en","category","workshop"),"workshop");
 assert.equal(visitFacet("ar","accessibility","quiet_space"),"مكان هادئ");
});
test("Arabic dates use Gregorian calendar, exact timezone and Arabic locale",()=>{
 const d=new Date("2027-01-02T15:45:00.000Z");
 assert.notEqual(visitDate(d,"America/New_York","ar"),visitDate(d,"America/New_York","en"));
 assert.match(visitDate(d,"America/New_York","ar"),/٢٠٢٧|2027/);
 assert.match(visitLocalDay("2027-01-02","ar"),/٢٠٢٧|2027/);
});

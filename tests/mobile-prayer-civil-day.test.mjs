import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publishedPrayerDayLabel} from "../masjid-mobile/src/prayer-civil-day.ts";

test("published prayer civil day is the same calendar date in both supported locales",()=>{
 const english=publishedPrayerDayLabel("2026-11-01","en");
 const arabic=publishedPrayerDayLabel("2026-11-01","ar");
 assert.ok(english&&arabic);
 assert.match(english,/Sunday/);
 assert.match(english,/November 1, 2026/);
 assert.notEqual(english,arabic);
 assert.match(arabic,/٢٠٢٦|2026/);
 // Midnight UTC and the user's phone timezone are deliberately irrelevant:
 // a published civil date remains the same approved day.
 assert.match(publishedPrayerDayLabel("2028-02-29","en"),/February 29, 2028/);
 assert.match(publishedPrayerDayLabel("2026-03-08","en"),/March 8, 2026/);
});

test("malformed or impossible published dates do not turn into different days",()=>{
 for(const date of [
  undefined,null,"","today","2026-2-1","2026-02-30","2027-02-29",
  "2026-13-01","2026-00-01","2026-11-31","2026-11-01T00:00Z",
  "2026-11-01<script>"," 2026-11-01"
 ]){
  assert.equal(publishedPrayerDayLabel(date,"en"),null,String(date));
  assert.equal(publishedPrayerDayLabel(date,"ar"),null,String(date));
 }
});

test("native Today and Salah use published date labels instead of raw ISO dates",()=>{
 const today=readFileSync("masjid-mobile/app/(tabs)/index.tsx","utf8");
 const salah=readFileSync("masjid-mobile/app/(tabs)/salah.tsx","utf8");
 const dictionary=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(today,/publishedPrayerDayLabel\(data\.prayer\.localDate,language\)/);
 assert.match(salah,/publishedPrayerDayLabel\(day\.localDate,language\)/);
 assert.match(today,/t\("home\.dateUnavailable"\)/);
 assert.match(salah,/t\("salah\.dateUnavailable"\)/);
 assert.doesNotMatch(today,/data\.prayer\.localDate\+" · "/);
 assert.doesNotMatch(salah,/>\{day\.localDate\}<\/Text>/);
 for(const key of ["home.dateUnavailable","salah.dateUnavailable"]){
  assert.match(dictionary,new RegExp('"'+key.replace(".","\\.")+'":\\{en:".+",ar:".+"\\}'));
 }
});
